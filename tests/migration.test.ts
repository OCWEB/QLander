import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);
const repo = path.resolve(import.meta.dirname, "..");
const tsx = path.join(repo, "node_modules/.bin/tsx");
const migrate = path.join(repo, "scripts/qlander-migrate.ts");

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "qlander-migrate-"));
  for (const name of ["content", "data", "qlander.manifest.json", "package.json", "astro.config.mjs", "tsconfig.json", "src", "scripts"]) {
    await cp(path.join(repo, name), path.join(root, name), { recursive: true });
  }
  const manifestFile = path.join(root, "qlander.manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.templateVersion = "0.3.0";
  delete manifest.migrations;
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const productFile = path.join(root, "content/products/starter-product.json");
  const product = JSON.parse(await readFile(productFile, "utf8"));
  delete product.kind;
  await writeFile(productFile, `${JSON.stringify(product, null, 2)}\n`);
  const contactFile = path.join(root, "content/pages/contact.json");
  const contact = JSON.parse(await readFile(contactFile, "utf8"));
  delete contact.sections.find((section: any) => section.type === "contact").mode;
  await writeFile(contactFile, `${JSON.stringify(contact, null, 2)}\n`);
  const welcomeFile = path.join(root, "content/blog/welcome.md");
  await writeFile(welcomeFile, (await readFile(welcomeFile, "utf8")).replace(/^routed:.*\n/m, ""));
  return root;
}

async function invoke(root: string, ...args: string[]) {
  try {
    const result = await run(tsx, [migrate, "--root", root, "--to", "0.4.0", "--json", ...args], { cwd: repo });
    return { code: 0, output: `${result.stdout}${result.stderr}` };
  } catch (error: any) {
    return { code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

test("[integration] 0.3.0 migration dry-run is reviewable and makes no changes", async () => {
  const root = await fixture();
  const before = await readFile(path.join(root, "qlander.manifest.json"), "utf8");
  const result = await invoke(root, "--dry-run");
  assert.equal(result.code, 0, result.output);
  const report = JSON.parse(result.output);
  assert.equal(report.dryRun, true);
  assert.equal(report.from, "0.3.0");
  assert.equal(report.to, "0.4.0");
  assert.ok(report.operations.some((item: any) => item.kind === "add-product-kind"));
  assert.ok(report.manualSteps.length > 0);
  assert.equal(await readFile(path.join(root, "qlander.manifest.json"), "utf8"), before);
});

test("[integration] 0.3.0 migration applies safe defaults and is idempotent", async () => {
  const root = await fixture();
  const first = await invoke(root);
  assert.equal(first.code, 0, first.output);
  const manifest = JSON.parse(await readFile(path.join(root, "qlander.manifest.json"), "utf8"));
  assert.equal(manifest.templateVersion, "0.4.0");
  assert.equal(manifest.migrations.length, 1);
  assert.equal(manifest.migrations[0].from, "0.3.0");
  assert.equal(manifest.migrations[0].status, "complete");
  assert.deepEqual(manifest.migrations[0].runtimePending, []);
  assert.equal(JSON.parse(await readFile(path.join(root, "content/products/starter-product.json"), "utf8")).kind, "product");
  const contact = JSON.parse(await readFile(path.join(root, "content/pages/contact.json"), "utf8"));
  assert.equal(contact.sections.find((section: any) => section.type === "contact").mode, "action");
  assert.match(await readFile(path.join(root, "content/blog/welcome.md"), "utf8"), /^routed: true$/m);

  const before = await readFile(path.join(root, "qlander.manifest.json"), "utf8");
  const second = await invoke(root);
  assert.equal(second.code, 0, second.output);
  assert.equal(JSON.parse(second.output).status, "already-current");
  assert.equal(await readFile(path.join(root, "qlander.manifest.json"), "utf8"), before);
});

test("[integration] customized runtime remains pending until explicitly accepted", async () => {
  const root = await fixture();
  const configFile = path.join(root, "astro.config.mjs");
  await writeFile(configFile, `${await readFile(configFile, "utf8")}\n// intentional project customization\n`);

  const pending = await invoke(root);
  assert.notEqual(pending.code, 0, pending.output);
  const pendingReport = JSON.parse(pending.output);
  assert.equal(pendingReport.status, "runtime-pending");
  assert.ok(pendingReport.runtimePending.includes("astro.config.mjs"));
  let manifest = JSON.parse(await readFile(path.join(root, "qlander.manifest.json"), "utf8"));
  assert.equal(manifest.templateVersion, "0.3.0");
  assert.equal(manifest.migrations, undefined);
  assert.equal(JSON.parse(await readFile(path.join(root, "content/products/starter-product.json"), "utf8")).kind, undefined);

  const accepted = await invoke(root, "--accept-custom-runtime");
  assert.equal(accepted.code, 0, accepted.output);
  manifest = JSON.parse(await readFile(path.join(root, "qlander.manifest.json"), "utf8"));
  assert.equal(manifest.templateVersion, "0.4.0");
  assert.equal(manifest.migrations.length, 1);
  assert.equal(manifest.migrations[0].status, "complete");
});

test("[integration] migration rejects unsupported source and target versions", async () => {
  const root = await fixture();
  const manifestFile = path.join(root, "qlander.manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.templateVersion = "0.2.0";
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.notEqual((await invoke(root)).code, 0);
  try {
    await run(tsx, [migrate, "--root", root, "--to", "9.0.0"], { cwd: repo });
    assert.fail("unsupported target should fail");
  } catch (error: any) {
    assert.match(`${error.stderr}${error.stdout}`, /Unsupported target version/);
  }
});

async function designFixture(design: unknown, extra: Record<string, unknown> = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "qlander-design-migrate-"));
  await writeFile(path.join(root, "qlander.manifest.json"), `${JSON.stringify({
    siteId: "legacy", name: "Legacy", template: "wireframe-site-kit",
    templateSource: "https://github.com/OCWEB/QLander", templateVersion: "0.4.0",
    creationMode: "prompted", design, contentRoot: "content", dataRoot: "data",
    editMap: "qlander.edit-map.json", routes: ["/"], ...extra
  }, null, 2)}\n`);
  return root;
}

const designMigrate = async (root: string, ...args: string[]) => {
  try {
    const result = await run(tsx, [migrate, "--root", root, "--design-contract", "--json", ...args], { cwd: repo });
    return { code: 0, output: `${result.stdout}${result.stderr}` };
  } catch (error: any) {
    return { code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
};

const readManifest = async (root: string) => JSON.parse(await readFile(path.join(root, "qlander.manifest.json"), "utf8"));

test("[integration] design-contract migration labels legacy handoffs without claiming research", async () => {
  const root = await designFixture({
    status: "implemented", direction: "Institutional Modern", system: "data/design-system.json",
    handoffs: [
      { kind: "section", id: "home.hero", renderer: "src/design-variants/HeroCentered.astro", routes: ["/"] },
      { kind: "section", id: "home.cta", renderer: "src/design-variants/CtaPanel.astro", routes: ["/"] }
    ]
  });
  assert.equal((await designMigrate(root)).code, 0);
  const manifest = await readManifest(root);

  // Existing work is labelled honestly and never upgraded. A src/design-variants/
  // path proves what the renderer is, so it earns the specific label; anything
  // else is genuinely unknown and says so.
  for (const handoff of manifest.design.handoffs) {
    assert.equal(handoff.provenance, "bundled-variant");
    assert.equal(handoff.blueprintId, undefined);
    assert.equal(handoff.referenceIds, undefined);
  }
  assert.ok(!JSON.stringify(manifest).includes("research-derived"), "migration must never claim research provenance");
  // Existing sites keep building: the gate opens at off, not warn.
  assert.equal(manifest.design.gate, "off");
  // No evidence is fabricated.
  assert.equal(manifest.design.blueprintId, undefined);
});

test("[integration] design-contract migration is idempotent and warns before the next redesign", async () => {
  const root = await designFixture({
    status: "implemented", direction: "D", system: "data/design-system.json",
    handoffs: [
      { kind: "section", id: "home.hero", renderer: "src/design-variants/HeroCentered.astro", routes: ["/"] },
      { kind: "page", id: "/", renderer: "src/design/legacy/HomePage.astro", routes: ["/"] }
    ]
  });
  const first = await designMigrate(root);
  const labelled = await readManifest(root);
  assert.equal(labelled.design.handoffs[0].provenance, "bundled-variant");
  // An unrecognised renderer cannot be proven either way, so it stays unknown
  // rather than being flattered into research-derived.
  assert.equal(labelled.design.handoffs[1].provenance, "legacy-unknown");
  const afterFirst = await readManifest(root);
  const second = await designMigrate(root);
  assert.equal(second.code, 0);
  assert.deepEqual(await readManifest(root), afterFirst, "re-running must change nothing");
  assert.match(first.output, /redesign|research/i, "the report must say what happens at the next prompted redesign");
});

test("[integration] design-contract migration leaves blank projects and research work alone", async () => {
  const blank = await designFixture({
    status: "starter", direction: "QLander starter scaffold", system: "data/design-system.json", handoffs: []
  }, { creationMode: "blank" });
  await designMigrate(blank);
  assert.equal((await readManifest(blank)).design.gate, "off");

  const derived = await designFixture({
    status: "implemented", direction: "D", system: "data/design-system.json",
    gate: "warn", blueprintId: "run-1",
    handoffs: [{
      kind: "page", id: "/", renderer: "src/design/d/HomePage.astro", routes: ["/"],
      provenance: "research-derived", blueprintId: "run-1", referenceIds: ["ref-a", "ref-b"]
    }]
  });
  const before = await readManifest(derived);
  await designMigrate(derived);
  assert.deepEqual(await readManifest(derived), before, "already-migrated research work must not be downgraded");
});

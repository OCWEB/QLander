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

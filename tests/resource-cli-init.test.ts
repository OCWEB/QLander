import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, stat, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);
const repo = path.resolve(import.meta.dirname, "..");
const tsx = path.join(repo, "node_modules/.bin/tsx");
const resourceCli = path.join(repo, "scripts/qlander-resource.ts");


async function json(file: string) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function fixture() {
  const target = await mkdtemp(path.join(os.tmpdir(), "qlander-resource-cli-"));
  for (const name of ["content", "data", "qlander.edit-map.json", "qlander.manifest.json"]) await cp(path.join(repo, name), path.join(target, name), { recursive: true });
  return target;
}

async function runtimeFixture() {
  const target = await fixture();
  for (const name of ["src", "scripts", "skills", "public", "astro.config.mjs", "package.json", "pnpm-workspace.yaml", "tsconfig.json", "pnpm-lock.yaml", "AGENTS.md", "README.md", "docs"]) await cp(path.join(repo, name), path.join(target, name), { recursive: true });
  await symlink(path.join(repo, "node_modules"), path.join(target, "node_modules"), "dir");
  return target;
}

async function invoke(args: string[]) {
  try {
    const { stdout, stderr } = await run(tsx, [resourceCli, ...args], { cwd: repo });
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (error: any) {
    return { code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

test("[fast] resource CLI registers detail and external resources and removes their bookkeeping", async () => {
  const root = await fixture();
  let result = await invoke(["add", "--root", root, "--slug", "board-letter", "--kind", "detail", "--title", "Board letter", "--summary", "A letter from the board.", "--year", "2026", "--type", "Letter", "--body", "Full letter context.", "--seo-title", "Board letter | Example", "--seo-description", "Read the board letter.", "--cta-label", "Download PDF", "--cta-href", "https://example.org/letter.pdf"]);
  assert.equal(result.code, 0, result.output);
  assert.equal((await json(path.join(root, "content/resources/board-letter.json"))).destination.kind, "detail");
  assert.ok((await json(path.join(root, "qlander.manifest.json"))).routes.includes("/resources/board-letter"));
  assert.deepEqual((await json(path.join(root, "qlander.edit-map.json")))["resource.board-letter"].affectedRoutes, ["/resources", "/resources/board-letter"]);

  result = await invoke(["add", "--root", root, "--slug", "regulator-filing", "--kind", "external", "--title", "Regulator filing", "--summary", "The official filing.", "--year", "2025", "--type", "Filing", "--href", "https://example.org/filing", "--label", "Open filing"]);
  assert.equal(result.code, 0, result.output);
  assert.equal((await json(path.join(root, "qlander.edit-map.json")))["resource.regulator-filing"].route, "/resources");
  assert.equal((await json(path.join(root, "qlander.manifest.json"))).routes.includes("/resources/regulator-filing"), false);

  result = await invoke(["remove", "--root", root, "--slug", "board-letter"]);
  assert.equal(result.code, 0, result.output);
  await assert.rejects(stat(path.join(root, "content/resources/board-letter.json")));
  assert.equal((await json(path.join(root, "qlander.edit-map.json")))["resource.board-letter"], undefined);
  assert.equal((await json(path.join(root, "qlander.manifest.json"))).routes.includes("/resources/board-letter"), false);
});

test("[fast] resource CLI validates before mutation and refuses overwrite without --force", async () => {
  const root = await fixture();
  const manifestFile = path.join(root, "qlander.manifest.json");
  const before = await readFile(manifestFile, "utf8");
  let result = await invoke(["add", "--root", root, "--slug", "bad-link", "--kind", "external", "--title", "Bad", "--summary", "Unsafe.", "--href", "http://example.org/file"]);
  assert.notEqual(result.code, 0);
  assert.equal(await readFile(manifestFile, "utf8"), before);
  await assert.rejects(stat(path.join(root, "content/resources/bad-link.json")));

  result = await invoke(["add", "--root", root, "--slug", "external-filing", "--kind", "external", "--title", "Replacement", "--summary", "Replacement.", "--href", "https://example.org/new"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /--force/);
});

test("[integration] init --no-resources and --minimal prune complete collection contracts safely", async () => {
  for (const flags of [["--no-resources"], ["--minimal"]]) {
    const root = await runtimeFixture();
    const homeFile = path.join(root, "content/pages/home.json");
    const home = await json(homeFile);
    home.sections[0].primaryCta = { label: "Resources", href: "/resources/annual-report" };
    home.sections[0].secondaryCta = { label: "Blog", href: "/blog/welcome" };
    home.sections.push({ id: "home.resources-cta", type: "cta", headline: "Read", body: "Read more.", cta: { label: "Resources", href: "/resources" } });
    await writeFile(homeFile, `${JSON.stringify(home, null, 2)}\n`);

    await run(tsx, [path.join(root, "scripts/qlander-init.ts"), "--profile", "marketing-site", "--in-place", "--name", "Pruned fixture", "--skip-install", "--skip-validate", ...flags], { cwd: root });
    const manifest = await json(path.join(root, "qlander.manifest.json"));
    const navigation = await json(path.join(root, "data/navigation.json"));
    const routeSeo = await json(path.join(root, "data/route-seo.json"));
    const editMap = await json(path.join(root, "qlander.edit-map.json"));
    const pruned = flags.includes("--minimal") ? ["/blog", "/products", "/resources"] : ["/resources"];
    for (const prefix of pruned) {
      assert.equal(manifest.routes.some((route: string) => route === prefix || route.startsWith(`${prefix}/`)), false);
      assert.equal([...navigation.header, ...navigation.footer].some((item: any) => item.href === prefix || item.href.startsWith(`${prefix}/`)), false);
    }
    assert.equal(routeSeo.resources, undefined);
    assert.equal(editMap["route.resources.seo"], undefined);
    assert.equal(Object.keys(editMap).some((key) => key.startsWith("resource.")), false);
    await assert.rejects(stat(path.join(root, "src/pages/resources/index.astro")));
    assert.deepEqual((await cpNames(path.join(root, "content/resources"))), [".gitkeep"]);
    const updatedHome = await json(homeFile);
    assert.equal(updatedHome.sections.some((section: any) => section.id === "home.resources-cta"), false);
    assert.equal(updatedHome.sections[0].primaryCta, undefined);
    if (flags.includes("--minimal")) {
      assert.deepEqual(await cpNames(path.join(root, "content/blog")), ["_empty.md"]);
      assert.equal(updatedHome.sections[0].secondaryCta, undefined);
      assert.equal(routeSeo.blog, undefined);
      assert.equal(routeSeo.products, undefined);
    } else {
      assert.ok(updatedHome.sections[0].secondaryCta);
    }
    await run(tsx, [path.join(root, "scripts/qlander-check.ts"), root, "--json"], { cwd: root, maxBuffer: 5_000_000 });
  }
});

async function cpNames(directory: string) {
  const { readdir } = await import("node:fs/promises");
  return (await readdir(directory)).sort();
}

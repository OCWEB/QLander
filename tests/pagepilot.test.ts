import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { MediaSchema, ThemeSchema, isSafeHref, serializeJsonLd } from "../src/lib/schemas";
import { resolveCanonical } from "../src/lib/seo";
import { site } from "../src/lib/site";

const run = promisify(execFile);
const repo = path.resolve(import.meta.dirname, "..");
const tsx = path.join(repo, "node_modules/.bin/tsx");
const checker = path.join(repo, "scripts/pagepilot-check.ts");

test("JSON-LD serialization cannot create a second script", () => {
  const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.equal(serialized.includes("</script>"), false);
  assert.match(serialized, /\\u003c\/script/);
});

test("editable URLs and theme/media tokens are allowlisted", () => {
  assert.equal(isSafeHref("/about"), true);
  assert.equal(isSafeHref("https://example.org"), true);
  assert.equal(isSafeHref("javascript:alert(1)"), false);
  assert.equal(isSafeHref("data:text/html,test"), false);
  assert.equal(ThemeSchema.safeParse({ colors: { ink: "red; background:url(x)", paper: "#ffffff", muted: "#555555", accent: "#111111", accentDark: "#222222" }, radius: -1 }).success, false);
  assert.equal(MediaSchema.safeParse({ src: "/images/../secret", alt: "x", width: 1, height: 1 }).success, false);
});

test("canonical URLs derive from the site origin and normalized route", () => {
  assert.equal(resolveCanonical("/about/", site), "https://example.com/about");
  assert.equal(resolveCanonical("/", site), "https://example.com/");
});

test("checker rejects invalid edit-map paths", async () => {
  const fixture = await copyFixture();
  const mapFile = path.join(fixture, "pagepilot.edit-map.json");
  const editMap = JSON.parse(await readFile(mapFile, "utf8"));
  editMap["home.hero"].jsonPath = "sections[99]";
  await writeFile(mapFile, JSON.stringify(editMap, null, 2));
  const result = await runChecker(fixture, ["--skip-build", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /edit_map\.path_missing/);
});

test("checker rejects unsafe navigation", async () => {
  const fixture = await copyFixture();
  const navigationFile = path.join(fixture, "data/navigation.json");
  const navigation = JSON.parse(await readFile(navigationFile, "utf8"));
  navigation.header[0].href = "javascript:alert(1)";
  await writeFile(navigationFile, JSON.stringify(navigation, null, 2));
  const result = await runChecker(fixture, ["--skip-build", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /schema\.invalid/);
});

test("checker rejects manifest routes that do not build", async () => {
  const fixture = await copyFixture(true);
  const manifestFile = path.join(fixture, "pagepilot.manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.routes.push("/ghost");
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
  const result = await runChecker(fixture, ["--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /schema\.manifest_route_stale/);
});

test("a second structured product builds a detail route and listing image", async () => {
  const fixture = await copyFixture(true);
  const product = {
    title: "Second Offer", slug: "second-offer", summary: "A second fixture offer.", description: "Used to verify collection-driven listings.", priceLabel: "Fixture", featured: false,
    image: { src: "/images/logo.svg", alt: "Second offer", width: 160, height: 40 },
    seo: { title: "Second Offer", description: "Second fixture offer.", noindex: false }
  };
  await writeFile(path.join(fixture, "content/products/second-offer.json"), JSON.stringify(product, null, 2));
  const manifestFile = path.join(fixture, "pagepilot.manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.routes.push("/products/second-offer");
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const listing = await readFile(path.join(fixture, "dist/products/index.html"), "utf8");
  assert.match(listing, /Second Offer/);
  assert.match(listing, /Second offer/);
});

test("launch mode rejects the draft starter", async () => {
  const fixture = await copyFixture();
  const result = await runChecker(fixture, ["--skip-build", "--launch", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /seo\.launch_status/);
  assert.match(result.output, /seo\.placeholder_domain/);
});

async function copyFixture(withRuntime = false) {
  const target = await mkdtemp(path.join(os.tmpdir(), "pagepilot-test-"));
  for (const name of ["content", "data", "public", "pagepilot.edit-map.json", "pagepilot.manifest.json"]) await cp(path.join(repo, name), path.join(target, name), { recursive: true });
  if (withRuntime) {
    for (const name of ["src", "scripts", "astro.config.mjs", "package.json", "tsconfig.json", "pnpm-lock.yaml"]) await cp(path.join(repo, name), path.join(target, name), { recursive: true });
    await symlink(path.join(repo, "node_modules"), path.join(target, "node_modules"), "dir");
  }
  return target;
}

async function runChecker(fixture: string, flags: string[]) {
  try {
    const { stdout, stderr } = await run(tsx, [checker, fixture, ...flags], { cwd: fixture, maxBuffer: 5_000_000 });
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (error: any) {
    return { code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

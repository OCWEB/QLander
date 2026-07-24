import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import fg from "fast-glob";
import { MediaSchema, PageContentSchema, RouteSeoSchema, ScrollWorldExperienceSchema, ScrollWorldQueueSchema, SiteDataSchema, ThemeSchema, isSafeHref, serializeJsonLd } from "../src/lib/schemas";
import { resolveCanonical } from "../src/lib/seo";
import { site } from "../src/lib/site";

const run = promisify(execFile);
const repo = path.resolve(import.meta.dirname, "..");
const tsx = path.join(repo, "node_modules/.bin/tsx");
const checker = path.join(repo, "scripts/qlander-check.ts");

test("repository contains no legacy technical namespace", async () => {
  assert.deepEqual(await findLegacyNamespace(repo), []);
});

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

test("site contact data supports a URL without inventing email or phone values", () => {
  const urlOnly = { ...site, email: "", phone: "", contactUrl: "https://example.org/contact" };
  assert.equal(SiteDataSchema.safeParse(urlOnly).success, true);
  assert.equal(SiteDataSchema.safeParse({ ...urlOnly, contactUrl: "http://example.org/contact" }).success, false);
});

test("PPC layout and image prompt IDs are constrained", () => {
  const page = {
    title: "Campaign", slug: "/", layout: "ppc",
    seo: { title: "Campaign", description: "Campaign landing page.", noindex: true },
    sections: [{
      id: "home.hero", type: "hero", headline: "A focused offer", subheadline: "For one campaign audience.",
      primaryCta: { label: "Get started", href: "/contact" }, imagePromptId: "campaign.hero-visual"
    }]
  };
  assert.equal(PageContentSchema.safeParse(page).success, true);
  assert.equal(PageContentSchema.safeParse({ ...page, layout: "modal" }).success, false);
  assert.equal(PageContentSchema.safeParse({ ...page, sections: [{ ...page.sections[0], imagePromptId: "Bad Prompt" }] }).success, false);
});

test("collection headings and CTAs are structured route data", async () => {
  const routeSeo = RouteSeoSchema.parse(JSON.parse(await readFile(path.join(repo, "data/route-seo.json"), "utf8")));
  assert.equal(routeSeo.products?.heading, "Starter offers");
  assert.equal(routeSeo.products?.itemCtaLabel, "View package");
  assert.equal(routeSeo.blog?.heading, "Blog");
  const pageLayout = await readFile(path.join(repo, "src/layouts/PageLayout.astro"), "utf8");
  assert.match(pageLayout, /needsProducts/);
  assert.match(pageLayout, /needsProducts \?/);
});

test("discovery workflow keeps universal source, approval, reuse, media, and handoff contracts", async () => {
  const discovery = await readFile(path.join(repo, "skills/qlander-discovery/SKILL.md"), "utf8");
  const handoffs = await readFile(path.join(repo, "skills/qlander-discovery/references/population-and-handoffs.md"), "utf8");
  const ppc = await readFile(path.join(repo, "skills/ppc-world/SKILL.md"), "utf8");
  for (const pattern of [
    /official website, named local project context, written brief, or a combination/i,
    /Do not populate the site or generate images before approval/i,
    /more than 30 days ago/i,
    /Codex image generation/i,
    /Magnific/i,
    /routine copy, SEO, navigation, or small section edits/i
  ]) assert.match(discovery, pattern);
  assert.match(handoffs, /PPC World handoff/);
  assert.match(handoffs, /Scroll World handoff/);
  assert.match(ppc, /content\/site-brief\.md/);
});

test("design research separates sourced direction selection from optional Impeccable execution", async () => {
  const research = await readFile(path.join(repo, "skills/qlander-design-research/SKILL.md"), "utf8");
  const template = await readFile(path.join(repo, "skills/qlander-design-research/references/design-research-template.md"), "utf8");
  const design = await readFile(path.join(repo, "skills/qlander-design/SKILL.md"), "utf8");
  const agents = await readFile(path.join(repo, "AGENTS.md"), "utf8");
  for (const pattern of [
    /3 to 5 distinct aesthetic families/i,
    /content\/design-research\.md/,
    /reference URL/i,
    /accessibility/i,
    /Do not copy/i,
    /approved public web research/i,
    /Pinterest/i,
    /21st\.dev/i,
    /researchRunId/i,
    /randomized without replacement/i,
    /do not repeat the exact source mix/i,
    /design token invariants/i,
    /theme\.json remains authoritative/i
  ]) assert.match(research, pattern);
  assert.match(template, /status: proposed/);
  assert.match(template, /researchRunId/);
  assert.match(template, /## Source mix/);
  assert.match(template, /## Design token invariants/);
  assert.match(template, /## Direction scorecard/);
  assert.match(design, /npx impeccable install/);
  assert.match(design, /explicit approval/i);
  assert.match(design, /optional/i);
  assert.match(design, /QLander remains the source of truth/i);
  assert.match(agents, /qlander-design-research/);
});

test("bundled Scroll World defaults to manual queue without making the page type automatic", async () => {
  const scroll = await readFile(path.join(repo, "skills/scroll-world/SKILL.md"), "utf8");
  const queue = await readFile(path.join(repo, "skills/scroll-world/references/manual-queue.md"), "utf8");
  const engine = await readFile(path.join(repo, "skills/scroll-world/references/scrub-engine.js"), "utf8");
  const agents = await readFile(path.join(repo, "AGENTS.md"), "utf8");
  const upstream = JSON.parse(await readFile(path.join(repo, "skills/ppc-world/references/upstream-scroll-world.json"), "utf8"));
  assert.match(scroll, /Default: manual queue/i);
  assert.match(scroll, /Do not install a\s+provider CLI, call a generation API, or spend credits unless the user explicitly\s+chooses/i);
  assert.match(queue, /results\//);
  assert.match(queue, /Phase 1/);
  assert.match(queue, /Phase 2/);
  assert.match(engine, /img\.loading = 'eager'/);
  assert.match(engine, /\.sw-route__dot\{[^}]*padding:0/);
  assert.match(engine, /config\.mode === 'section'/);
  assert.match(engine, /\.sw-root--section \.sw-viewport\{position:sticky/);
  assert.match(agents, /Scroll World remains an opt-in page experience/i);
  assert.equal(upstream.tracking, "vendored");
});

test("Scroll World experience schema supports still-first routes and constrains assets", () => {
  const experience = {
    kind: "scroll-world", slug: "tour",
    seo: { title: "Product Tour", description: "An interactive product journey.", noindex: true },
    brand: { name: "Example", href: "/" },
    sections: [{ id: "intro", label: "Intro", accent: "#6B7280", still: "/experiences/tour/poster.svg", title: "Start here", body: "A useful static fallback while cinematic media is prepared.", tags: [] }],
    connectors: [], connectorsMobile: []
  };
  assert.equal(ScrollWorldExperienceSchema.safeParse(experience).success, true);
  assert.equal(ScrollWorldExperienceSchema.safeParse({ ...experience, slug: "../tour" }).success, false);
  assert.equal(ScrollWorldExperienceSchema.safeParse({ ...experience, sections: [{ ...experience.sections[0], clip: "/tour.mp4" }] }).success, false);
  assert.equal(ScrollWorldExperienceSchema.safeParse({ ...experience, route: "/" }).success, true);
  assert.equal(ScrollWorldExperienceSchema.safeParse({ ...experience, route: "/other" }).success, false);
  assert.equal(ScrollWorldExperienceSchema.safeParse({ ...experience, placement: "section" }).success, true);
  assert.equal(ScrollWorldExperienceSchema.safeParse({ ...experience, placement: "section", route: "/" }).success, false);
  const queue = { version: 1, experience: "tour", mode: "manual", provider: "Magnific", mobile: false, status: "phase1-ready", updatedAt: "2026-07-19T00:00:00.000Z", jobs: [{ id: "S1", phase: 1, kind: "still", filename: "still_1_intro.png", status: "pending", dependencies: [] }] };
  assert.equal(ScrollWorldQueueSchema.safeParse(queue).success, true);
});

test("QLander registers Scroll World as an internal route without replacing the site", async () => {
  const fixture = await copyFixture(true);
  const register = path.join(fixture, "skills/scroll-world/references/scripts/register-qlander-experience.mjs");
  await run(process.execPath, [register, "--root", fixture, "--slug", "tour", "--title", "Product Tour", "--description", "Explore the complete product journey while the normal marketing site remains available."]);
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const manifest = JSON.parse(await readFile(path.join(fixture, "qlander.manifest.json"), "utf8"));
  const editMap = JSON.parse(await readFile(path.join(fixture, "qlander.edit-map.json"), "utf8"));
  assert.equal(manifest.routes.includes("/tour"), true);
  assert.equal(manifest.routes.includes("/about"), true);
  assert.equal(editMap["experience.tour"].contentFile, "data/experiences/tour.json");
  const queue = JSON.parse(await readFile(path.join(fixture, "scroll-world/tour/queue.json"), "utf8"));
  assert.equal(queue.mode, "manual");
  const rendered = await readFile(path.join(fixture, "dist/tour/index.html"), "utf8");
  assert.match(rendered, /data-pp-edit-id="experience\.tour"/);
  assert.match(rendered, /class="sw-fallback"/);
  assert.match(rendered, /mountScrollWorld/);
  await assert.rejects(readFile(path.join(fixture, "src/pages/tour.astro"), "utf8"));
});

test("QLander registers Scroll World at the root without removing explicit site routes", async () => {
  const fixture = await copyFixture(true);
  const register = path.join(fixture, "skills/scroll-world/references/scripts/register-qlander-experience.mjs");
  await run(process.execPath, [register, "--project-root", fixture, "--root", "--title", "Root Tour", "--cta-href", "https://example.org/contact"]);
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const manifest = JSON.parse(await readFile(path.join(fixture, "qlander.manifest.json"), "utf8"));
  assert.equal(manifest.routes.includes("/about"), true);
  const experience = JSON.parse(await readFile(path.join(fixture, "data/experiences/root.json"), "utf8"));
  assert.equal(experience.route, "/");
  const rendered = await readFile(path.join(fixture, "dist/index.html"), "utf8");
  assert.match(rendered, /data-pp-edit-id="experience\.root"/);
  assert.match(rendered, /class="sw-fallback"/);
});

test("QLander inserts a scoped scroll-section without creating or replacing a route", async () => {
  const fixture = await copyFixture(true);
  const register = path.join(fixture, "skills/scroll-world/references/scripts/register-qlander-experience.mjs");
  await run(process.execPath, [register, "--project-root", fixture, "--section", "--page", "home", "--after", "home.hero", "--slug", "product-story", "--title", "Product Story"]);
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const manifest = JSON.parse(await readFile(path.join(fixture, "qlander.manifest.json"), "utf8"));
  const home = PageContentSchema.parse(JSON.parse(await readFile(path.join(fixture, "content/pages/home.json"), "utf8")));
  const experience = ScrollWorldExperienceSchema.parse(JSON.parse(await readFile(path.join(fixture, "data/experiences/product-story.json"), "utf8")));
  const editMap = JSON.parse(await readFile(path.join(fixture, "qlander.edit-map.json"), "utf8"));
  assert.equal(manifest.routes.includes("/product-story"), false);
  assert.deepEqual(home.sections[1], { id: "home.scroll-product-story", type: "scrollSection", experience: "product-story", headingLevel: "h2" });
  assert.equal(experience.placement, "section");
  assert.equal(editMap["home.scroll-product-story"].component, "ScrollSection");
  assert.equal(editMap["experience.product-story"].component, "ScrollSectionExperience");
  const rendered = await readFile(path.join(fixture, "dist/index.html"), "utf8");
  assert.match(rendered, /class="site-header"/);
  assert.match(rendered, /class="site-footer"/);
  assert.match(rendered, /data-pp-edit-id="home\.scroll-product-story"/);
  assert.match(rendered, /data-pp-edit-id="experience\.product-story"/);
  assert.match(rendered, /"mode":"section"/);
  await assert.rejects(readFile(path.join(fixture, "dist/product-story/index.html"), "utf8"));
});

test("QLander can replace only the hero with an h1 scroll-section", async () => {
  const fixture = await copyFixture(true);
  const register = path.join(fixture, "skills/scroll-world/references/scripts/register-qlander-experience.mjs");
  await run(process.execPath, [register, "--project-root", fixture, "--section", "--page", "home", "--replace", "home.hero", "--slug", "hero-story", "--title", "Hero Story"]);
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const home = PageContentSchema.parse(JSON.parse(await readFile(path.join(fixture, "content/pages/home.json"), "utf8")));
  const editMap = JSON.parse(await readFile(path.join(fixture, "qlander.edit-map.json"), "utf8"));
  assert.deepEqual(home.sections[0], { id: "home.scroll-hero-story", type: "scrollSection", experience: "hero-story", headingLevel: "h1" });
  assert.equal(editMap["home.hero"], undefined);
  const rendered = await readFile(path.join(fixture, "dist/index.html"), "utf8");
  assert.equal((rendered.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(rendered, /<h1[^>]*>Hero Story<\/h1>/);
  assert.match(rendered, /class="site-footer"/);
});

test("QLander init generates all four detached project profiles", async () => {
  const init = path.join(repo, "scripts/qlander-init.ts");
  for (const profile of ["marketing-site", "single-page-ppc", "internal-scroll-world", "root-scroll-world"]) {
    const target = await mkdtemp(path.join(os.tmpdir(), `qlander-init-${profile}-`));
    await run(tsx, [init, "--profile", profile, "--target", target, "--name", `Fixture ${profile}`, "--skip-install", "--skip-validate"], { cwd: repo });
    const manifest = JSON.parse(await readFile(path.join(target, "qlander.manifest.json"), "utf8"));
    assert.equal(manifest.projectType, profile);
    assert.match(await readFile(path.join(target, "docs/qlander-run.md"), "utf8"), /Baseline commit: `[a-f0-9]+`/);
    assert.match(await readFile(path.join(target, "tests/profile.test.ts"), "utf8"), new RegExp(profile));
    assert.deepEqual(await findLegacyNamespace(target), []);
    const { stdout } = await run("git", ["log", "--oneline"], { cwd: target });
    assert.match(stdout, /Start project from QLander baseline/);
    if (profile === "single-page-ppc" || profile === "root-scroll-world") assert.deepEqual(manifest.routes, ["/", "/404"]);
    if (profile.includes("scroll-world")) {
      const queueSlug = profile === "root-scroll-world" ? "root" : "tour";
      const queue = JSON.parse(await readFile(path.join(target, `scroll-world/${queueSlug}/queue.json`), "utf8"));
      assert.equal(ScrollWorldQueueSchema.safeParse(queue).success, true);
    }
  }
});

test("canonical URLs derive from the site origin and normalized route", () => {
  assert.equal(resolveCanonical("/about/", site), "https://example.com/about");
  assert.equal(resolveCanonical("/", site), "https://example.com/");
});

test("checker rejects invalid edit-map paths", async () => {
  const fixture = await copyFixture();
  const mapFile = path.join(fixture, "qlander.edit-map.json");
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
  const manifestFile = path.join(fixture, "qlander.manifest.json");
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
  const manifestFile = path.join(fixture, "qlander.manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.routes.push("/products/second-offer");
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const listing = await readFile(path.join(fixture, "dist/products/index.html"), "utf8");
  assert.match(listing, /Second Offer/);
  assert.match(listing, /Second offer/);
});

test("checker permits explicitly added client JavaScript", async () => {
  const fixture = await copyFixture(true);
  const layoutFile = path.join(fixture, "src/layouts/BaseLayout.astro");
  const layout = await readFile(layoutFile, "utf8");
  await writeFile(layoutFile, layout.replace("</body>", '<script>document.documentElement.dataset.enhanced = "true";</script>\n  </body>'));
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const rendered = await readFile(path.join(fixture, "dist/index.html"), "utf8");
  assert.match(rendered, /<script/);
});

test("site discovery brief is advisory and never becomes a public route", async () => {
  const fixture = await copyFixture(true);
  const brief = `---
kind: qlander-site-brief
lastReviewed: 2020-01-01
sourceMode: written-brief
officialUrl: ""
status: proposed
---

# Site brief

This intentionally stale proposed brief must not block a build or become a route.
`;
  await writeFile(path.join(fixture, "content/site-brief.md"), brief);
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  await assert.rejects(readFile(path.join(fixture, "dist/site-brief/index.html"), "utf8"));
  const manifest = JSON.parse(await readFile(path.join(fixture, "qlander.manifest.json"), "utf8"));
  assert.equal(manifest.routes.includes("/site-brief"), false);
});

test("launch mode rejects the draft starter", async () => {
  const fixture = await copyFixture();
  const result = await runChecker(fixture, ["--skip-build", "--launch", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /seo\.launch_status/);
  assert.match(result.output, /seo\.placeholder_domain/);
});

test("PPC layout removes site chrome and renders a documented prompt annotation", async () => {
  const fixture = await copyFixture(true);
  const homeFile = path.join(fixture, "content/pages/home.json");
  const home = JSON.parse(await readFile(homeFile, "utf8"));
  home.layout = "ppc";
  for (const section of home.sections) if (section.type === "cta") section.cta.href = home.sections[0].primaryCta.href;
  home.sections[0].imagePromptId = "campaign.hero-visual";
  await writeFile(homeFile, JSON.stringify(home, null, 2));
  await mkdir(path.join(fixture, "content/prompts"), { recursive: true });
  await writeFile(path.join(fixture, "content/prompts/campaign.md"), "# Campaign prompts\n\n## campaign.hero-visual\n\nA campaign hero image.\n");
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const rendered = await readFile(path.join(fixture, "dist/index.html"), "utf8");
  assert.doesNotMatch(rendered, /class="site-header"/);
  assert.doesNotMatch(rendered, /class="site-footer"/);
  assert.match(rendered, /class="landing-header"/);
  assert.match(rendered, /Prompt: campaign\.hero-visual/);
});

test("checker rejects competing primary PPC destinations", async () => {
  const fixture = await copyFixture();
  const homeFile = path.join(fixture, "content/pages/home.json");
  const home = JSON.parse(await readFile(homeFile, "utf8"));
  home.layout = "ppc";
  home.sections[0].primaryCta.href = "https://example.org/demo";
  home.sections[3].cta.href = "https://example.org/signup";
  await writeFile(homeFile, JSON.stringify(home, null, 2));
  const result = await runChecker(fixture, ["--skip-build", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /schema\.ppc_cta_mismatch/);
});

test("checker rejects an undocumented image prompt ID", async () => {
  const fixture = await copyFixture();
  const homeFile = path.join(fixture, "content/pages/home.json");
  const home = JSON.parse(await readFile(homeFile, "utf8"));
  home.sections[0].imagePromptId = "campaign.missing-visual";
  await writeFile(homeFile, JSON.stringify(home, null, 2));
  const result = await runChecker(fixture, ["--skip-build", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /schema\.image_prompt_missing/);
});

async function copyFixture(withRuntime = false) {
  const target = await mkdtemp(path.join(os.tmpdir(), "qlander-test-"));
  for (const name of ["content", "data", "public", "qlander.edit-map.json", "qlander.manifest.json"]) await cp(path.join(repo, name), path.join(target, name), { recursive: true });
  if (withRuntime) {
    for (const name of ["src", "scripts", "skills", "astro.config.mjs", "package.json", "pnpm-workspace.yaml", "tsconfig.json", "pnpm-lock.yaml"]) await cp(path.join(repo, name), path.join(target, name), { recursive: true });
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

async function findLegacyNamespace(root: string) {
  const legacyPattern = new RegExp(["page", "pilot"].join(""), "i");
  const files = await fg("**/*", {
    cwd: root,
    dot: true,
    onlyFiles: true,
    ignore: [".git/**", ".astro/**", "dist/**", "node_modules/**"]
  });
  const findings = files.filter((file) => legacyPattern.test(file));
  const textExtensions = new Set([".astro", ".css", ".html", ".js", ".json", ".md", ".mjs", ".svg", ".ts", ".txt", ".yaml", ".yml"]);
  for (const file of files) {
    if (path.basename(file) !== "LICENSE" && !textExtensions.has(path.extname(file))) continue;
    if (legacyPattern.test(await readFile(path.join(root, file), "utf8"))) findings.push(file);
  }
  return [...new Set(findings)].sort();
}

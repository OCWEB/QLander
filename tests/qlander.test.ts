import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import fg from "fast-glob";
import { DesignManifestSchema, DesignSystemSchema, LayoutBlueprintSchema, LayoutHandoffSchema, MediaSchema, PageContentSchema, ResearchManifestSchema, RouteSeoSchema, ScrollWorldExperienceSchema, ScrollWorldQueueSchema, SiteDataSchema, ThemeSchema, isSafeHref, serializeJsonLd } from "../src/lib/schemas";
import { resolveCanonical } from "../src/lib/seo";
import { site } from "../src/lib/site";

const run = promisify(execFile);
const repo = path.resolve(import.meta.dirname, "..");
const tsx = path.join(repo, "node_modules/.bin/tsx");
const checker = path.join(repo, "scripts/qlander-check.ts");

test("[fast] repository contains no legacy technical namespace", async () => {
  assert.deepEqual(await findLegacyNamespace(repo), []);
});

test("[fast] JSON-LD serialization cannot create a second script", () => {
  const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.equal(serialized.includes("</script>"), false);
  assert.match(serialized, /\\u003c\/script/);
});

test("[fast] editable URLs and theme/media tokens are allowlisted", () => {
  assert.equal(isSafeHref("/about"), true);
  assert.equal(isSafeHref("https://example.org"), true);
  assert.equal(isSafeHref("javascript:alert(1)"), false);
  assert.equal(isSafeHref("data:text/html,test"), false);
  assert.equal(ThemeSchema.safeParse({ colors: { ink: "red; background:url(x)", paper: "#ffffff", muted: "#555555", accent: "#111111", accentDark: "#222222" }, radius: -1 }).success, false);
  assert.equal(MediaSchema.safeParse({ src: "/images/../secret", alt: "x", width: 1, height: 1 }).success, false);
});

test("[fast] site-wide design system tokens are structured and injection-safe", async () => {
  const system = JSON.parse(await readFile(path.join(repo, "data/design-system.json"), "utf8"));
  assert.equal(DesignSystemSchema.safeParse(system).success, true);
  assert.equal(DesignSystemSchema.safeParse({ ...system, typography: { ...system.typography, bodyFamily: "Inter; background:red" } }).success, false);
  const layout = await readFile(path.join(repo, "src/layouts/BaseLayout.astro"), "utf8");
  const scrollWorld = await readFile(path.join(repo, "src/components/ScrollWorldPage.astro"), "utf8");
  assert.match(layout, /design-system\.json/);
  assert.match(layout, /var\(--fontBody\)/);
  assert.match(layout, /var\(--contentMax\)/);
  assert.match(scrollWorld, /design-system\.json/);
  assert.match(scrollWorld, /var\(--fontDisplay\)/);
});

test("[fast] core FAQ uses an accessible responsive disclosure layout", async () => {
  const faq = await readFile(path.join(repo, "src/components/FaqSection.astro"), "utf8");
  assert.doesNotMatch(faq, /<summary>\s*<h3>/);
  assert.match(faq, /<summary>[\s\S]*class="faq-question"/);
  assert.match(faq, /class="faq-icon" aria-hidden="true"/);
  assert.match(faq, /summary::\-webkit-details-marker/);
  assert.match(faq, /summary::marker/);
  assert.match(faq, /grid-template-columns: minmax\(0, 0\.72fr\) minmax\(320px, 1\.28fr\)/);
  assert.match(faq, /summary:focus-visible/);
  assert.match(faq, /html\[data-surface="flat"\]/);
  assert.match(faq, /html\[data-surface="elevated"\]/);
  assert.match(faq, /@media \(max-width: 760px\)[\s\S]*grid-template-columns: 1fr/);
});

test("[fast] site contact data supports a URL without inventing email or phone values", () => {
  const urlOnly = { ...site, email: "", phone: "", contactUrl: "https://example.org/contact" };
  assert.equal(SiteDataSchema.safeParse(urlOnly).success, true);
  assert.equal(SiteDataSchema.safeParse({ ...urlOnly, contactUrl: "http://example.org/contact" }).success, false);
});

test("[fast] PPC layout and image prompt IDs are constrained", () => {
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

test("[fast] collection headings and CTAs are structured route data", async () => {
  const routeSeo = RouteSeoSchema.parse(JSON.parse(await readFile(path.join(repo, "data/route-seo.json"), "utf8")));
  assert.equal(routeSeo.products?.heading, "Starter offers");
  assert.equal(routeSeo.products?.itemCtaLabel, "View package");
  assert.equal(routeSeo.blog?.heading, "Blog");
  const pageLayout = await readFile(path.join(repo, "src/layouts/PageLayout.astro"), "utf8");
  assert.match(pageLayout, /needsProducts/);
  assert.match(pageLayout, /needsProducts \?/);
});

test("[fast] discovery workflow keeps universal source, approval, reuse, media, and handoff contracts", async () => {
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

test("[fast] design research separates sourced direction selection from optional Impeccable execution", async () => {
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
  assert.match(template, /## Design-system handoff/);
  assert.match(template, /## Layout handoff plan/);
  assert.match(design, /data\/design-system\.json/);
  assert.match(design, /src\/layout-handoffs\.ts/);
  assert.match(design, /must use at least one material handoff/i);
  assert.match(design, /npx impeccable install/);
  assert.match(design, /explicit approval/i);
  assert.match(design, /optional/i);
  assert.match(design, /QLander remains the source of truth/i);
  assert.match(agents, /qlander-design-research/);
});

test("[fast] bundled Scroll World defaults to manual queue without making the page type automatic", async () => {
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

test("[fast] Scroll World experience schema supports still-first routes and constrains assets", () => {
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

test("[integration] QLander registers Scroll World as an internal route without replacing the site", async () => {
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

test("[integration] QLander registers Scroll World at the root without removing explicit site routes", async () => {
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

test("[integration] QLander inserts a scoped scroll-section without creating or replacing a route", async () => {
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

test("[integration] QLander can replace only the hero with an h1 scroll-section", async () => {
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

test("[integration] QLander init generates all four detached project profiles", async () => {
  const init = path.join(repo, "scripts/qlander-init.ts");
  for (const profile of ["marketing-site", "single-page-ppc", "internal-scroll-world", "root-scroll-world"]) {
    const target = await mkdtemp(path.join(os.tmpdir(), `qlander-init-${profile}-`));
    await run(tsx, [init, "--profile", profile, "--target", target, "--name", `Fixture ${profile}`, "--skip-install", "--skip-validate"], { cwd: repo });
    const manifest = JSON.parse(await readFile(path.join(target, "qlander.manifest.json"), "utf8"));
    assert.equal(manifest.projectType, profile);
    assert.match(await readFile(path.join(target, "docs/qlander-run.md"), "utf8"), /Baseline commit: `[a-f0-9]+`/);
    assert.match(await readFile(path.join(target, "tests/profile.test.ts"), "utf8"), new RegExp(profile));
    const screenshotManifest = JSON.parse(await readFile(path.join(target, "docs/screenshots/manifest.json"), "utf8"));
    assert.deepEqual(screenshotManifest, { version: 1, screenshots: [] });
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

test("[fast] canonical URLs derive from the site origin and normalized route", () => {
  assert.equal(resolveCanonical("/about/", site), "https://example.com/about");
  assert.equal(resolveCanonical("/", site), "https://example.com/");
});

test("[fast] checker rejects invalid edit-map paths", async () => {
  const fixture = await copyFixture();
  const mapFile = path.join(fixture, "qlander.edit-map.json");
  const editMap = JSON.parse(await readFile(mapFile, "utf8"));
  editMap["home.hero"].jsonPath = "sections[99]";
  await writeFile(mapFile, JSON.stringify(editMap, null, 2));
  const result = await runChecker(fixture, ["--skip-build", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /edit_map\.path_missing/);
});

test("[fast] checker rejects unsafe navigation", async () => {
  const fixture = await copyFixture();
  const navigationFile = path.join(fixture, "data/navigation.json");
  const navigation = JSON.parse(await readFile(navigationFile, "utf8"));
  navigation.header[0].href = "javascript:alert(1)";
  await writeFile(navigationFile, JSON.stringify(navigation, null, 2));
  const result = await runChecker(fixture, ["--skip-build", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /schema\.invalid/);
});

test("[integration] checker rejects manifest routes that do not build", async () => {
  const fixture = await copyFixture(true);
  const manifestFile = path.join(fixture, "qlander.manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.routes.push("/ghost");
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
  const result = await runChecker(fixture, ["--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /schema\.manifest_route_stale/);
});

test("[integration] a second structured product builds a detail route and listing image", async () => {
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

test("[integration] checker permits explicitly added client JavaScript", async () => {
  const fixture = await copyFixture(true);
  const layoutFile = path.join(fixture, "src/layouts/BaseLayout.astro");
  const layout = await readFile(layoutFile, "utf8");
  await writeFile(layoutFile, layout.replace("</body>", '<script>document.documentElement.dataset.enhanced = "true";</script>\n  </body>'));
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const rendered = await readFile(path.join(fixture, "dist/index.html"), "utf8");
  assert.match(rendered, /<script/);
});

test("[integration] site discovery brief is advisory and never becomes a public route", async () => {
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

test("[fast] launch mode rejects the draft starter", async () => {
  const fixture = await copyFixture();
  const result = await runChecker(fixture, ["--skip-build", "--launch", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /seo\.launch_status/);
  assert.match(result.output, /seo\.placeholder_domain/);
});

test("[integration] PPC layout removes site chrome and renders a documented prompt annotation", async () => {
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

test("[fast] checker rejects competing primary PPC destinations", async () => {
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

test("[fast] checker rejects an undocumented image prompt ID", async () => {
  const fixture = await copyFixture();
  const homeFile = path.join(fixture, "content/pages/home.json");
  const home = JSON.parse(await readFile(homeFile, "utf8"));
  home.sections[0].imagePromptId = "campaign.missing-visual";
  await writeFile(homeFile, JSON.stringify(home, null, 2));
  const result = await runChecker(fixture, ["--skip-build", "--json"]);
  assert.notEqual(result.code, 0);
  assert.match(result.output, /schema\.image_prompt_missing/);
});

test("[integration] registered section handoff replaces the starter renderer and passes the design contract", async () => {
  const root = await copyFixture(true);
  const manifestFile = path.join(root, "qlander.manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.creationMode = "prompted";
  manifest.design = {
    status: "implemented",
    direction: "Test editorial system",
    system: "data/design-system.json",
    handoffs: [{ kind: "section", id: "home.features", renderer: "src/components/TestHandoff.astro", routes: ["/"] }]
  };
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const systemFile = path.join(root, "data/design-system.json");
  const system = JSON.parse(await readFile(systemFile, "utf8"));
  system.status = "approved";
  system.direction = "Test editorial system";
  await writeFile(systemFile, `${JSON.stringify(system, null, 2)}\n`);
  await writeFile(path.join(root, "content/design-research.md"), "---\nstatus: approved\nselectedDirection: Test editorial system\n---\n\n# Approved test direction\n");
  await writeFile(path.join(root, "src/components/TestHandoff.astro"), "---\nconst { section } = Astro.props;\n---\n<section data-layout-handoff=\"true\" data-pp-edit-id={section.id}><h2>{section.headline}</h2></section>\n");
  await writeFile(path.join(root, "src/layout-handoffs.ts"), "import TestHandoff from './components/TestHandoff.astro';\nexport const pageHandoffs: Record<string, any> = {};\nexport const sectionHandoffs: Record<string, any> = { \"home.features\": TestHandoff };\n");
  await run(tsx, [path.join(root, "scripts/qlander-check.ts"), root], { cwd: root, maxBuffer: 5_000_000 });
  const html = await readFile(path.join(root, "dist/index.html"), "utf8");
  assert.match(html, /data-layout-handoff="true"/);
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

// --- Research-led layout workflow: evidence and blueprint schemas (Task B1) ---

test("[fast] research manifest records every capture attempt with an auditable outcome", () => {
  const base = {
    version: 1,
    researchRunId: "2026-07-24-institutional-modern",
    direction: "Institutional Modern",
    attemptBudget: 8,
    attemptsUsed: 2,
    targetSuccesses: 2,
    maxSuccesses: 4,
    references: [
      {
        id: "ref-a",
        rank: 1,
        sourceUrl: "https://example.com/",
        status: "captured",
        rights: "inspiration-only",
        attempts: [{ at: "2026-07-24T12:02:00.000Z", outcome: "captured" }],
        captures: [{ breakpoint: "desktop", localPath: "references/ref-a-desktop.png", sha256: "a".repeat(64) }]
      },
      {
        id: "ref-b",
        rank: 2,
        sourceUrl: "https://example.org/",
        status: "skipped-satisfied",
        rights: "inspiration-only",
        attempts: [],
        captures: []
      }
    ]
  };
  assert.equal(ResearchManifestSchema.parse(base).references.length, 2);

  // A consent wall is a capture-quality outcome, never a rotation trigger.
  const obstructed = structuredClone(base);
  obstructed.references[0].attempts = [{ at: "2026-07-24T12:02:00.000Z", outcome: "captured-obstructed" }];
  assert.equal(ResearchManifestSchema.safeParse(obstructed).success, true);

  // skipped-satisfied and skipped-budget must stay distinguishable.
  const exhausted = structuredClone(base);
  exhausted.references[1].status = "skipped-budget";
  assert.equal(ResearchManifestSchema.safeParse(exhausted).success, true);

  // Fabricated outcomes and unsafe capture paths are rejected.
  const invented = structuredClone(base);
  invented.references[0].attempts = [{ at: "2026-07-24T12:02:00.000Z", outcome: "assumed" }];
  assert.equal(ResearchManifestSchema.safeParse(invented).success, false);

  const traversal = structuredClone(base);
  traversal.references[0].captures[0].localPath = "../../../etc/passwd";
  assert.equal(ResearchManifestSchema.safeParse(traversal).success, false);

  const badHash = structuredClone(base);
  badHash.references[0].captures[0].sha256 = "nope";
  assert.equal(ResearchManifestSchema.safeParse(badHash).success, false);

  const insecure = structuredClone(base);
  insecure.references[0].sourceUrl = "http://example.com/";
  assert.equal(ResearchManifestSchema.safeParse(insecure).success, false);

  // A captured reference must actually carry a capture.
  const empty = structuredClone(base);
  empty.references[0].captures = [];
  assert.equal(ResearchManifestSchema.safeParse(empty).success, false);
});

test("[fast] layout blueprint validates composition without accepting prose or prose-derived slots", () => {
  const base = {
    version: 1,
    researchRunId: "2026-07-24-institutional-modern",
    direction: "Institutional Modern",
    pages: [
      {
        route: "/",
        renderer: "src/design/institutional-modern/HomePage.astro",
        referenceIds: ["ref-a", "ref-b"],
        sections: [
          {
            id: "home.hero",
            role: "hero",
            primitive: "split-media-right",
            responsive: "stack-copy-first",
            slots: [{ id: "home.hero.headline", kind: "headline", targetLines: 5 }]
          },
          {
            id: "home.licensing",
            role: "proof",
            primitive: "proof-band",
            responsive: "collapse-to-list",
            slots: [{ id: "home.licensing.body", kind: "body", targetCharacters: 240 }]
          }
        ]
      }
    ]
  };
  const parsed = LayoutBlueprintSchema.parse(base);
  assert.equal(parsed.pages[0].sections[1].primitive, "proof-band");

  // factList was removed in v1: renderers must never parse prose into structure.
  const factList = structuredClone(base) as any;
  factList.pages[0].sections[1].slots = [{ id: "home.licensing.items", kind: "factList" }];
  assert.equal(LayoutBlueprintSchema.safeParse(factList).success, false);

  // Unvalidatable prose fields stay out of the blueprint.
  const prose = structuredClone(base) as any;
  prose.pages[0].sections[0].silhouette = "asymmetric editorial funnel";
  assert.equal(LayoutBlueprintSchema.safeParse(prose).success, false);

  const unknownPrimitive = structuredClone(base);
  unknownPrimitive.pages[0].sections[0].primitive = "hero-thing";
  assert.equal(LayoutBlueprintSchema.safeParse(unknownPrimitive).success, false);

  // A blueprint page needs at least two independent references.
  const thin = structuredClone(base);
  thin.pages[0].referenceIds = ["ref-a"];
  assert.equal(LayoutBlueprintSchema.safeParse(thin).success, false);

  // Section IDs must be unique; the divergence comparison depends on stable IDs.
  const duplicate = structuredClone(base);
  duplicate.pages[0].sections[1].id = "home.hero";
  assert.equal(LayoutBlueprintSchema.safeParse(duplicate).success, false);

  const unsafeRenderer = structuredClone(base);
  unsafeRenderer.pages[0].renderer = "src/../../evil.astro";
  assert.equal(LayoutBlueprintSchema.safeParse(unsafeRenderer).success, false);
});

test("[fast] research-derived handoffs must cite a blueprint and independent references", () => {
  const derived = {
    kind: "page",
    id: "/",
    renderer: "src/design/institutional-modern/HomePage.astro",
    routes: ["/"],
    provenance: "research-derived",
    blueprintId: "2026-07-24-institutional-modern",
    referenceIds: ["ref-a", "ref-b"]
  };
  assert.equal(LayoutHandoffSchema.parse(derived).provenance, "research-derived");

  const noBlueprint = structuredClone(derived) as any;
  delete noBlueprint.blueprintId;
  assert.equal(LayoutHandoffSchema.safeParse(noBlueprint).success, false);

  const oneReference = structuredClone(derived);
  oneReference.referenceIds = ["ref-a"];
  assert.equal(LayoutHandoffSchema.safeParse(oneReference).success, false);

  const unknownProvenance = structuredClone(derived);
  unknownProvenance.provenance = "hand-wavy";
  assert.equal(LayoutHandoffSchema.safeParse(unknownProvenance).success, false);

  // A bundled variant may not claim research provenance.
  const bundled = structuredClone(derived);
  bundled.renderer = "src/design-variants/HeroCentered.astro";
  assert.equal(LayoutHandoffSchema.safeParse(bundled).success, false);

  // Legacy handoffs stay parseable and are never silently upgraded.
  const legacy = { kind: "section", id: "home.hero", renderer: "src/design-variants/HeroCentered.astro", routes: ["/"] };
  assert.equal(LayoutHandoffSchema.parse(legacy).provenance, undefined);
  assert.equal(LayoutHandoffSchema.parse({ ...legacy, provenance: "legacy-unknown" }).provenance, "legacy-unknown");
});

test("[fast] design manifest carries a rollout gate and stays backward compatible", () => {
  const legacy = {
    status: "implemented",
    direction: "Institutional Modern",
    system: "data/design-system.json",
    handoffs: [{ kind: "section", id: "home.hero", renderer: "src/design-variants/HeroCentered.astro", routes: ["/"] }]
  };
  const parsedLegacy = DesignManifestSchema.parse(legacy);
  assert.equal(parsedLegacy.gate, undefined, "existing manifests must not gain an implied gate");

  const gated = { ...legacy, gate: "warn", blueprintId: "2026-07-24-institutional-modern" };
  assert.equal(DesignManifestSchema.parse(gated).gate, "warn");
  assert.equal(DesignManifestSchema.safeParse({ ...legacy, gate: "off" }).success, true);
  assert.equal(DesignManifestSchema.safeParse({ ...legacy, gate: "enforce" }).success, true);
  assert.equal(DesignManifestSchema.safeParse({ ...legacy, gate: "yolo" }).success, false);
  assert.equal(DesignManifestSchema.safeParse({ ...legacy, divergenceWaiver: "sticky rail is intentional" }).success, true);
  assert.equal(DesignManifestSchema.safeParse({ ...legacy, divergenceWaiver: "" }).success, false);
});

test("[fast] design research requires browser-backed capture evidence and layout extraction", async () => {
  const skill = await readFile(path.join(repo, "skills/qlander-design-research/SKILL.md"), "utf8");
  // Capture method matters: the fetch path reports false blocks.
  assert.match(skill, /browser context, never a fetch/i);
  assert.match(skill, /qlander:design:capture/);
  // A consent wall must not discard a good reference.
  assert.match(skill, /consent banner is not a block/i);
  assert.match(skill, /captured-obstructed/);
  // Mobile evidence taken after a window resize is not evidence.
  assert.match(skill, /emulation/i);
  // Text-only research is a recorded exception, never a silent pass.
  assert.match(skill, /researchException/);
  assert.match(skill, /never silently upgraded/i);
  // Evidence stays out of anything the build publishes.
  assert.match(skill, /gitignored/i);
  assert.match(skill, /public\/`? or `?dist\//i);

  const extraction = await readFile(path.join(repo, "skills/qlander-design-research/references/layout-extraction-template.md"), "utf8");
  for (const dimension of ["Page silhouette", "Alignment and grid", "Section anatomy", "Media geometry", "Hierarchy", "Density and whitespace", "Responsive transformation", "Interaction", "Anti-copy adaptation"]) {
    assert.match(extraction, new RegExp(dimension, "i"), `layout extraction must cover ${dimension}`);
  }
  assert.match(extraction, /proof-band/);
  assert.match(extraction, /no `?factList/i, "the prose-parsing anti-pattern must be named");

  const template = await readFile(path.join(repo, "skills/qlander-design-research/references/design-research-template.md"), "utf8");
  assert.match(template, /reference-manifest\.json/);
  assert.match(template, /skipped-satisfied/);
  assert.match(template, /skipped-budget/);
  assert.match(template, /layout-extraction-template\.md/);
});

test("[fast] prompted design approves a layout blueprint before content population", async () => {
  const design = await readFile(path.join(repo, "skills/qlander-design/SKILL.md"), "utf8");
  assert.match(design, /layout-blueprint\.json/);
  assert.match(design, /src\/design\//);
  // Layout is approved before copy is written into it.
  assert.match(design, /before .*(final )?(copy|content)|approve.*silhouette/i);
  // Bundled variants cannot finish a prompted design.
  assert.match(design, /design-variants/);
  assert.match(design, /do not satisfy|does not satisfy|cannot satisfy/i);
  // The two rules the pilot proved necessary.
  assert.match(design, /parse prose|parsing prose/i);
  assert.match(design, /edit ID|edit id/i);

  const playbook = await readFile(path.join(repo, "docs/agent-playbook.md"), "utf8");
  assert.match(playbook, /layout-blueprint\.json/);
  const agents = await readFile(path.join(repo, "AGENTS.md"), "utf8");
  assert.match(agents, /layout-blueprint\.json/);
});

test("[fast] bundled variants are documented as prototyping aids, not completion", async () => {
  const recipe = await readFile(path.join(repo, "skills/qlander-design/references/layout-handoff-recipe.md"), "utf8");
  assert.match(recipe, /src\/design\/<direction-slug>\/HomePage\.astro/);
  assert.match(recipe, /provenance/);
  assert.match(recipe, /do not satisfy prompted completion/i);
  assert.match(recipe, /alignment seam/i);
  assert.match(recipe, /never parse prose into structure/i);

  const registry = await readFile(path.join(repo, "src/layout-handoffs.ts"), "utf8");
  assert.match(registry, /design-variants/);
  assert.match(registry, /research-derived/);
  // A shipped kit must never register a design handoff of its own.
  assert.match(registry, /export const pageHandoffs: Record<string, LayoutHandoff> = \{\};/);
  assert.match(registry, /export const sectionHandoffs: Record<string, LayoutHandoff> = \{\};/);
});

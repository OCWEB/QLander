#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import fg from "fast-glob";
import { XMLParser } from "fast-xml-parser";
import matter from "gray-matter";
import { parse } from "node-html-parser";
import type { z } from "zod";
import { BlogFrontmatterSchema, EditMapSchema, ManifestSchema, NavigationSchema, PageContentSchema, ProductSchema, RouteSeoSchema, ScrollWorldExperienceSchema, ScrollWorldQueueSchema, SiteDataSchema, ThemeSchema, isSafeHref } from "../src/lib/schemas";

type Status = "passed" | "warning" | "failed" | "skipped";
type Message = { code: string; message: string; path?: string; route?: string };
const names = ["schema", "build", "seo", "links", "accessibility", "sitemap", "robots", "visual"] as const;
const args = process.argv.slice(2);
const root = path.resolve(args.find((arg) => !arg.startsWith("--")) ?? ".");
const json = args.includes("--json");
const launch = args.includes("--launch");
const skipBuild = args.includes("--skip-build");
const checks = Object.fromEntries(names.map((name) => [name, "passed"])) as Record<(typeof names)[number], Status>;
const errors: Message[] = [];
const warnings: Message[] = [];
const addError = (code: string, message: string, extra: Partial<Message> = {}) => errors.push({ code, message, ...extra });
const addWarning = (code: string, message: string, extra: Partial<Message> = {}) => warnings.push({ code, message, ...extra });
const readJson = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));

type Model = Awaited<ReturnType<typeof loadModel>>;
let model: Model | undefined;
try { model = await loadModel(); } catch (error) { addError("schema.load_failed", error instanceof Error ? error.message : "Unable to load site"); }
if (errors.some((item) => item.code.startsWith("schema.") || item.code.startsWith("edit_map."))) checks.schema = "failed";

if (model) {
  validateEditMap(model);
  validateLaunch(model);
  validateProfile(model);
  validatePpcPages(model);
  await validateImagePrompts(model);
  validateExperienceAssets(model);
}

if (!skipBuild) {
  const built = await runBuild();
  if (!built.ok) { checks.build = "failed"; addError("build.failed", built.output || "Build failed"); }
} else {
  checks.build = "skipped";
  checks.seo = checks.links = checks.accessibility = checks.sitemap = checks.robots = checks.visual = "skipped";
}

if (!skipBuild && checks.build === "passed" && model) await validateDist(model);
if (errors.some((item) => item.code.startsWith("schema.") || item.code.startsWith("edit_map."))) checks.schema = "failed";
for (const name of ["seo", "links", "accessibility", "sitemap", "robots", "visual"] as const) {
  if (checks[name] !== "skipped" && errors.some((item) => item.code.startsWith(`${name}.`))) checks[name] = "failed";
}
for (const name of names) if (checks[name] === "passed" && warnings.some((item) => item.code.startsWith(`${name}.`))) checks[name] = "warning";
const result = { id: `check_${randomUUID().slice(0, 8)}`, siteId: model?.manifest.siteId ?? "unknown", status: errors.length ? "failed" : warnings.length ? "warning" : "passed", checks, warnings, errors };
if (json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`QLander checks: ${result.status.toUpperCase()}`);
  for (const [name, status] of Object.entries(checks)) console.log(`- ${name}: ${status}`);
  for (const warning of warnings) console.log(`WARN ${warning.code}: ${warning.message}`);
  for (const error of errors) console.error(`ERROR ${error.code}: ${error.message}`);
}
if (errors.length) process.exitCode = 1;

async function loadModel() {
  const parseFile = async <T extends z.ZodTypeAny>(schema: T, file: string): Promise<z.output<T>> => {
    const parsed = schema.safeParse(await readJson(file));
    if (!parsed.success) { for (const issue of parsed.error.issues) addError("schema.invalid", `${file}: ${issue.path.join(".") || "(root)"} ${issue.message}`, { path: file }); throw new Error(`Invalid ${file}`); }
    return parsed.data;
  };
  const manifest = await parseFile(ManifestSchema, "qlander.manifest.json");
  const editMap = await parseFile(EditMapSchema, manifest.editMap);
  const site = await parseFile(SiteDataSchema, "data/site.json");
  const navigation = await parseFile(NavigationSchema, "data/navigation.json");
  const theme = await parseFile(ThemeSchema, "data/theme.json");
  const routeSeo = await parseFile(RouteSeoSchema, "data/route-seo.json");
  const pages = await Promise.all((await fg("content/pages/*.json", { cwd: root })).map(async (file) => ({ file, data: PageContentSchema.parse(await readJson(file)) })));
  const products = await Promise.all((await fg("content/products/*.json", { cwd: root })).map(async (file) => ({ file, data: ProductSchema.parse(await readJson(file)) })));
  const posts = await Promise.all((await fg("content/blog/*.md", { cwd: root })).map(async (file) => ({ file, data: BlogFrontmatterSchema.parse(matter(await readFile(path.join(root, file), "utf8")).data) })));
  const experiences = await Promise.all((await fg("data/experiences/*.json", { cwd: root })).map(async (file) => ({ file, data: ScrollWorldExperienceSchema.parse(await readJson(file)) })));
  const queues = await Promise.all((await fg("scroll-world/**/queue.json", { cwd: root })).map(async (file) => ({ file, data: ScrollWorldQueueSchema.parse(await readJson(file)) })));
  return { manifest, editMap, site, navigation, theme, routeSeo, pages, products, posts, experiences, queues };
}

function validateProfile(model: Model) {
  const profile = model.manifest.projectType;
  if (!profile) return;
  const routes = model.manifest.routes;
  if (profile === "single-page-ppc") {
    if (routes.length !== 2 || !routes.includes("/") || !routes.includes("/404")) addError("schema.profile_routes", "single-page-ppc requires only / and /404");
    const home = model.pages.find((page) => page.data.slug === "/");
    if (!home || home.data.layout !== "ppc") addError("schema.profile_ppc_home", "single-page-ppc requires a root page with layout=ppc");
  }
  if (profile === "root-scroll-world") {
    if (routes.length !== 2 || !routes.includes("/") || !routes.includes("/404")) addError("schema.profile_routes", "root-scroll-world requires only / and /404");
    if (!model.experiences.some((experience) => experienceRoute(experience.data) === "/")) addError("schema.profile_root_experience", "root-scroll-world requires a Scroll World experience with route=/");
  }
  if (profile === "internal-scroll-world" && !model.experiences.some((experience) => {
    const route = experienceRoute(experience.data);
    return route !== null && route !== "/";
  })) addError("schema.profile_internal_experience", "internal-scroll-world requires at least one named experience route");
}

function validatePpcPages(model: Model) {
  for (const page of model.pages.filter((item) => item.data.layout === "ppc")) {
    const primary = page.data.sections.flatMap((section) => section.type === "hero" ? [section.primaryCta.href] : section.type === "cta" ? [section.cta.href] : []);
    if (!primary.length) addError("schema.ppc_cta_missing", `PPC page ${page.data.slug} needs a primary conversion action`, { route: page.data.slug });
    if (new Set(primary).size > 1) addError("schema.ppc_cta_mismatch", `PPC page ${page.data.slug} must reuse one primary CTA destination`, { route: page.data.slug });
  }
}

function validateLaunch(model: Model) {
  if (model.site.launchStatus === "draft") addWarning("seo.draft", "Draft mode forces every route to noindex and blocks crawling");
  if (!launch) return;
  if (model.site.launchStatus !== "live") addError("seo.launch_status", "Launch mode requires launchStatus=live");
  if (new URL(model.site.url).hostname === "example.com") addError("seo.placeholder_domain", "Launch mode requires a production domain");
  if (model.site.email && model.site.email.endsWith("@example.com")) addError("schema.placeholder_email", "Launch mode requires a real contact email");
  if (model.site.phone && /555/.test(model.site.phone)) addError("schema.placeholder_phone", "Launch mode requires a real phone number");
  if (!model.site.email && !model.site.phone && !model.site.contactUrl) addError("schema.contact_missing", "Launch mode requires an email, phone number, or HTTPS contact URL");
  if (!model.site.socialImage) addError("seo.social_image_missing", "Launch mode requires a default social image");
  if (!model.site.address.street || !model.site.address.postalCode) addError("schema.address_incomplete", "Launch mode requires a complete address");
}

async function validateImagePrompts(model: Model) {
  const promptIds = new Set<string>();
  for (const page of model.pages) {
    for (const section of page.data.sections) {
      if ((section.type === "hero" || section.type === "richText") && section.imagePromptId) promptIds.add(section.imagePromptId);
      if (section.type === "featureGrid") for (const item of section.items) if (item.imagePromptId) promptIds.add(item.imagePromptId);
    }
  }
  for (const product of model.products) if (product.data.imagePromptId) promptIds.add(product.data.imagePromptId);
  if (!promptIds.size) return;
  const documented = new Set<string>();
  for (const file of await fg("content/prompts/**/*.md", { cwd: root })) {
    const source = await readFile(path.join(root, file), "utf8");
    for (const match of source.matchAll(/^##\s+([a-z0-9]+(?:[.-][a-z0-9]+)*)\s*$/gim)) documented.add(match[1].toLowerCase());
  }
  for (const id of promptIds) if (!documented.has(id)) addError("schema.image_prompt_missing", `Image prompt ${id} needs a matching ## ${id} heading under content/prompts/`);
}

function validateExperienceAssets(model: Model) {
  const assets = new Set<string>();
  for (const experience of model.experiences) {
    for (const section of experience.data.sections) for (const value of [section.still, section.stillMobile, section.clip, section.clipMobile]) if (value) assets.add(value);
    for (const value of [...experience.data.connectors, ...experience.data.connectorsMobile]) if (value) assets.add(value);
  }
  for (const asset of assets) if (!existsSync(path.join(root, "public", asset))) addError("links.experience_asset_missing", `Missing Scroll World asset ${asset}`, { path: asset });
  for (const queue of model.queues) {
    const experience = model.experiences.find((item) => item.data.slug === queue.data.experience);
    if (!experience) addError("schema.queue_experience_missing", `${queue.file} references unknown experience ${queue.data.experience}`, { path: queue.file });
    const ids = new Set(queue.data.jobs.map((job) => job.id));
    for (const job of queue.data.jobs) for (const dependency of job.dependencies) if (!ids.has(dependency)) addError("schema.queue_dependency_missing", `${queue.file} job ${job.id} references missing dependency ${dependency}`, { path: queue.file });
  }
}

function validateEditMap(model: Model) {
  const routes = new Set(model.manifest.routes);
  const experienceRoutes = new Set<string>(model.experiences.flatMap((experience) => {
    const route = experienceRoute(experience.data);
    return route === null ? [] : [route];
  }));
  const sectionIds = new Set(model.pages.filter((page) => !experienceRoutes.has(page.data.slug)).flatMap((page) => page.data.sections.map((section) => section.id)));
  for (const id of sectionIds) if (!model.editMap[id]) addError("edit_map.section_missing", `No edit-map entry for ${id}`);
  for (const page of model.pages) for (const section of page.data.sections) if (section.type === "scrollSection") {
    const experience = model.experiences.find((item) => item.data.slug === section.experience);
    if (!experience) addError("schema.scroll_section_experience_missing", `${page.file} references unknown scroll-section experience ${section.experience}`);
    else if (experience.data.placement !== "section") addError("schema.scroll_section_placement", `${page.file} references ${section.experience}, but its placement is not section`);
  }
  for (const experience of model.experiences) {
    const id = `experience.${experience.data.slug}`;
    const fileSlug = path.basename(experience.file, ".json");
    if (fileSlug !== experience.data.slug) addError("schema.experience_filename", `${experience.file} must match slug ${experience.data.slug}`);
    if (!model.editMap[id]) addError("edit_map.experience_missing", `No edit-map entry for ${id}`);
    const route = experienceRoute(experience.data);
    if (experience.data.placement === "section") {
      const references = model.pages.filter((page) => page.data.sections.some((section) => section.type === "scrollSection" && section.experience === experience.data.slug));
      if (!references.length) addError("schema.scroll_section_unreferenced", `${experience.file} is a section experience but no page references it`);
      if (model.manifest.routes.includes(`/${experience.data.slug}`)) addError("schema.scroll_section_route_leak", `Section experience ${experience.data.slug} must not add /${experience.data.slug} to the manifest`);
    } else if (route && !routes.has(route)) addError("schema.manifest_experience_missing", `Manifest is missing Scroll World route ${route}`);
  }
  for (const [id, entry] of Object.entries(model.editMap)) {
    const file = path.join(root, entry.contentFile);
    if (!entry.contentFile.match(/^(content|data)\//) || !existsSync(file)) { addError("edit_map.file_missing", `${id} points to missing or unsafe file ${entry.contentFile}`); continue; }
    const source = JSON.parse(readFileSync(file, "utf8"));
    const value = resolveJsonPath(source, entry.jsonPath);
    if (value === undefined) { addError("edit_map.path_missing", `${id} has invalid jsonPath ${entry.jsonPath}`); continue; }
    const allowed = allowedFields(value, entry.jsonPath);
    for (const field of entry.safeFields) if (!allowed.has(field)) addError("edit_map.safe_field_invalid", `${id} has unsupported safe field ${field}`);
    const affected = entry.affectedRoutes === "all" ? [] : entry.affectedRoutes;
    for (const route of affected) if (!routes.has(route)) addError("edit_map.route_missing", `${id} references unknown route ${route}`);
  }
}

function allowedFields(value: any, jsonPath: string) {
  if (Array.isArray(value)) return new Set(["[].label", "[].href"]);
  if (value?.type === "hero") return new Set(["eyebrow", "headline", "subheadline", "primaryCta.label", "primaryCta.href", "secondaryCta.label", "secondaryCta.href", "image.src", "image.alt", "image.width", "image.height", "imagePromptId"]);
  if (value?.type === "featureGrid") return new Set(["eyebrow", "headline", "items[].title", "items[].description", "items[].image.src", "items[].image.alt", "items[].image.width", "items[].image.height", "items[].imagePromptId"]);
  if (value?.type === "productGrid") return new Set(["headline", "productSlugs"]);
  if (value?.type === "cta") return new Set(["headline", "body", "cta.label", "cta.href"]);
  if (value?.type === "contact") return new Set(["headline", "body"]);
  if (value?.type === "richText") return new Set(["headline", "body", "visual", "image.src", "image.alt", "image.width", "image.height", "imagePromptId"]);
  if (value?.type === "scrollSection") return new Set(["experience", "headingLevel"]);
  if (value?.kind === "scroll-world") return new Set(["route", "seo.title", "seo.description", "seo.noindex", "seo.socialImage", "brand.name", "brand.href", "cta.label", "cta.href", "hint", "diveScroll", "connScroll", "crossfade", "nav", "atmosphere", "sections[].label", "sections[].accent", "sections[].still", "sections[].stillMobile", "sections[].clip", "sections[].clipMobile", "sections[].scroll", "sections[].linger", "sections[].eyebrow", "sections[].title", "sections[].body", "sections[].tags", "sections[].cta.primary.label", "sections[].cta.primary.href", "sections[].cta.secondary.label", "sections[].cta.secondary.href", "connectors", "connectorsMobile"]);
  if (value?.slug && value?.summary && value?.title) return new Set(["title", "summary", "description", "priceLabel", "featured", "image.src", "image.alt", "image.width", "image.height", "imagePromptId", "seo.title", "seo.description", "seo.noindex", "seo.socialImage"]);
  if (value?.title && value?.description && jsonPath !== "$") return new Set(["title", "description", "noindex", "socialImage", "eyebrow", "heading", "itemCtaLabel", "detailCtaLabel", "detailCtaHref"]);
  return new Set(["name", "description", "url", "launchStatus", "locale", "logo", "socialImage", "email", "phone", "contactUrl", "address.street", "address.city", "address.region", "address.postalCode", "address.country", "social.linkedin", "social.x", "social.facebook", "social.instagram", "social.youtube"]);
}

async function validateDist(model: Model) {
  const dist = path.join(root, "dist");
  const files = await fg("**/*.html", { cwd: dist, absolute: true });
  const builtRoutes = new Set(files.map((file) => htmlRoute(file, dist)));
  const manifestRoutes = new Set(model.manifest.routes);
  for (const route of builtRoutes) if (!manifestRoutes.has(route)) addError("schema.manifest_route_missing", `Manifest is missing built route ${route}`);
  for (const route of manifestRoutes) if (!builtRoutes.has(route)) addError("schema.manifest_route_stale", `Manifest route ${route} has no built HTML`);
  const renderedMarkers = new Map<string, Set<string>>();
  for (const file of files) {
    const route = htmlRoute(file, dist);
    const document = parse(await readFile(file, "utf8"));
    const h1 = document.querySelectorAll("h1").length;
    if (route !== "/404" && h1 !== 1) addError("seo.h1_count", `Expected one H1 on ${route}, found ${h1}`, { route });
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
    const expectedCanonical = new URL(route === "/404" ? "/404" : route, `${model.site.url.replace(/\/$/, "")}/`).toString();
    if (canonical !== expectedCanonical) addError("seo.canonical_mismatch", `Canonical on ${route} must be ${expectedCanonical}`, { route });
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "";
    const sourceNoindex = routeNoindex(route, model);
    const expectedNoindex = model.site.launchStatus === "draft" || sourceNoindex;
    if (robots.startsWith("noindex") !== expectedNoindex) addError("seo.robots_mismatch", `Robots meta is incorrect on ${route}`, { route });
    for (const selector of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:url"]']) if (!document.querySelector(selector)) addError("seo.required_tag_missing", `Missing ${selector} on ${route}`, { route });
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) { try { JSON.parse(script.text); } catch { addError("seo.json_ld_invalid", `Invalid JSON-LD on ${route}`, { route }); } }
    const markers = new Set(document.querySelectorAll("[data-pp-edit-id]").map((node) => node.getAttribute("data-pp-edit-id") ?? ""));
    renderedMarkers.set(route, markers);
    for (const marker of markers) if (!model.editMap[marker]) addError("edit_map.marker_unmapped", `Rendered marker ${marker} is not mapped`, { route });
    for (const anchor of document.querySelectorAll("a[href]")) {
      const href = anchor.getAttribute("href") ?? "";
      if (!isSafeHref(href)) addError("links.unsafe", `Unsafe link ${href} on ${route}`, { route });
      if (href.startsWith("/") && !href.startsWith("//")) { const target = normalize(href.split(/[?#]/)[0] || "/"); if (!builtRoutes.has(target) && !isAsset(href)) addError("links.internal_broken", `Broken link ${href} on ${route}`, { route }); }
      if (!anchor.text.trim() && !anchor.getAttribute("aria-label")) addError("accessibility.link_label_missing", `Unlabeled link on ${route}`, { route });
    }
    for (const image of document.querySelectorAll("img")) {
      const src = image.getAttribute("src") ?? "";
      if (!image.hasAttribute("alt") || !image.getAttribute("width") || !image.getAttribute("height")) addError("accessibility.image_metadata", `Image ${src} needs alt, width, and height`, { route });
      if (src.startsWith("/") && !existsSync(path.join(root, "public", src))) addError("links.image_missing", `Missing image ${src}`, { route });
    }
    for (const form of document.querySelectorAll("form")) if ((form.getAttribute("method") ?? "get").toLowerCase() === "post" && !form.getAttribute("action")) addError("accessibility.form_inert", `POST form on ${route} has no action`, { route });
    if ((document.querySelector("body")?.text.trim() ?? "").length < 120 && route !== "/404") addWarning("visual.body_sparse", `Rendered page ${route} has little visible text`, { route });
    const ppcPage = model.pages.find((page) => page.data.slug === route && page.data.layout === "ppc");
    if (ppcPage) {
      if (document.querySelector(".site-header") || document.querySelector(".site-footer")) addError("visual.ppc_chrome_leak", `PPC page ${route} must not render normal site chrome`, { route });
      if (!document.querySelector(".landing-header")) addError("visual.ppc_landing_header_missing", `PPC page ${route} must render the landing header`, { route });
    }
  }
  for (const [id, entry] of Object.entries(model.editMap)) {
    if (["SiteData", "SEO"].includes(entry.component)) continue;
    const routes = (entry.affectedRoutes === "all" ? [...builtRoutes] : entry.affectedRoutes).filter((route) => {
      const experienceOwnsRoute = model.experiences.some((experience) => experienceRoute(experience.data) === route);
      if (experienceOwnsRoute) return entry.component === "ScrollWorldExperience";
      if (!["Header", "Footer"].includes(entry.component)) return true;
      return model.pages.find((page) => page.data.slug === route)?.data.layout !== "ppc";
    });
    for (const route of routes) if (!renderedMarkers.get(route)?.has(id)) addError("edit_map.marker_missing", `${id} is not rendered on ${route}`, { route });
  }
  validateSitemap(model, builtRoutes);
  validateRobots(model);
  if (errors.some((item) => item.code.startsWith("links."))) checks.links = "failed";
  if (errors.some((item) => item.code.startsWith("seo."))) checks.seo = "failed";
  if (errors.some((item) => item.code.startsWith("accessibility."))) checks.accessibility = "failed";
  if (errors.some((item) => item.code.startsWith("edit_map.") || item.code.startsWith("schema.manifest"))) checks.schema = "failed";
}

function validateSitemap(model: Model, builtRoutes: Set<string>) {
  const file = path.join(root, "dist/sitemap.xml");
  if (!existsSync(file)) { checks.sitemap = "failed"; addError("sitemap.missing", "dist/sitemap.xml is missing"); return; }
  const parsed = new XMLParser().parse(readFileSync(file, "utf8")) as any;
  const raw = parsed.urlset?.url ? (Array.isArray(parsed.urlset.url) ? parsed.urlset.url : [parsed.urlset.url]) : [];
  const actual = new Set<string>(raw.map((item: any) => String(item.loc)));
  const expected = new Set(model.site.launchStatus === "live" ? [...builtRoutes].filter((route) => !routeNoindex(route, model)).map((route) => `${model.site.url.replace(/\/$/, "")}${route === "/" ? "/" : route}`) : []);
  for (const url of expected) if (!actual.has(url)) addError("sitemap.route_missing", `Sitemap is missing ${url}`);
  for (const url of actual) if (!expected.has(url)) addError("sitemap.route_unexpected", `Sitemap includes unexpected ${url}`);
  if (errors.some((item) => item.code.startsWith("sitemap."))) checks.sitemap = "failed";
}

function validateRobots(model: Model) {
  const text = readFileSync(path.join(root, "dist/robots.txt"), "utf8");
  if (model.site.launchStatus === "draft" && !/Disallow:\s*\//i.test(text)) addError("robots.draft_open", "Draft robots.txt must disallow crawling");
  if (model.site.launchStatus === "live" && (!/Allow:\s*\//i.test(text) || !text.includes(`${model.site.url.replace(/\/$/, "")}/sitemap.xml`))) addError("robots.live_invalid", "Live robots.txt must allow crawling and link the sitemap");
  if (errors.some((item) => item.code.startsWith("robots."))) checks.robots = "failed";
}

function routeNoindex(route: string, model: Model) {
  if (route === "/404") return true;
  if (route === "/products") return model.routeSeo.products.noindex;
  if (route === "/blog") return model.routeSeo.blog.noindex;
  const page = model.pages.find((item) => item.data.slug === route); if (page) return page.data.seo.noindex;
  const product = model.products.find((item) => `/products/${item.data.slug}` === route); if (product) return product.data.seo.noindex;
  const post = model.posts.find((item) => `/blog/${item.data.slug}` === route); if (post) return post.data.seo.noindex;
  const experience = model.experiences.find((item) => experienceRoute(item.data) === route); if (experience) return experience.data.seo.noindex;
  return false;
}

function resolveJsonPath(value: any, expression: string) { if (expression === "$") return value; return expression.replace(/\[(\d+)\]/g, ".$1").split(".").reduce((current, key) => current?.[key], value); }
function experienceRoute(experience: { slug: string; placement?: "route" | "section"; route?: "/" }) { return experience.placement === "section" ? null : experience.route ?? `/${experience.slug}`; }
function normalize(route: string) { return route === "/" ? "/" : `/${route.replace(/^\/+|\/+$/g, "")}`; }
function isAsset(href: string) { return /\.(avif|gif|ico|jpg|jpeg|png|svg|webp|xml|txt)$/i.test(href.split(/[?#]/)[0]); }
function htmlRoute(file: string, dist: string) { const relative = path.relative(dist, file).replace(/\\/g, "/"); if (relative === "index.html") return "/"; if (relative.endsWith("/index.html")) return `/${relative.replace(/\/index\.html$/, "")}`; return `/${relative.replace(/\.html$/, "")}`; }
function runBuild(): Promise<{ ok: boolean; output: string }> {
  // The Astro content-layer cache keeps deleted collection entries alive and re-emits their routes, so validation always builds from a cleared cache.
  for (const cacheDir of [path.join(root, ".astro"), path.join(root, "node_modules", ".astro")]) rmSync(cacheDir, { recursive: true, force: true });
  return new Promise((resolve) => { const child = spawn("pnpm", ["run", "build"], { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"] }); let output = ""; child.stdout.on("data", (chunk) => output += chunk); child.stderr.on("data", (chunk) => output += chunk); child.on("close", (code) => resolve({ ok: code === 0, output: output.trim() })); });
}

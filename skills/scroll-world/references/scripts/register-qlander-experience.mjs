#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const legacyRoot = typeof args.root === "string" ? args.root : undefined;
const rootMode = args.root === true;
const sectionMode = args.section === true;
const prune = args.prune === true;
const root = path.resolve(args["project-root"] ?? legacyRoot ?? ".");
const requestedSlug = args.slug ?? "tour";
const slug = rootMode ? "root" : requestedSlug;
const title = args.title ?? "Product Tour";
const description = args.description ?? "Explore this product through an interactive visual journey.";
const ctaLabel = args["cta-label"] ?? "Get started";
const ctaHref = args["cta-href"] ?? (rootMode ? "https://example.com/contact" : "/contact");

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail("--slug must use lowercase letters, numbers, and hyphens");
if (!isSafeHref(ctaHref)) fail("--cta-href must be an internal path, fragment, or HTTPS URL");
if (prune && !rootMode) fail("--prune is only valid with the boolean --root delivery flag");
if (rootMode && sectionMode) fail("Choose either --root or --section, not both");
if (sectionMode && args.after && args.replace) fail("Choose either --after or --replace for a scroll-section, not both");

const manifestFile = path.join(root, "qlander.manifest.json");
const editMapFile = path.join(root, "qlander.edit-map.json");
const siteFile = path.join(root, "data/site.json");
const renderer = rootMode
  ? path.join(root, "src/components/ScrollWorldPage.astro")
  : sectionMode
    ? path.join(root, "src/components/ScrollSection.astro")
    : path.join(root, "src/pages/[experience].astro");
for (const file of [manifestFile, editMapFile, siteFile, renderer]) if (!existsSync(file)) fail(`Not a compatible QLander project: missing ${path.relative(root, file)}`);

const manifest = await readJson(manifestFile);
const editMap = await readJson(editMapFile);
const site = await readJson(siteFile);
const pageName = args.page ?? "home";
if (sectionMode && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageName)) fail("--page must name a content/pages JSON file without its extension");
const pageRelative = sectionMode ? `content/pages/${pageName}.json` : undefined;
const pageFile = pageRelative ? path.join(root, pageRelative) : undefined;
if (pageFile && !existsSync(pageFile)) fail(`Cannot add a scroll-section: missing ${pageRelative}`);
const page = pageFile ? await readJson(pageFile) : undefined;
const route = sectionMode ? page.slug : rootMode ? "/" : `/${slug}`;
const editId = rootMode ? "experience.root" : `experience.${slug}`;
const sectionEditId = sectionMode ? `${pageName}.scroll-${slug}` : undefined;
const configRelative = `data/experiences/${slug}.json`;
const configFile = path.join(root, configRelative);
const assetRelative = `public/experiences/${slug}`;
const assetDir = path.join(root, assetRelative);
const posterRelative = `${assetRelative}/poster.svg`;
const posterUrl = `/experiences/${slug}/poster.svg`;
const queueRelative = `scroll-world/${slug}`;
const queueDir = path.join(root, queueRelative);

if (existsSync(configFile)) fail(`${configRelative} already exists; edit it instead of re-registering the experience`);
if (!rootMode && !sectionMode && manifest.routes.includes(route)) fail(`${route} already exists in qlander.manifest.json; choose another slug`);
if (sectionMode && !manifest.routes.includes(route)) fail(`${pageRelative} declares ${route}, which is missing from qlander.manifest.json`);
if (editMap[editId]) fail(`${editId} already exists in qlander.edit-map.json`);
if (sectionEditId && editMap[sectionEditId]) fail(`${sectionEditId} already exists in qlander.edit-map.json`);

const config = {
  kind: "scroll-world",
  slug,
  placement: sectionMode ? "section" : "route",
  ...(rootMode ? { route: "/" } : {}),
  seo: { title, description, noindex: true },
  brand: { name: site.name, href: rootMode ? site.url : "/" },
  cta: { label: ctaLabel, href: ctaHref },
  hint: "scroll to explore",
  diveScroll: 1.3,
  connScroll: 0.9,
  crossfade: 0.12,
  nav: true,
  atmosphere: true,
  sections: [{
    id: "intro",
    label: "Introduction",
    accent: "#6B7280",
    still: posterUrl,
    eyebrow: "Interactive experience",
    title,
    body: description,
    tags: [],
    cta: { primary: { label: ctaLabel, href: ctaHref } }
  }],
  connectors: [],
  connectorsMobile: []
};

if (rootMode && prune) await pruneToRootProfile(root, manifest, editMap);
if (!rootMode && !sectionMode) {
  const insertAt = manifest.routes.indexOf("/404");
  if (insertAt === -1) manifest.routes.push(route);
  else manifest.routes.splice(insertAt, 0, route);
}

if (sectionMode) insertSectionReference({ page, pageRelative, route, sectionEditId, slug, title, editMap, after: args.after, replace: args.replace });

editMap[editId] = {
  route,
  label: `${title} ${sectionMode ? "scroll-section" : "Scroll World experience"}`,
  scope: "experience-config",
  contentFile: configRelative,
  jsonPath: "$",
  component: sectionMode ? "ScrollSectionExperience" : "ScrollWorldExperience",
  safeFields: [
    "route", "seo.title", "seo.description", "seo.noindex", "seo.socialImage",
    "brand.name", "brand.href", "cta.label", "cta.href", "hint",
    "diveScroll", "connScroll", "crossfade", "nav", "atmosphere",
    "sections[].label", "sections[].accent", "sections[].still", "sections[].stillMobile",
    "sections[].clip", "sections[].clipMobile", "sections[].scroll", "sections[].linger",
    "sections[].eyebrow", "sections[].title", "sections[].body", "sections[].tags",
    "sections[].cta.primary.label", "sections[].cta.primary.href",
    "sections[].cta.secondary.label", "sections[].cta.secondary.href",
    "connectors", "connectorsMobile"
  ],
  affectedRoutes: [route]
};

const now = new Date().toISOString();
const queue = {
  version: 1,
  experience: slug,
  mode: "manual",
  provider: "Magnific",
  mobile: false,
  status: "phase1-ready",
  updatedAt: now,
  jobs: [
    { id: "S1", phase: 1, kind: "still", filename: "still_1_intro.png", status: "pending", dependencies: [] },
    { id: "V1", phase: 1, kind: "dive", filename: "dive_1_intro.mp4", status: "pending", dependencies: ["S1"] }
  ]
};

await mkdir(path.dirname(configFile), { recursive: true });
await mkdir(assetDir, { recursive: true });
await mkdir(path.join(queueDir, "results"), { recursive: true });
await writeJson(configFile, config);
if (pageFile) await writeJson(pageFile, page);
await writeJson(manifestFile, manifest);
await writeJson(editMapFile, editMap);
await writeJson(path.join(queueDir, "queue.json"), queue);
await writeFile(path.join(queueDir, "queue.md"), queueMarkdown({ title, slug }));
await writeFile(path.join(root, posterRelative), placeholderSvg(title));

console.log(`Registered QLander ${sectionMode ? `scroll-section on ${route}` : rootMode ? "Scroll World root experience" : `Scroll World route ${route}`}`);
console.log(`  config: ${configRelative}`);
console.log(`  assets: ${assetRelative}/`);
console.log(`  queue: ${queueRelative}/queue.json`);
console.log(`  edit id: ${editId}`);
console.log("Next: replace the placeholder journey, expand queue.md and queue.json together, then run pnpm qlander:check.");

async function pruneToRootProfile(projectRoot, manifestValue, editMapValue) {
  const files = [
    "src/pages/about.astro", "src/pages/contact.astro", "src/pages/privacy.astro",
    "src/pages/blog/index.astro", "src/pages/blog/[slug].astro",
    "src/pages/products/index.astro", "src/pages/products/[slug].astro",
    "src/pages/resources/index.astro", "src/pages/resources/[slug].astro"
  ];
  for (const file of files) await rm(path.join(projectRoot, file), { force: true });
  for (const directory of ["content/pages", "content/products", "content/resources", "content/blog"]) {
    await rm(path.join(projectRoot, directory), { recursive: true, force: true });
    await mkdir(path.join(projectRoot, directory), { recursive: true });
  }
  manifestValue.routes = ["/", "/404"];
  manifestValue.projectType = "root-scroll-world";
  for (const key of Object.keys(editMapValue)) delete editMapValue[key];
  editMapValue["global.header"] = { route: "*", label: "404 support header", scope: "global-navigation", contentFile: "data/navigation.json", jsonPath: "header", component: "Header", safeFields: ["[].label", "[].href"], affectedRoutes: ["/404"] };
  editMapValue["global.footer"] = { route: "*", label: "404 support footer", scope: "global-navigation", contentFile: "data/navigation.json", jsonPath: "footer", component: "Footer", safeFields: ["[].label", "[].href"], affectedRoutes: ["/404"] };
  editMapValue["site.info"] = { route: "*", label: "Site information", scope: "global-content", contentFile: "data/site.json", jsonPath: "$", component: "SiteData", safeFields: ["name", "description", "url", "launchStatus", "locale", "logo", "socialImage", "email", "phone", "contactUrl", "address.street", "address.city", "address.region", "address.postalCode", "address.country", "social.linkedin", "social.x"], affectedRoutes: "all" };
  editMapValue["route.notFound.seo"] = { route: "/404", label: "404 SEO", scope: "route-metadata", contentFile: "data/route-seo.json", jsonPath: "notFound", component: "SEO", safeFields: ["title", "description", "noindex", "socialImage"], affectedRoutes: ["/404"] };
  await writeJson(path.join(projectRoot, "data/navigation.json"), { header: [{ label: "Experience", href: "/" }], footer: [{ label: "Home", href: "/" }] });
}

function parseArgs(values) {
  const result = {};
  const booleans = new Set(["prune", "section"]);
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--") continue;
    if (!value.startsWith("--")) fail(`Unexpected argument ${value}`);
    const [rawKey, inline] = value.slice(2).split("=", 2);
    if (inline !== undefined) { result[rawKey] = inline || true; continue; }
    const candidate = values[index + 1];
    if (rawKey === "root") {
      if (candidate && !candidate.startsWith("--")) { result.root = candidate; index += 1; }
      else result.root = true;
      continue;
    }
    if (booleans.has(rawKey)) { result[rawKey] = true; continue; }
    if (!candidate || candidate.startsWith("--")) fail(`Missing value for --${rawKey}`);
    result[rawKey] = candidate;
    index += 1;
  }
  return result;
}

function insertSectionReference({ page, pageRelative, route, sectionEditId, slug, title, editMap, after, replace }) {
  if (!page || !Array.isArray(page.sections)) fail(`${pageRelative} does not contain a sections array`);
  if (page.sections.some((section) => section.type === "scrollSection" && section.experience === slug)) fail(`${pageRelative} already references ${slug}`);
  let insertAt = Math.min(1, page.sections.length);
  let headingLevel = "h2";
  if (replace) {
    insertAt = page.sections.findIndex((section) => section.id === replace);
    if (insertAt === -1) fail(`--replace ${replace} was not found in ${pageRelative}`);
    const replaced = page.sections[insertAt];
    headingLevel = replaced.type === "hero" ? "h1" : "h2";
    delete editMap[replaced.id];
    page.sections.splice(insertAt, 1, { id: sectionEditId, type: "scrollSection", experience: slug, headingLevel });
  } else if (after) {
    const afterIndex = page.sections.findIndex((section) => section.id === after);
    if (afterIndex === -1) fail(`--after ${after} was not found in ${pageRelative}`);
    insertAt = afterIndex + 1;
  }
  if (!replace) {
    for (const entry of Object.values(editMap)) {
      if (entry.contentFile !== pageRelative) continue;
      const match = /^sections\[(\d+)\]$/.exec(entry.jsonPath);
      if (match && Number(match[1]) >= insertAt) entry.jsonPath = `sections[${Number(match[1]) + 1}]`;
    }
    page.sections.splice(insertAt, 0, { id: sectionEditId, type: "scrollSection", experience: slug, headingLevel });
  }
  editMap[sectionEditId] = {
    route,
    label: `${title} scroll-section placement`,
    scope: "single-page-content",
    contentFile: pageRelative,
    jsonPath: `sections[${insertAt}]`,
    component: "ScrollSection",
    safeFields: ["experience", "headingLevel"],
    affectedRoutes: [route]
  };
}

async function readJson(file) { return JSON.parse(await readFile(file, "utf8")); }
async function writeJson(file, value) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, `${JSON.stringify(value, null, 2)}\n`); }
function isSafeHref(value) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("..")) return true;
  if (value.startsWith("#") && value.length > 1) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
function xml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function placeholderSvg(value) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc"><title id="title">${xml(value)} placeholder</title><desc id="desc">Replace with an approved Scroll World scene still.</desc><rect width="1600" height="900" fill="#e5e7eb"/><path d="M0 0 1600 900M1600 0 0 900" stroke="#9ca3af" stroke-width="4"/><rect x="280" y="330" width="1040" height="240" rx="24" fill="#f9fafb" stroke="#6b7280" stroke-width="3"/><text x="800" y="425" text-anchor="middle" font-family="system-ui,sans-serif" font-size="54" fill="#111827">${xml(value)}</text><text x="800" y="495" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="#4b5563">Scroll World media placeholder</text></svg>\n`;
}
function queueMarkdown({ title, slug }) {
  return `# ${title} — manual slow queue\n\nStatus: **Phase 1 ready**. Keep this checklist synchronized with \`queue.json\`.\n\n## Phase 1\n\n- [ ] **S1 · still · intro** → save as \`still_1_intro.png\`\n- [ ] **V1 · dive · intro** → save as \`dive_1_intro.mp4\` using \`still_1_intro.png\` as the start frame\n\nExpand this file and \`queue.json\` after the approved ${slug} journey has more scenes. Phase 2 connectors must use exact frames extracted from ingested dives.\n`;
}
function fail(message) { console.error(message); process.exit(1); }

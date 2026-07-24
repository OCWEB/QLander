#!/usr/bin/env node
import { execFile } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);
const sourceRoot = path.resolve(import.meta.dirname, "..");
const templateSource = "https://github.com/OCWEB/QLander";
const profiles = ["marketing-site", "single-page-ppc", "internal-scroll-world", "root-scroll-world"] as const;
type Profile = (typeof profiles)[number];
type Stage = { name: string; startedAt: string; completedAt?: string; status: "running" | "passed" | "failed"; detail?: string };

const argv = process.argv.slice(2);
if (argv[0] === "--") argv.shift();
const args = parseArgs(argv);
const interactive = process.stdin.isTTY && process.stdout.isTTY;
const answers = await resolveAnswers(args, interactive);
const target = answers.inPlace ? sourceRoot : path.resolve(answers.target);
validateTarget(target, answers.inPlace);

const stages: Stage[] = [];
let baselineCommit = "not-created";
let validationResults: Array<{ command: string; status: "passed" | "failed"; detail?: string }> = [];

try {
  if (!answers.inPlace) {
    await stage("copy-template", async () => copyTemplate(target));
    if (!answers.noGit) baselineCommit = await stage("baseline-commit", async () => createBaselineCommit(target));
  }
  await stage("configure-profile", async () => configureProfile(target, answers.profile, answers.name, answers.experienceSlug, { blog: answers.noBlog, products: answers.noProducts, resources: answers.noResources }));
  await stage("generate-contracts", async () => {
    await generateProfileTest(target, answers.profile, answers.experienceSlug);
    await mkdir(path.join(target, "docs/screenshots"), { recursive: true });
    await writeFile(path.join(target, "docs/screenshots/manifest.json"), `${JSON.stringify({ version: 1, screenshots: [] }, null, 2)}\n`);
  });
  await writeRunLog(target, answers, baselineCommit, stages, validationResults);

  if (!answers.skipInstall) await stage("install", async () => run(target, "pnpm", ["install", "--frozen-lockfile"]));
  if (!answers.skipValidate) {
    await stage("validate", async () => {
      validationResults = [];
      for (const [command, commandArgs] of [
        ["pnpm build", ["build"]],
        ["pnpm typecheck", ["typecheck"]],
        ["pnpm test", ["test"]],
        ["pnpm qlander:check", ["qlander:check"]]
      ] as Array<[string, string[]]>) {
        try {
          const output = await run(target, "pnpm", commandArgs);
          validationResults.push({ command, status: "passed", detail: summarize(output) });
        } catch (error) {
          validationResults.push({ command, status: "failed", detail: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      }
    });
  }
  await writeRunLog(target, answers, baselineCommit, stages, validationResults);
  if (!answers.inPlace && !answers.noGit) {
    await run(target, "git", ["add", "-A"]);
    await run(target, "git", ["-c", "user.name=QLander", "-c", "user.email=qlander@local.invalid", "commit", "-m", `Configure ${answers.profile} profile`]);
  }
  console.log(`QLander ${answers.profile} initialized at ${target}`);
  console.log(`Baseline commit: ${baselineCommit}`);
  console.log("Stage results and validation output: docs/qlander-run.md in the new project.");
  console.log("Next: run QLander Discovery, approve the brief and media plan, then populate the draft.");
} catch (error) {
  await writeRunLog(target, answers, baselineCommit, stages, validationResults).catch(() => {});
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function stage<T>(name: string, action: () => Promise<T>) {
  const item: Stage = { name, startedAt: new Date().toISOString(), status: "running" };
  stages.push(item);
  try {
    const value = await action();
    item.status = "passed";
    item.completedAt = new Date().toISOString();
    return value;
  } catch (error) {
    item.status = "failed";
    item.completedAt = new Date().toISOString();
    item.detail = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

async function resolveAnswers(values: Record<string, string | boolean>, canAsk: boolean) {
  let profile = typeof values.profile === "string" ? values.profile : "";
  let name = typeof values.name === "string" ? values.name : "QLander Site";
  let target = typeof values.target === "string" ? values.target : "";
  const inPlace = values["in-place"] === true;
  if ((!profile || (!target && !inPlace)) && canAsk) {
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    if (!profile) profile = await prompt.question(`Profile (${profiles.join(" / ")}): `);
    if (name === "QLander Site") name = (await prompt.question("Site name: ")) || name;
    if (!target && !inPlace) target = await prompt.question("New project directory: ");
    prompt.close();
  }
  if (!profiles.includes(profile as Profile)) fail(`--profile must be one of: ${profiles.join(", ")}`);
  if (!target && !inPlace) fail("Provide --target <new-directory> or explicitly use --in-place");
  return {
    profile: profile as Profile,
    name,
    target,
    inPlace,
    experienceSlug: typeof values.slug === "string" ? values.slug : "tour",
    noGit: values["no-git"] === true,
    skipInstall: values["skip-install"] === true,
    skipValidate: values["skip-validate"] === true,
    noBlog: values["no-blog"] === true || values["minimal"] === true,
    noProducts: values["no-products"] === true || values["minimal"] === true,
    noResources: values["no-resources"] === true || values["minimal"] === true
  };
}

function validateTarget(target: string, inPlace: boolean) {
  if (inPlace) return;
  const broad = new Set([path.parse(target).root, os.homedir(), sourceRoot]);
  if (broad.has(target)) fail(`Refusing unsafe target ${target}`);
  if (target.startsWith(`${sourceRoot}${path.sep}`)) fail("Target cannot be inside the QLander source repository");
  if (existsSync(target)) {
    const entries = readdirSync(target);
    if (entries.length) fail(`Target must be empty or absent: ${target}`);
  }
}

async function copyTemplate(target: string) {
  await mkdir(target, { recursive: true });
  const excluded = new Set([".git", "node_modules", "dist", ".astro", ".pnpm-store", "build"]);
  await cp(sourceRoot, target, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(sourceRoot, source);
      if (!relative) return true;
      const first = relative.split(path.sep)[0];
      if (relative === path.join("skills", "qlander-audit") || relative.startsWith(path.join("skills", "qlander-audit") + path.sep)) return false;
      return !excluded.has(first) && relative !== "content/site-brief.md" && !relative.endsWith(".log") && relative !== "tsconfig.tsbuildinfo";
    }
  });
}

async function writeWordmarkLogo(target: string, name: string) {
  const label = name.replace(/[<>&"']/g, "").trim() || "Site";
  const width = Math.max(120, Math.min(360, 24 + label.length * 10));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 40" role="img" aria-labelledby="title">\n  <title id="title">${label}</title>\n  <rect width="${width}" height="40" rx="8" fill="#111111"/>\n  <text x="${Math.round(width / 2)}" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#f6f7f8">${label}</text>\n</svg>\n`;
  await writeFile(path.join(target, "public/images/logo.svg"), svg);
}

async function createBaselineCommit(target: string) {
  await run(target, "git", ["init", "-b", "main"]);
  await run(target, "git", ["add", "."]);
  await run(target, "git", ["-c", "user.name=QLander", "-c", "user.email=qlander@local.invalid", "commit", "-m", "Start project from QLander baseline"]);
  return (await run(target, "git", ["rev-parse", "--short", "HEAD"])).trim();
}

async function configureProfile(target: string, profile: Profile, name: string, experienceSlug: string, exclude: { blog: boolean; products: boolean; resources: boolean } = { blog: false, products: false, resources: false }) {
  const manifest = await readJson(path.join(target, "qlander.manifest.json"));
  const site = await readJson(path.join(target, "data/site.json"));
  manifest.projectType = profile;
  manifest.name = name;
  manifest.siteId = slugify(name) || "qlander-site";
  site.name = name;
  site.description = `${name} draft site pending approved content.`;
  site.launchStatus = "draft";
  await writeJson(path.join(target, "qlander.manifest.json"), manifest);
  await writeJson(path.join(target, "data/site.json"), site);
  await writeWordmarkLogo(target, name);

  if (profile === "marketing-site" && (exclude.blog || exclude.products || exclude.resources)) await pruneMarketingRoutes(target, exclude);
  if (profile === "single-page-ppc") await configurePpc(target, manifest, name);
  if (profile === "internal-scroll-world") await run(target, process.execPath, [
    "skills/scroll-world/references/scripts/register-qlander-experience.mjs",
    "--project-root", target, "--slug", experienceSlug, "--title", `${name} Tour`,
    "--description", `Explore ${name} through an interactive visual journey.`
  ]);
  if (profile === "root-scroll-world") await run(target, process.execPath, [
    "skills/scroll-world/references/scripts/register-qlander-experience.mjs",
    "--project-root", target, "--root", "--prune", "--title", `${name} Experience`,
    "--description", `Explore ${name} through an interactive visual journey.`
  ]);
}

async function pruneMarketingRoutes(target: string, exclude: { blog: boolean; products: boolean; resources: boolean }) {
  const collections: Array<{ key: "blog" | "products" | "resources"; routePrefix: string; pages: string[]; content: string; editKey: string; editPrefix: string }> = [];
  if (exclude.blog) collections.push({ key: "blog", routePrefix: "/blog", pages: ["src/pages/blog/index.astro", "src/pages/blog/[slug].astro"], content: "content/blog", editKey: "route.blog.seo", editPrefix: "blog." });
  if (exclude.products) collections.push({ key: "products", routePrefix: "/products", pages: ["src/pages/products/index.astro", "src/pages/products/[slug].astro"], content: "content/products", editKey: "route.products.seo", editPrefix: "product." });
  if (exclude.resources) collections.push({ key: "resources", routePrefix: "/resources", pages: ["src/pages/resources/index.astro", "src/pages/resources/[slug].astro"], content: "content/resources", editKey: "route.resources.seo", editPrefix: "resource." });

  const manifest = await readJson(path.join(target, "qlander.manifest.json"));
  const navigation = await readJson(path.join(target, "data/navigation.json"));
  const routeSeo = await readJson(path.join(target, "data/route-seo.json"));
  const editMap = await readJson(path.join(target, "qlander.edit-map.json"));
  const emptyBlogSentinel = exclude.blog ? await readFile(path.join(target, "content/blog/_empty.md"), "utf8") : undefined;

  for (const collection of collections) {
    for (const file of collection.pages) await rm(path.join(target, file), { force: true });
    await rm(path.join(target, collection.content), { recursive: true, force: true });
    await mkdir(path.join(target, collection.content), { recursive: true });
    if (collection.key === "blog") await writeFile(path.join(target, collection.content, "_empty.md"), emptyBlogSentinel!);
    else await writeFile(path.join(target, collection.content, ".gitkeep"), "");
    manifest.routes = manifest.routes.filter((route: string) => route !== collection.routePrefix && !route.startsWith(`${collection.routePrefix}/`));
    navigation.header = navigation.header.filter((item: any) => item.href !== collection.routePrefix && !item.href.startsWith(`${collection.routePrefix}/`));
    navigation.footer = navigation.footer.filter((item: any) => item.href !== collection.routePrefix && !item.href.startsWith(`${collection.routePrefix}/`));
    delete routeSeo[collection.key];
    delete editMap[collection.editKey];
    for (const key of Object.keys(editMap)) if (key.startsWith(collection.editPrefix)) delete editMap[key];
  }

  await writeJson(path.join(target, "qlander.manifest.json"), manifest);
  await writeJson(path.join(target, "data/navigation.json"), navigation);
  await writeJson(path.join(target, "data/route-seo.json"), routeSeo);
  await writeJson(path.join(target, "qlander.edit-map.json"), editMap);

  const prunedPrefixes = collections.map((collection) => collection.routePrefix);
  const links = (href: unknown) => typeof href === "string" && prunedPrefixes.some((prefix) => href === prefix || href.startsWith(`${prefix}/`));
  const pagesDir = path.join(target, "content/pages");
  for (const entry of readdirSync(pagesDir).filter((file) => file.endsWith(".json"))) {
    const file = path.join(pagesDir, entry);
    const page = await readJson(file);
    page.sections = (page.sections ?? []).filter((section: any) => !(section.type === "cta" && links(section.cta?.href)));
    for (const section of page.sections) {
      if (section.primaryCta && links(section.primaryCta.href)) delete section.primaryCta;
      if (section.secondaryCta && links(section.secondaryCta.href)) delete section.secondaryCta;
    }
    await writeJson(file, page);
  }
}

async function configurePpc(target: string, manifest: any, name: string) {
  const home = {
    title: "Campaign landing",
    slug: "/",
    layout: "ppc",
    seo: { title: `${name} Campaign`, description: `A focused campaign landing page for ${name}.`, noindex: true },
    sections: [
      { id: "home.hero", type: "hero", headline: "A focused campaign outcome", subheadline: "Replace this approved placeholder with message-matched campaign copy.", primaryCta: { label: "Request a demo", href: "https://example.com/contact" }, imagePromptId: "campaign.hero-visual" },
      { id: "home.outcomes", type: "featureGrid", headline: "Campaign outcomes", items: [{ title: "Outcome one", description: "Replace with an evidence-backed benefit." }, { title: "Outcome two", description: "Replace with an evidence-backed benefit." }, { title: "Outcome three", description: "Replace with an evidence-backed benefit." }] },
      { id: "home.proof", type: "richText", headline: "Approved proof belongs here", body: "Keep this section explicit until the site brief identifies source-backed proof." },
      { id: "home.cta", type: "cta", headline: "Take the next step", body: "Use the same primary conversion action throughout this campaign.", cta: { label: "Request a demo", href: "https://example.com/contact" } }
    ]
  };
  await pruneStandardRoutes(target);
  await mkdir(path.join(target, "content/pages"), { recursive: true });
  await writeJson(path.join(target, "content/pages/home.json"), home);
  await mkdir(path.join(target, "content/prompts"), { recursive: true });
  await writeFile(path.join(target, "content/prompts/campaign-image-prompts.md"), "# Campaign image prompts\n\n## campaign.hero-visual\n\nCreate an original message-matched campaign hero image after the combined QLander approval. Record aspect ratio, placement, and generation notes here.\n");
  manifest.routes = ["/", "/404"];
  manifest.projectType = "single-page-ppc";
  await writeJson(path.join(target, "qlander.manifest.json"), manifest);
  const routeSeoPath = path.join(target, "data/route-seo.json");
  const routeSeo = await readJson(routeSeoPath);
  delete routeSeo.products;
  delete routeSeo.blog;
  await writeJson(routeSeoPath, routeSeo);
  await writeJson(path.join(target, "data/navigation.json"), { header: [{ label: "Campaign", href: "/" }], footer: [{ label: "Campaign", href: "/" }] });
  await writeJson(path.join(target, "qlander.edit-map.json"), createSinglePageEditMap(home.sections));
}

async function pruneStandardRoutes(target: string) {
  for (const file of [
    "src/pages/about.astro", "src/pages/contact.astro", "src/pages/privacy.astro",
    "src/pages/blog/index.astro", "src/pages/blog/[slug].astro",
    "src/pages/products/index.astro", "src/pages/products/[slug].astro",
    "src/pages/resources/index.astro", "src/pages/resources/[slug].astro"
  ]) await rm(path.join(target, file), { force: true });
  for (const directory of ["content/pages", "content/products", "content/resources", "content/blog"]) {
    await rm(path.join(target, directory), { recursive: true, force: true });
    await mkdir(path.join(target, directory), { recursive: true });
  }
  await cp(path.join(sourceRoot, "content/blog/_empty.md"), path.join(target, "content/blog/_empty.md"));
}

function createSinglePageEditMap(sections: any[]) {
  const map: Record<string, any> = {};
  for (const [index, section] of sections.entries()) {
    map[section.id] = {
      route: "/", label: section.headline, scope: "single-page-content", contentFile: "content/pages/home.json", jsonPath: `sections[${index}]`, component: componentFor(section.type), safeFields: safeFieldsFor(section.type), affectedRoutes: ["/"]
    };
  }
  map["global.header"] = { route: "*", label: "404 support header", scope: "global-navigation", contentFile: "data/navigation.json", jsonPath: "header", component: "Header", safeFields: ["[].label", "[].href"], affectedRoutes: ["/404"] };
  map["global.footer"] = { route: "*", label: "404 support footer", scope: "global-navigation", contentFile: "data/navigation.json", jsonPath: "footer", component: "Footer", safeFields: ["[].label", "[].href"], affectedRoutes: ["/404"] };
  map["site.info"] = { route: "*", label: "Site information", scope: "global-content", contentFile: "data/site.json", jsonPath: "$", component: "SiteData", safeFields: ["name", "description", "url", "launchStatus", "locale", "logo", "socialImage", "email", "phone", "contactUrl", "address.street", "address.city", "address.region", "address.postalCode", "address.country", "social.linkedin", "social.x", "social.facebook", "social.instagram", "social.youtube"], affectedRoutes: "all" };
  map["route.notFound.seo"] = { route: "/404", label: "404 SEO", scope: "route-metadata", contentFile: "data/route-seo.json", jsonPath: "notFound", component: "SEO", safeFields: ["title", "description", "noindex", "socialImage"], affectedRoutes: ["/404"] };
  return map;
}

function componentFor(type: string) {
  return ({ hero: "HeroSection", featureGrid: "FeatureGrid", richText: "RichTextSection", cta: "CTASection", contact: "ContactForm", productGrid: "ProductGrid", scrollSection: "ScrollSection" } as Record<string, string>)[type] ?? "PageSection";
}

function safeFieldsFor(type: string) {
  if (type === "hero") return ["headline", "subheadline", "primaryCta.label", "primaryCta.href", "secondaryCta.label", "secondaryCta.href", "image.src", "image.alt", "image.width", "image.height", "imagePromptId"];
  if (type === "featureGrid") return ["headline", "items[].title", "items[].description", "items[].image.src", "items[].image.alt", "items[].image.width", "items[].image.height", "items[].imagePromptId"];
  if (type === "richText") return ["headline", "body", "visual", "image.src", "image.alt", "image.width", "image.height", "imagePromptId"];
  if (type === "cta") return ["headline", "body", "cta.label", "cta.href"];
  if (type === "scrollSection") return ["experience", "headingLevel"];
  return ["headline", "body"];
}

async function generateProfileTest(target: string, profile: Profile, experienceSlug: string) {
  await rm(path.join(target, "tests/qlander.test.ts"), { force: true });
  const schemaImports = ["ManifestSchema"];
  if (profile === "single-page-ppc") schemaImports.push("PageContentSchema");
  if (profile.includes("scroll-world")) schemaImports.push("ScrollWorldExperienceSchema");
  const source = `import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { ${schemaImports.join(", ")} } from "../src/lib/schemas";

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const manifest = ManifestSchema.parse(JSON.parse(await readFile(path.join(root, "qlander.manifest.json"), "utf8")));

test("generated project retains its selected QLander profile", () => {
  assert.equal(manifest.projectType, ${JSON.stringify(profile)});
});

test("generated profile builds its declared routes", async () => {
  await run(path.join(root, "node_modules/.bin/astro"), ["build"], { cwd: root });
  for (const route of manifest.routes) {
    const file = route === "/" ? "dist/index.html" : route === "/404" ? "dist/404.html" : \`dist\${route}/index.html\`;
    const html = await readFile(path.join(root, file), "utf8");
    if (route !== "/404") assert.equal((html.match(/<h1(?:\\s|>)/g) ?? []).length, 1);
  }
});

${profile === "single-page-ppc" ? `test("PPC profile has one primary destination and no site chrome", async () => {
  const home = PageContentSchema.parse(JSON.parse(await readFile(path.join(root, "content/pages/home.json"), "utf8")));
  const hrefs = home.sections.flatMap((section) => section.type === "hero" ? [section.primaryCta.href] : section.type === "cta" ? [section.cta.href] : []);
  assert.equal(home.layout, "ppc");
  assert.equal(new Set(hrefs).size, 1);
  const html = await readFile(path.join(root, "dist/index.html"), "utf8");
  assert.doesNotMatch(html, /class="site-header"|class="site-footer"/);
  assert.match(html, /class="landing-header"/);
});` : ""}
${profile.includes("scroll-world") ? `test("Scroll World profile has a valid registered experience", async () => {
  const filename = ${JSON.stringify(profile === "root-scroll-world" ? "root" : experienceSlug)};
  const experience = ScrollWorldExperienceSchema.parse(JSON.parse(await readFile(path.join(root, \`data/experiences/\${filename}.json\`), "utf8")));
  assert.equal(experience.route, ${profile === "root-scroll-world" ? '"/"' : "undefined"});
  const queue = JSON.parse(await readFile(path.join(root, \`scroll-world/\${filename}/queue.json\`), "utf8"));
  assert.equal(queue.mode, "manual");
});` : ""}
`;
  await mkdir(path.join(target, "tests"), { recursive: true });
  await writeFile(path.join(target, "tests/profile.test.ts"), source);
}

async function writeRunLog(target: string, answers: Awaited<ReturnType<typeof resolveAnswers>>, baseline: string, stageItems: Stage[], validations: typeof validationResults) {
  if (!existsSync(target)) return;
  await mkdir(path.join(target, "docs"), { recursive: true });
  const rows = stageItems.map((item) => `| ${item.name} | ${item.status} | ${item.startedAt} | ${item.completedAt ?? "-"} | ${escapeCell(item.detail ?? "")} |`).join("\n") || "| initialization | pending | - | - | - |";
  const validationRows = validations.map((item) => `| \`${item.command}\` | ${item.status} | ${escapeCell(item.detail ?? "")} |`).join("\n") || "| Validation | pending | Run after dependencies are installed |";
  const log = `# QLander run\n\n- Profile: \`${answers.profile}\`\n- Site name: ${answers.name}\n- Source template: ${templateSource}\n- Baseline commit: \`${baseline}\`\n- Draft/noindex: yes\n- Created: ${stageItems[0]?.startedAt ?? new Date().toISOString()}\n\n## Stage timeline\n\n| Stage | Status | Started | Completed | Detail |\n|---|---|---|---|---|\n${rows}\n\n## Validation\n\n| Command | Status | Detail |\n|---|---|---|\n${validationRows}\n\n## Screenshots\n\nSave browser-verified PNG captures under \`docs/screenshots/\` and describe each one in the versioned \`docs/screenshots/manifest.json\`. Each entry records route, viewport width and height, site ID, page title, preview port, URL, filename, SHA-256, and capture time. Audit verification requires committed, clean manifest and PNG files with at least one desktop-width and one phone-width capture. Screenshot capture remains an agent/browser QA step so the repository does not install a browser runtime or download Chromium by default.\n\n## Discovery and media\n\nRun QLander Discovery before population. Record approved sources, reused facts, repeated questions, safe-zone edits, developer-mode edits, and media handoffs here as work continues. Scroll World profiles keep human \`queue.md\` and machine-readable \`queue.json\` status together.\n`;
  await writeFile(path.join(target, "docs/qlander-run.md"), log);
}

async function run(cwd: string, command: string, commandArgs: string[]) {
  try {
    const { stdout, stderr } = await exec(command, commandArgs, { cwd, maxBuffer: 10_000_000 });
    return `${stdout}${stderr}`.trim();
  } catch (error: any) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed\n${error.stdout ?? ""}${error.stderr ?? ""}`.trim());
  }
}

function summarize(output: string) { return output.split("\n").filter(Boolean).slice(-3).join(" · ").slice(0, 500); }
function escapeCell(value: string) { return value.replaceAll("|", "\\|").replaceAll("\n", " ").slice(0, 500); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
async function readJson(file: string) { return JSON.parse(await readFile(file, "utf8")); }
async function writeJson(file: string, value: unknown) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, `${JSON.stringify(value, null, 2)}\n`); }

function parseArgs(values: string[]) {
  const result: Record<string, string | boolean> = {};
  const booleans = new Set(["in-place", "no-git", "skip-install", "skip-validate", "no-blog", "no-products", "no-resources", "minimal"]);
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--") continue;
    if (!value.startsWith("--")) fail(`Unexpected argument ${value}`);
    const [key, inline] = value.slice(2).split("=", 2);
    if (inline !== undefined) { result[key] = inline || true; continue; }
    if (booleans.has(key)) { result[key] = true; continue; }
    const next = values[++index];
    if (!next || next.startsWith("--")) fail(`Missing value for --${key}`);
    result[key] = next;
  }
  return result;
}

function fail(message: string): never { throw new Error(message); }

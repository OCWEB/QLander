#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import fg from "fast-glob";
import { XMLParser } from "fast-xml-parser";
import matter from "gray-matter";
import { parse } from "node-html-parser";
import { z } from "zod";

const CheckStatusSchema = z.enum(["passed", "warning", "failed", "skipped"]);
type CheckStatus = z.infer<typeof CheckStatusSchema>;

type CheckMessage = {
  code: string;
  message: string;
  path?: string;
  route?: string;
};

type CheckRun = {
  id: string;
  siteId: string;
  status: "passed" | "warning" | "failed";
  checks: {
    schema: CheckStatus;
    build: CheckStatus;
    seo: CheckStatus;
    links: CheckStatus;
    accessibility: CheckStatus;
    sitemap: CheckStatus;
    robots: CheckStatus;
    visual: CheckStatus;
  };
  warnings: CheckMessage[];
  errors: CheckMessage[];
};

const SeoSchema = z.object({
  title: z.string().min(1, "SEO title is required"),
  description: z.string().min(1, "SEO description is required"),
  noindex: z.boolean().default(false),
  canonical: z.string().url("Canonical URL must be absolute")
});

const CtaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1)
});

const PageSectionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("hero"),
    headline: z.string().min(1),
    subheadline: z.string().min(1),
    primaryCta: CtaSchema,
    secondaryCta: CtaSchema.optional()
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("featureGrid"),
    headline: z.string().min(1),
    items: z.array(z.object({
      title: z.string().min(1),
      description: z.string().min(1)
    })).min(1)
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("cta"),
    headline: z.string().min(1),
    body: z.string().min(1),
    cta: CtaSchema
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("productGrid"),
    headline: z.string().min(1),
    productSlugs: z.array(z.string().min(1)).min(1)
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("contact"),
    headline: z.string().min(1),
    body: z.string().min(1)
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("richText"),
    headline: z.string().min(1),
    body: z.string().min(1),
    visual: z.boolean().optional()
  })
]);

const PageContentSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  seo: SeoSchema,
  sections: z.array(PageSectionSchema).min(1)
});

const ProductSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  priceLabel: z.string().min(1),
  featured: z.boolean().default(false),
  seo: SeoSchema
});

const BlogFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  slug: z.string().min(1),
  publishedAt: z.string().min(1),
  updatedAt: z.string().min(1),
  author: z.string().min(1),
  tags: z.array(z.string()).default([]),
  seo: SeoSchema
});

const NavigationSchema = z.object({
  header: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) })).min(1),
  footer: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) })).min(1)
});

const SiteDataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  url: z.string().url(),
  logo: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.object({
    street: z.string(),
    city: z.string(),
    region: z.string(),
    postalCode: z.string(),
    country: z.string()
  }),
  social: z.object({
    linkedin: z.string(),
    x: z.string()
  })
});

const ThemeSchema = z.object({
  colors: z.object({
    ink: z.string(),
    paper: z.string(),
    muted: z.string(),
    accent: z.string(),
    accentDark: z.string(),
    highlight: z.string()
  }),
  radius: z.number().max(8),
  density: z.enum(["compact", "comfortable"]).default("comfortable")
});

const ManifestSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  template: z.string().min(1),
  templateVersion: z.string().min(1),
  contentRoot: z.string().default("content"),
  dataRoot: z.string().default("data"),
  editMap: z.string().default("pagepilot.edit-map.json"),
  routes: z.array(z.string()).min(1)
});

const EditMapSchema = z.record(z.object({
  route: z.union([z.string(), z.literal("*")]),
  label: z.string().min(1),
  scope: z.string().min(1),
  contentFile: z.string().min(1),
  jsonPath: z.string().min(1),
  component: z.string().min(1),
  safeFields: z.array(z.string()).min(1),
  affectedRoutes: z.union([z.array(z.string()), z.literal("all")])
}));

type LoadedSite = {
  manifest: z.infer<typeof ManifestSchema>;
  site: z.infer<typeof SiteDataSchema>;
  pageFiles: Array<{ file: string; content: z.infer<typeof PageContentSchema> }>;
  productFiles: Array<{ file: string; content: z.infer<typeof ProductSchema> }>;
  blogFiles: Array<{ file: string; frontmatter: z.infer<typeof BlogFrontmatterSchema> }>;
  knownRoutes: Set<string>;
};

const args = process.argv.slice(2);
const siteRoot = path.resolve(args.find((arg) => !arg.startsWith("--")) ?? ".");
const json = args.includes("--json");
const skipBuild = args.includes("--skip-build");
const checkNames = ["schema", "build", "seo", "links", "accessibility", "sitemap", "robots", "visual"] as const;

const result = await runPagePilotChecks(siteRoot, { runBuild: !skipBuild });

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`PagePilot checks: ${result.status.toUpperCase()}`);
  for (const [name, status] of Object.entries(result.checks)) {
    console.log(`- ${name}: ${status}`);
  }
  for (const warning of result.warnings) {
    console.log(`WARN ${warning.code}: ${warning.message}`);
  }
  for (const error of result.errors) {
    console.error(`ERROR ${error.code}: ${error.message}`);
  }
}

if (result.status === "failed") {
  process.exitCode = 1;
}

async function runPagePilotChecks(root: string, options: { runBuild: boolean }): Promise<CheckRun> {
  const checks = Object.fromEntries(checkNames.map((name) => [name, "passed" as CheckStatus])) as CheckRun["checks"];
  const warnings: CheckMessage[] = [];
  const errors: CheckMessage[] = [];
  let loadedSite: LoadedSite | undefined;

  try {
    loadedSite = await loadAndValidateSite(root, errors);
  } catch (error) {
    errors.push({
      code: "schema.load_failed",
      message: error instanceof Error ? error.message : "Unable to load site files"
    });
  }

  if (errors.some((error) => error.code.startsWith("schema."))) {
    checks.schema = "failed";
  }

  if (loadedSite) {
    runContentChecks(root, loadedSite, errors, warnings);
    if (errors.some((error) => error.code.startsWith("links."))) checks.links = "failed";
    if (errors.some((error) => error.code.startsWith("sitemap."))) checks.sitemap = "failed";
    if (errors.some((error) => error.code.startsWith("robots."))) checks.robots = "failed";
  }

  if (options.runBuild) {
    const buildResult = await runAstroBuild(root);
    if (!buildResult.ok) {
      checks.build = "failed";
      errors.push({
        code: "build.failed",
        message: buildResult.output || "Astro build failed"
      });
    }
  } else {
    checks.build = "skipped";
  }

  if (checks.build !== "failed") {
    await runHtmlChecks(root, loadedSite, checks, errors, warnings);
  } else {
    checks.seo = "skipped";
    checks.accessibility = "skipped";
    checks.visual = "skipped";
  }

  for (const name of checkNames) {
    if (checks[name] === "passed" && warnings.some((warning) => warning.code.startsWith(`${name}.`))) {
      checks[name] = "warning";
    }
  }

  return {
    id: `check_${randomUUID().slice(0, 8)}`,
    siteId: loadedSite?.manifest.siteId ?? "unknown",
    status: errors.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "passed",
    checks,
    warnings,
    errors
  };
}

async function loadAndValidateSite(root: string, errors: CheckMessage[]): Promise<LoadedSite> {
  const manifest = parseJson(ManifestSchema, await readJson(path.join(root, "pagepilot.manifest.json")), "pagepilot.manifest.json", errors);
  parseJson(EditMapSchema, await readJson(path.join(root, manifest.editMap)), manifest.editMap, errors);
  const site = parseJson(SiteDataSchema, await readJson(path.join(root, "data/site.json")), "data/site.json", errors);
  parseJson(NavigationSchema, await readJson(path.join(root, "data/navigation.json")), "data/navigation.json", errors);
  parseJson(ThemeSchema, await readJson(path.join(root, "data/theme.json")), "data/theme.json", errors);

  const pageFiles = await loadJsonCollection(root, "content/pages/*.json", PageContentSchema, errors);
  const productFiles = await loadJsonCollection(root, "content/products/*.json", ProductSchema, errors);
  const blogFiles = await loadBlogCollection(root, "content/blog/*.md", errors);
  const knownRoutes = new Set(manifest.routes);

  for (const page of pageFiles) knownRoutes.add(page.content.slug);
  for (const product of productFiles) knownRoutes.add(`/products/${product.content.slug}`);
  for (const blog of blogFiles) knownRoutes.add(`/blog/${blog.frontmatter.slug}`);

  return { manifest, site, pageFiles, productFiles, blogFiles, knownRoutes };
}

function runContentChecks(root: string, site: LoadedSite, errors: CheckMessage[], warnings: CheckMessage[]) {
  const slugCounts = new Map<string, string[]>();

  for (const page of site.pageFiles) {
    addSlug(slugCounts, page.content.slug, page.file);
    for (const section of page.content.sections) {
      collectAndCheckLinks(section, site.knownRoutes, errors, page.file, page.content.slug);
    }
  }

  for (const product of site.productFiles) addSlug(slugCounts, `/products/${product.content.slug}`, product.file);
  for (const blog of site.blogFiles) addSlug(slugCounts, `/blog/${blog.frontmatter.slug}`, blog.file);

  for (const [slug, files] of slugCounts.entries()) {
    if (files.length > 1) {
      errors.push({
        code: "schema.duplicate_slug",
        message: `Duplicate slug ${slug} appears in ${files.join(", ")}`,
        route: slug
      });
    }
  }

  const navigation = JSON.parse(readFileSync(path.join(root, "data/navigation.json"), "utf8")) as {
    header: Array<{ href: string }>;
    footer: Array<{ href: string }>;
  };
  for (const item of [...navigation.header, ...navigation.footer]) {
    checkInternalLink(item.href, site.knownRoutes, errors, "data/navigation.json");
  }

  checkSitemap(root, site, errors, warnings);
  checkRobots(root, errors);
}

async function runHtmlChecks(
  root: string,
  site: LoadedSite | undefined,
  checks: CheckRun["checks"],
  errors: CheckMessage[],
  warnings: CheckMessage[]
) {
  const distRoot = path.join(root, "dist");
  if (!existsSync(distRoot)) {
    checks.visual = "failed";
    errors.push({ code: "visual.dist_missing", message: "Build output dist/ was not found" });
    return;
  }

  const htmlFiles = await fg("**/*.html", { cwd: distRoot, absolute: true });
  if (htmlFiles.length === 0) {
    checks.visual = "failed";
    errors.push({ code: "visual.html_missing", message: "No HTML files were generated" });
    return;
  }

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const document = parse(html);
    const route = htmlFileToRoute(file, distRoot);
    const h1Count = document.querySelectorAll("h1").length;

    if (route !== "/404" && h1Count !== 1) {
      checks.seo = "failed";
      errors.push({
        code: "seo.h1_count",
        message: `Expected exactly one H1, found ${h1Count}`,
        path: path.relative(root, file),
        route
      });
    }

    for (const selector of ["title", "meta[name=\"description\"]", "link[rel=\"canonical\"]", "meta[property=\"og:title\"]", "meta[property=\"og:description\"]"]) {
      if (!document.querySelector(selector)) {
        checks.seo = "failed";
        errors.push({
          code: "seo.required_tag_missing",
          message: `Missing ${selector}`,
          path: path.relative(root, file),
          route
        });
      }
    }

    for (const link of document.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href") ?? "";
      if (!link.text.trim() && !link.getAttribute("aria-label")) {
        checks.accessibility = "failed";
        errors.push({
          code: "accessibility.link_label_missing",
          message: "Link needs text or an aria-label",
          path: path.relative(root, file),
          route
        });
      }
      if (site) checkInternalLink(href, site.knownRoutes, errors, path.relative(root, file), route);
    }

    for (const image of document.querySelectorAll("img")) {
      const src = image.getAttribute("src") ?? "";
      if (!image.hasAttribute("alt")) {
        checks.accessibility = "failed";
        errors.push({
          code: "accessibility.image_alt_missing",
          message: `Image ${src || "(unknown)"} needs alt text`,
          path: path.relative(root, file),
          route
        });
      }
      if (src.startsWith("/") && !existsSync(path.join(root, "public", src))) {
        errors.push({
          code: "links.image_missing",
          message: `Missing image ${src}`,
          path: path.relative(root, file),
          route
        });
      }
    }

    for (const button of document.querySelectorAll("button")) {
      if (!button.text.trim() && !button.getAttribute("aria-label")) {
        checks.accessibility = "failed";
        errors.push({
          code: "accessibility.button_label_missing",
          message: "Button needs text or an aria-label",
          path: path.relative(root, file),
          route
        });
      }
    }

    for (const form of document.querySelectorAll("form")) {
      for (const control of form.querySelectorAll("input, textarea, select")) {
        const id = control.getAttribute("id");
        if (!id || !form.querySelector(`label[for="${id}"]`)) {
          checks.accessibility = "failed";
          errors.push({
            code: "accessibility.form_label_missing",
            message: "Form fields need associated labels",
            path: path.relative(root, file),
            route
          });
        }
      }
    }

    const bodyText = document.querySelector("body")?.text.trim() ?? "";
    if (bodyText.length < 120 && route !== "/404") {
      warnings.push({
        code: "visual.body_sparse",
        message: "Rendered page has very little visible text",
        path: path.relative(root, file),
        route
      });
    }
  }

  if (errors.some((error) => error.code.startsWith("links."))) checks.links = "failed";
}

async function runAstroBuild(root: string): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn("pnpm", ["exec", "astro", "build"], {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ ok: code === 0, output: output.trim() });
    });
  });
}

function parseJson<TSchema extends z.ZodTypeAny>(schema: TSchema, value: unknown, file: string, errors: CheckMessage[]): z.infer<TSchema> {
  const result = schema.safeParse(value);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        code: "schema.invalid",
        message: `${file}: ${issue.path.join(".") || "(root)"} ${issue.message}`,
        path: file
      });
    }
    throw new Error(`Invalid ${file}`);
  }
  return result.data;
}

async function loadJsonCollection<TSchema extends z.ZodTypeAny>(
  root: string,
  pattern: string,
  schema: TSchema,
  errors: CheckMessage[]
): Promise<Array<{ file: string; content: z.infer<TSchema> }>> {
  const files = await fg(pattern, { cwd: root, absolute: true });
  const collection = [];

  for (const file of files) {
    const relativeFile = path.relative(root, file);
    try {
      collection.push({
        file: relativeFile,
        content: parseJson(schema, await readJson(file), relativeFile, errors)
      });
    } catch {
      // parseJson recorded the details.
    }
  }

  return collection;
}

async function loadBlogCollection(root: string, pattern: string, errors: CheckMessage[]) {
  const files = await fg(pattern, { cwd: root, absolute: true });
  const collection = [];

  for (const file of files) {
    const relativeFile = path.relative(root, file);
    try {
      const parsed = matter(await readFile(file, "utf8"));
      collection.push({
        file: relativeFile,
        frontmatter: parseJson(BlogFrontmatterSchema, parsed.data, relativeFile, errors)
      });
    } catch (error) {
      errors.push({
        code: "schema.blog_frontmatter_invalid",
        message: error instanceof Error ? error.message : `Invalid frontmatter in ${relativeFile}`,
        path: relativeFile
      });
    }
  }

  return collection;
}

function collectAndCheckLinks(value: unknown, routes: Set<string>, errors: CheckMessage[], file: string, route: string) {
  if (Array.isArray(value)) {
    for (const item of value) collectAndCheckLinks(item, routes, errors, file, route);
    return;
  }

  if (typeof value !== "object" || value === null) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === "href" && typeof nestedValue === "string") {
      checkInternalLink(nestedValue, routes, errors, file, route);
    } else {
      collectAndCheckLinks(nestedValue, routes, errors, file, route);
    }
  }
}

function checkInternalLink(href: string, routes: Set<string>, errors: CheckMessage[], file: string, route?: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return;

  const normalized = normalizeRoute(href.split("#")[0]?.split("?")[0] || "/");
  if (!routes.has(normalized) && !isPublicAsset(href)) {
    errors.push({
      code: "links.internal_broken",
      message: `Broken internal link ${href}`,
      path: file,
      route
    });
  }
}

function checkSitemap(root: string, site: LoadedSite, errors: CheckMessage[], warnings: CheckMessage[]) {
  const sitemapPath = path.join(root, "public/sitemap.xml");
  if (!existsSync(sitemapPath)) {
    errors.push({ code: "sitemap.missing", message: "public/sitemap.xml is required" });
    return;
  }

  const parser = new XMLParser();
  const parsed = parser.parse(readFileSync(sitemapPath, "utf8")) as {
    urlset?: { url?: Array<{ loc?: string }> | { loc?: string } };
  };
  const rawUrls = parsed.urlset?.url ? (Array.isArray(parsed.urlset.url) ? parsed.urlset.url : [parsed.urlset.url]) : [];
  const locs = new Set(rawUrls.map((url) => url.loc).filter(Boolean));

  for (const page of site.pageFiles) {
    if (page.content.seo.noindex) continue;

    const loc = `${site.site.url.replace(/\/$/, "")}${page.content.slug === "/" ? "/" : page.content.slug}`;
    if (!locs.has(loc)) {
      errors.push({
        code: "sitemap.public_route_missing",
        message: `Sitemap is missing ${loc}`,
        path: "public/sitemap.xml",
        route: page.content.slug
      });
    }
  }

  if (rawUrls.length === 0) {
    warnings.push({
      code: "sitemap.empty",
      message: "Sitemap has no URLs",
      path: "public/sitemap.xml"
    });
  }
}

function checkRobots(root: string, errors: CheckMessage[]) {
  const robotsPath = path.join(root, "public/robots.txt");
  if (!existsSync(robotsPath)) {
    errors.push({ code: "robots.missing", message: "public/robots.txt is required" });
    return;
  }

  if (!/Sitemap:/i.test(readFileSync(robotsPath, "utf8"))) {
    errors.push({
      code: "robots.sitemap_missing",
      message: "robots.txt must include a Sitemap directive",
      path: "public/robots.txt"
    });
  }
}

async function readJson(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

function addSlug(slugCounts: Map<string, string[]>, slug: string, file: string) {
  const normalized = normalizeRoute(slug);
  slugCounts.set(normalized, [...(slugCounts.get(normalized) ?? []), file]);
}

function normalizeRoute(route: string) {
  if (route === "/") return "/";
  return `/${route.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

function isPublicAsset(href: string) {
  return /\.(avif|gif|ico|jpg|jpeg|png|svg|webp|xml|txt)$/i.test(href);
}

function htmlFileToRoute(file: string, distRoot: string) {
  const relative = path.relative(distRoot, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.replace(/\/index\.html$/, "")}`;
  return `/${relative.replace(/\.html$/, "")}`;
}

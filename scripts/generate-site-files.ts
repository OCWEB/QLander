#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { BlogFrontmatterSchema, ManifestSchema, PageContentSchema, ProductSchema, RouteSeoSchema, ScrollWorldExperienceSchema, SiteDataSchema } from "../src/lib/schemas";

const root = process.cwd();
const output = path.resolve(root, process.argv[2] ?? "dist");
const readJson = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const site = SiteDataSchema.parse(await readJson("data/site.json"));
const manifest = ManifestSchema.parse(await readJson("qlander.manifest.json"));
const routeSeo = RouteSeoSchema.parse(await readJson("data/route-seo.json"));
const noindex = new Set<string>(["/404"]);

for (const file of await fg("content/pages/*.json", { cwd: root })) {
  const page = PageContentSchema.parse(await readJson(file));
  if (page.seo.noindex) noindex.add(page.slug);
}
for (const file of await fg("content/products/*.json", { cwd: root })) {
  const product = ProductSchema.parse(await readJson(file));
  if (product.seo.noindex) noindex.add(`/products/${product.slug}`);
}
for (const file of await fg("content/blog/*.md", { cwd: root })) {
  const post = BlogFrontmatterSchema.parse(matter(await readFile(path.join(root, file), "utf8")).data);
  if (post.seo.noindex) noindex.add(`/blog/${post.slug}`);
}
for (const file of await fg("data/experiences/*.json", { cwd: root })) {
  const experience = ScrollWorldExperienceSchema.parse(await readJson(file));
  if (experience.placement === "route" && experience.seo.noindex) noindex.add(experience.route ?? `/${experience.slug}`);
}
if (routeSeo.products?.noindex) noindex.add("/products");
if (routeSeo.blog?.noindex) noindex.add("/blog");

const routes = site.launchStatus === "live" ? manifest.routes.filter((route) => !noindex.has(route)) : [];
const origin = site.url.replace(/\/$/, "");
const urls = routes.map((route) => `  <url><loc>${origin}${route === "/" ? "/" : route}</loc></url>`).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls ? `\n${urls}\n` : ""}</urlset>\n`;
const robots = site.launchStatus === "live" ? `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n` : `User-agent: *\nDisallow: /\n`;

await mkdir(output, { recursive: true });
await writeFile(path.join(output, "sitemap.xml"), sitemap);
await writeFile(path.join(output, "robots.txt"), robots);

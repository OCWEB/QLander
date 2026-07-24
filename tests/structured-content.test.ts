import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { PageContentSchema, ProductSchema, ResourceSchema, SiteDataSchema } from "../src/lib/schemas";
import { productSchema, resourceSchema } from "../src/lib/structuredData";
import { site } from "../src/lib/site";

const run = promisify(execFile);
const repo = path.resolve(import.meta.dirname, "..");
const tsx = path.join(repo, "node_modules/.bin/tsx");
const checker = path.join(repo, "scripts/qlander-check.ts");

test("[fast] contact sections default to action mode and informational mode needs no invented destination", () => {
  const base = {
    title: "Contact",
    slug: "/contact",
    seo: { title: "Contact", description: "How this organization communicates.", noindex: false },
    sections: [{ id: "contact.info", type: "contact", headline: "Contact", body: "Public updates are posted here." }]
  };
  const actionPage = PageContentSchema.parse(base);
  assert.equal(actionPage.sections[0]?.type === "contact" && actionPage.sections[0].mode, "action");
  const informational = PageContentSchema.parse({
    ...base,
    sections: [
      { id: "contact.hero", type: "hero", headline: "Contact", subheadline: "Public information only." },
      { id: "contact.info", type: "contact", mode: "informational", headline: "How we communicate", body: "This page is intentionally informational.", informationalNote: "No response channel is offered on this site." }
    ]
  });
  assert.equal(informational.sections[1]?.type === "contact" && informational.sections[1].mode, "informational");
  assert.equal(SiteDataSchema.safeParse({ ...site, email: "", phone: "", contactUrl: undefined }).success, true);
});

test("[integration] explicit informational contact mode passes launch validation without contact coordinates", async () => {
  const fixture = await copyFixture(true);
  const siteFile = path.join(fixture, "data/site.json");
  const siteData = JSON.parse(await readFile(siteFile, "utf8"));
  Object.assign(siteData, {
    url: "https://organization.example.org",
    launchStatus: "live",
    email: "",
    phone: "",
    socialImage: "/images/logo.svg",
    address: { street: "1 Main Street", city: "Example", region: "NY", postalCode: "10001", country: "US" }
  });
  delete siteData.contactUrl;
  await writeFile(siteFile, JSON.stringify(siteData, null, 2));
  const contactFile = path.join(fixture, "content/pages/contact.json");
  const contact = JSON.parse(await readFile(contactFile, "utf8"));
  delete contact.sections[0].primaryCta;
  delete contact.sections[0].secondaryCta;
  contact.sections[1].mode = "informational";
  contact.sections[1].informationalNote = "This website publishes information but does not accept inquiries.";
  await writeFile(contactFile, JSON.stringify(contact, null, 2));
  const result = await runChecker(fixture, ["--launch", "--json"]);
  assert.equal(result.code, 0, result.output);
  const rendered = await readFile(path.join(fixture, "dist/contact/index.html"), "utf8");
  assert.doesNotMatch(rendered, /mailto:|tel:/);
  assert.match(rendered, /This website publishes information but does not accept inquiries\./);
  assert.doesNotMatch(rendered, /class="button primary"/);

  contact.sections[1].mode = "action";
  await writeFile(contactFile, JSON.stringify(contact, null, 2));
  const actionResult = await runChecker(fixture, ["--skip-build", "--launch", "--json"]);
  assert.notEqual(actionResult.code, 0);
  assert.match(actionResult.output, /schema\.contact_missing/);
});

test("[fast] offering semantics produce Product, Service, and CollectionPage structured data", () => {
  const common = {
    title: "Advisory",
    slug: "advisory",
    summary: "A structured offer.",
    description: "Complete details for this offer.",
    featured: false,
    seo: { title: "Advisory", description: "Advisory details.", noindex: false }
  };
  const product = ProductSchema.parse(common);
  const service = ProductSchema.parse({ ...common, slug: "service", kind: "service" });
  const category = ProductSchema.parse({ ...common, slug: "category", kind: "category" });
  assert.equal(product.kind, "product");
  assert.equal(productSchema(site, product)["@type"], "Product");
  assert.equal(productSchema(site, service)["@type"], "Service");
  assert.equal(productSchema(site, category)["@type"], "CollectionPage");
});

test("[integration] resources support detail documents and direct external links with progressive filters", async () => {
  const detail = ResourceSchema.parse({
    title: "2025 report",
    slug: "2025-report",
    summary: "A public report.",
    year: 2025,
    type: "Report",
    destination: { kind: "detail", body: "Report context and highlights." },
    seo: { title: "2025 report", description: "Read the 2025 report.", noindex: false }
  });
  const external = ResourceSchema.parse({
    title: "External filing",
    slug: "external-filing",
    summary: "A filing hosted by the regulator.",
    type: "Filing",
    destination: { kind: "external", href: "https://example.org/filing" }
  });
  assert.equal(resourceSchema(site, detail)["@type"], "DigitalDocument");
  assert.equal(external.destination.kind, "external");
  assert.equal(ResourceSchema.safeParse({ ...external, destination: { kind: "external", href: "http://example.org/filing" } }).success, false);

  const fixture = await copyFixture(true);
  const result = await runChecker(fixture, ["--json"]);
  assert.equal(result.code, 0, result.output);
  const listing = await readFile(path.join(fixture, "dist/resources/index.html"), "utf8");
  assert.match(listing, /data-resource-year/);
  assert.match(listing, /data-resource-type/);
  assert.match(listing, /<noscript>/);
  assert.match(listing, /https:\/\/example\.org\/filing/);
  const renderedDetail = await readFile(path.join(fixture, "dist/resources/annual-report/index.html"), "utf8");
  assert.match(renderedDetail, /DigitalDocument/);
  assert.match(renderedDetail, /Back to resources/);
});

async function copyFixture(withRuntime: boolean) {
  const target = await mkdtemp(path.join(os.tmpdir(), "qlander-structured-content-"));
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

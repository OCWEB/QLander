#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { EditMapSchema, ManifestSchema, ResourceSchema } from "../src/lib/schemas";

const [command, ...argv] = process.argv.slice(2).filter((value, index) => !(value === "--" && index === 0));

try {
  if (command !== "add" && command !== "remove") fail("First argument must be add or remove");
  const args = parseArgs(argv);
  const root = path.resolve(value(args, "root", false) ?? process.cwd());
  const slug = value(args, "slug")!;
  const resourceFile = safeResourceFile(root, slug);
  const manifestFile = path.join(root, "qlander.manifest.json");
  const editMapFile = path.join(root, "qlander.edit-map.json");
  const manifest = ManifestSchema.parse(await readJson(manifestFile));
  const editMap = EditMapSchema.parse(await readJson(editMapFile));

  if (command === "add") {
    const force = flag(args, "force");
    rejectUnknown(args, new Set(["root", "slug", "kind", "title", "summary", "year", "type", "body", "cta-label", "cta-href", "seo-title", "seo-description", "noindex", "href", "label", "force"]));
    if ((existsSync(resourceFile) || editMap[`resource.${slug}`]) && !force) fail(`Resource ${slug} already exists; pass --force to replace it explicitly`);
    const resource = buildResource(args, slug);
    ResourceSchema.parse(resource);
    const route = `/resources/${slug}`;
    manifest.routes = manifest.routes.filter((item) => item !== route);
    if (resource.destination.kind === "detail") manifest.routes.push(route);
    editMap[`resource.${slug}`] = createEditMapEntry(resource);
    ManifestSchema.parse(manifest);
    EditMapSchema.parse(editMap);
    await atomicUpdate(new Map([
      [resourceFile, serialize(resource)],
      [editMapFile, serialize(editMap)],
      [manifestFile, serialize(manifest)]
    ]));
    console.log(`Registered ${resource.destination.kind} resource ${slug}`);
  } else {
    rejectUnknown(args, new Set(["root", "slug"]));
    if (!existsSync(resourceFile) && !editMap[`resource.${slug}`] && !manifest.routes.includes(`/resources/${slug}`)) fail(`Resource ${slug} is not registered`);
    delete editMap[`resource.${slug}`];
    manifest.routes = manifest.routes.filter((item) => item !== `/resources/${slug}`);
    ManifestSchema.parse(manifest);
    EditMapSchema.parse(editMap);
    await atomicUpdate(new Map([
      [editMapFile, serialize(editMap)],
      [manifestFile, serialize(manifest)]
    ]), [resourceFile]);
    console.log(`Removed resource ${slug}`);
  }
} catch (error) {
  console.error(formatError(error));
  process.exitCode = 1;
}

function buildResource(args: Map<string, string | true>, slug: string) {
  const kind = value(args, "kind");
  if (kind !== "detail" && kind !== "external") fail("--kind must be detail or external");
  const resource: any = {
    title: value(args, "title"),
    slug,
    summary: value(args, "summary")
  };
  const year = value(args, "year", false);
  if (year !== undefined) {
    if (!/^\d{4}$/.test(year)) fail("--year must be a four-digit year");
    resource.year = Number(year);
  }
  const type = value(args, "type", false);
  if (type !== undefined) resource.type = type;

  if (kind === "detail") {
    forbid(args, ["href", "label"], "detail resources");
    resource.destination = { kind, body: value(args, "body") };
    const ctaLabel = value(args, "cta-label", false);
    const ctaHref = value(args, "cta-href", false);
    if ((ctaLabel === undefined) !== (ctaHref === undefined)) fail("--cta-label and --cta-href must be provided together");
    if (ctaLabel && ctaHref) resource.destination.cta = { label: ctaLabel, href: ctaHref };
    resource.seo = {
      title: value(args, "seo-title"),
      description: value(args, "seo-description"),
      noindex: flag(args, "noindex")
    };
  } else {
    forbid(args, ["body", "cta-label", "cta-href", "seo-title", "seo-description", "noindex"], "external resources");
    resource.destination = { kind, href: value(args, "href") };
    const label = value(args, "label", false);
    if (label !== undefined) resource.destination.label = label;
  }
  return resource;
}

function createEditMapEntry(resource: any) {
  const detail = resource.destination.kind === "detail";
  const route = `/resources/${resource.slug}`;
  return {
    route: detail ? route : "/resources",
    label: `${resource.title} resource`,
    scope: "collection-content",
    contentFile: `content/resources/${resource.slug}.json`,
    jsonPath: "$",
    component: detail ? "ResourceDetail" : "ResourceList",
    safeFields: detail
      ? ["title", "summary", "year", "type", "destination.body", "destination.cta.label", "destination.cta.href", "image.src", "image.alt", "image.width", "image.height", "seo.title", "seo.description", "seo.noindex", "seo.socialImage"]
      : ["title", "summary", "year", "type", "destination.href", "destination.label", "image.src", "image.alt", "image.width", "image.height"],
    affectedRoutes: detail ? ["/resources", route] : ["/resources"]
  };
}

async function atomicUpdate(writes: Map<string, string>, deletes: string[] = []) {
  const token = `.qlander-resource-${process.pid}-${Date.now()}`;
  const temporary = new Map<string, string>();
  const backups = new Map<string, string>();
  const affected = [...new Set([...writes.keys(), ...deletes])];
  try {
    for (const [file, content] of writes) {
      await mkdir(path.dirname(file), { recursive: true });
      const temp = `${file}${token}.tmp`;
      await writeFile(temp, content, { flag: "wx" });
      temporary.set(file, temp);
    }
    for (const file of affected) {
      if (!existsSync(file)) continue;
      const backup = `${file}${token}.bak`;
      await rename(file, backup);
      backups.set(file, backup);
    }
    for (const [file, temp] of temporary) await rename(temp, file);
    for (const backup of backups.values()) await rm(backup, { force: true });
  } catch (error) {
    for (const file of affected) if (existsSync(file) && (temporary.has(file) || backups.has(file))) await rm(file, { force: true }).catch(() => {});
    for (const [file, backup] of backups) if (existsSync(backup)) await rename(backup, file).catch(() => {});
    throw error;
  } finally {
    for (const temp of temporary.values()) await rm(temp, { force: true }).catch(() => {});
    for (const backup of backups.values()) await rm(backup, { force: true }).catch(() => {});
  }
}

function parseArgs(values: string[]) {
  const result = new Map<string, string | true>();
  const booleans = new Set(["force", "noindex"]);
  for (let index = 0; index < values.length; index += 1) {
    const item = values[index];
    if (!item.startsWith("--")) fail(`Unexpected argument ${item}`);
    const [key, inline] = item.slice(2).split("=", 2);
    if (result.has(key)) fail(`Duplicate option --${key}`);
    if (inline !== undefined) {
      if (!inline) fail(`Missing value for --${key}`);
      result.set(key, inline);
    } else if (booleans.has(key)) result.set(key, true);
    else {
      const next = values[++index];
      if (!next || next.startsWith("--")) fail(`Missing value for --${key}`);
      result.set(key, next);
    }
  }
  return result;
}

function value(args: Map<string, string | true>, key: string, required = true) {
  const item = args.get(key);
  if (item === true) fail(`--${key} requires a value`);
  if ((item === undefined || item.trim() === "") && required) fail(`Provide --${key}`);
  return item as string | undefined;
}
function flag(args: Map<string, string | true>, key: string) { return args.get(key) === true; }
function forbid(args: Map<string, string | true>, keys: string[], context: string) {
  const invalid = keys.find((key) => args.has(key));
  if (invalid) fail(`--${invalid} is not valid for ${context}`);
}
function rejectUnknown(args: Map<string, string | true>, allowed: Set<string>) {
  const unknown = [...args.keys()].find((key) => !allowed.has(key));
  if (unknown) fail(`Unknown option --${unknown}`);
}
function safeResourceFile(root: string, slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail("--slug must use lowercase letters, numbers, and single hyphens");
  return path.join(root, "content", "resources", `${slug}.json`);
}
async function readJson(file: string) {
  try { return JSON.parse(await readFile(file, "utf8")); }
  catch (error) { throw new Error(`Cannot read valid JSON from ${file}: ${error instanceof Error ? error.message : String(error)}`); }
}
function serialize(value: unknown) { return `${JSON.stringify(value, null, 2)}\n`; }
function formatError(error: unknown) {
  if (error && typeof error === "object" && "issues" in error) return `Validation failed: ${JSON.stringify((error as any).issues)}`;
  return error instanceof Error ? error.message : String(error);
}
function fail(message: string): never { throw new Error(message); }

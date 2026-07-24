#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CURRENT_VERSION = "0.4.0";
const SUPPORTED_FROM = "0.3.0";
const TEMPLATE_SOURCE = "https://github.com/OCWEB/QLander";

type Operation = { kind: string; file: string; detail: string };
type Issue = { file: string; detail: string };
type PlannedWrite = { file: string; content: string; operation: Operation };

const runtime030Hashes: Record<string, string> = {
  "package.json": "2b7ac3a2cda4c8d27ff7657e7d22b3b916d4953be130ada047e5a9789dd26f97",
  "astro.config.mjs": "d70bc0de0993073376108ea6bd057faca3c76e30e53d2de369d5729f901c6a6d",
  "tsconfig.json": "7d3ba9279b0a3d5bdf3693d939d7000d82eb31dd3a492593dcf7af77a3eb9ad3",
  "src/lib/schemas.ts": "e1d13a1e69849b7a686345a3abfb52c696b9168d646186ef190f1e1adb77fb16",
  "src/content.config.ts": "ece884414d600218018e537552b768523784717a0400cdc9965a6df332e0076b",
  "scripts/qlander-check.ts": "fad8e943f82cb637f8ae363a536593ed50387674b2b321888863eb43772d308f",
  "scripts/generate-site-files.ts": "50687d98740c067f23646aebf0b54977fc2eb8776de7dd0ae00fccf215b1d8b6"
};

const sentinel = `---
title: "QLander empty blog sentinel"
description: "Non-routed content entry that keeps Astro's blog collection glob stable when no real posts exist."
slug: "qlander-empty-blog-sentinel"
publishedAt: "1970-01-01"
updatedAt: "1970-01-01"
author: "QLander"
tags: []
routed: false
seo:
  title: "QLander empty blog sentinel"
  description: "This internal sentinel is never rendered or indexed."
  noindex: true
---

This internal collection sentinel is filtered from routes, listings, validation, and generated site files.
`;

const argv = process.argv.slice(2);
if (argv[0] === "--") argv.shift();
const args = parseArgs(argv);
const root = path.resolve(stringArg(args, "root", "."));
const target = stringArg(args, "to", CURRENT_VERSION);
const dryRun = args["dry-run"] === true;
const json = args.json === true;

try {
  if (target !== CURRENT_VERSION) fail(`Unsupported target version ${target}; supported target: ${CURRENT_VERSION}`);
  const manifestFile = path.join(root, "qlander.manifest.json");
  if (!existsSync(manifestFile)) fail(`QLander manifest not found: ${manifestFile}`);
  const manifest = await readJson(manifestFile);
  if (manifest.templateSource !== TEMPLATE_SOURCE) fail(`Unsupported QLander template source: ${String(manifest.templateSource)}`);
  if (manifest.templateVersion === CURRENT_VERSION) {
    print({ status: "already-current", root, from: CURRENT_VERSION, to: CURRENT_VERSION, dryRun, operations: [], conflicts: [], manualSteps: [] });
  } else {
    if (manifest.templateVersion !== SUPPORTED_FROM) fail(`Unsupported source version ${String(manifest.templateVersion)}; supported source: ${SUPPORTED_FROM}`);
    const plan = await planMigration(root, manifest);
    if (!dryRun) {
      for (const item of plan.writes) await writeFile(item.file, item.content);
      const record = {
        from: SUPPORTED_FROM,
        to: CURRENT_VERSION,
        appliedAt: new Date().toISOString(),
        operations: plan.operations.map((item) => `${item.kind}:${item.file}`)
      };
      manifest.templateVersion = CURRENT_VERSION;
      manifest.migrations = [...(Array.isArray(manifest.migrations) ? manifest.migrations : []), record];
      await writeJson(manifestFile, manifest);
    }
    print({
      status: dryRun ? "planned" : "migrated",
      root,
      from: SUPPORTED_FROM,
      to: CURRENT_VERSION,
      dryRun,
      operations: plan.operations,
      conflicts: plan.conflicts,
      manualSteps: plan.manualSteps
    });
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function planMigration(root: string, manifest: any) {
  const writes: PlannedWrite[] = [];
  const operations: Operation[] = [];
  const conflicts: Issue[] = [];
  const manualSteps: string[] = [];

  await planJsonDefaults(path.join(root, manifest.contentRoot ?? "content", "products"), "*.json", (value, relative) => {
    if (value.kind === undefined) return { value: { ...value, kind: "product" }, kind: "add-product-kind", detail: `Set missing kind to product in ${relative}` };
  }, writes, operations, conflicts);

  await planJsonDefaults(path.join(root, manifest.contentRoot ?? "content", "pages"), "*.json", (value, relative) => {
    let changed = false;
    const sections = Array.isArray(value.sections) ? value.sections.map((section: any) => {
      if (section && section.type === "contact" && section.mode === undefined) {
        changed = true;
        return { ...section, mode: "action" };
      }
      return section;
    }) : value.sections;
    if (changed) return { value: { ...value, sections }, kind: "add-contact-mode", detail: `Set missing contact mode to action in ${relative}` };
  }, writes, operations, conflicts);

  const blogDir = path.join(root, manifest.contentRoot ?? "content", "blog");
  if (existsSync(blogDir)) {
    const markdown = (await readdir(blogDir)).filter((file) => file.endsWith(".md")).sort();
    const sentinelFile = path.join(blogDir, "_empty.md");
    if (!markdown.includes("_empty.md") && (markdown.length > 0 || manifest.routes?.includes("/blog"))) {
      addWrite(sentinelFile, sentinel, { kind: "add-blog-sentinel", file: relative(root, sentinelFile), detail: "Add the non-routed empty-blog sentinel" }, writes, operations);
    }
    for (const name of markdown) {
      const file = path.join(blogDir, name);
      const source = await readFile(file, "utf8");
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!frontmatter) {
        conflicts.push({ file: relative(root, file), detail: "Cannot safely add routed: frontmatter block is missing or malformed" });
        continue;
      }
      if (/^routed\s*:/m.test(frontmatter[1])) continue;
      const routed = name === "_empty.md" ? false : true;
      const insertion = `routed: ${routed}\n`;
      const updatedBlock = /^seo\s*:/m.test(frontmatter[1])
        ? frontmatter[1].replace(/^seo\s*:/m, `${insertion}seo:`)
        : `${frontmatter[1]}\n${insertion.trimEnd()}`;
      const content = source.replace(frontmatter[1], updatedBlock);
      addWrite(file, content, { kind: "add-blog-routed", file: relative(root, file), detail: `Set routed to ${routed}` }, writes, operations);
    }
  }

  const customizedRuntime: string[] = [];
  for (const [name, expected] of Object.entries(runtime030Hashes)) {
    const file = path.join(root, name);
    if (!existsSync(file)) {
      conflicts.push({ file: name, detail: "Expected 0.3.0 runtime file is missing; restore or update it manually" });
      continue;
    }
    const actual = hash(await readFile(file));
    if (actual !== expected) {
      customizedRuntime.push(name);
      conflicts.push({ file: name, detail: "Runtime file differs from the 0.3.0 baseline and was not overwritten" });
    }
  }
  manualSteps.push("Runtime files are never overwritten by this conservative migration; review and merge the 0.4.0 runtime/template diff separately.");
  if (customizedRuntime.length) manualSteps.push(`Manually merge customized runtime files: ${customizedRuntime.join(", ")}.`);
  if (conflicts.length) manualSteps.push("Resolve every reported conflict, then run pnpm typecheck, pnpm test, and pnpm qlander:check.");
  else manualSteps.push("After merging the 0.4.0 runtime/template diff, run pnpm typecheck, pnpm test, and pnpm qlander:check.");

  return { writes, operations, conflicts, manualSteps };
}

async function planJsonDefaults(
  dir: string,
  _pattern: string,
  transform: (value: any, relative: string) => { value: any; kind: string; detail: string } | undefined,
  writes: PlannedWrite[], operations: Operation[], conflicts: Issue[]
) {
  if (!existsSync(dir)) return;
  for (const name of (await readdir(dir)).filter((file) => file.endsWith(".json")).sort()) {
    const file = path.join(dir, name);
    try {
      const value = await readJson(file);
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("top-level JSON value must be an object");
      const result = transform(value, name);
      if (result) addWrite(file, `${JSON.stringify(result.value, null, 2)}\n`, { kind: result.kind, file: name, detail: result.detail }, writes, operations);
    } catch (error) {
      conflicts.push({ file, detail: `Cannot safely update JSON: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
}

function addWrite(file: string, content: string, operation: Operation, writes: PlannedWrite[], operations: Operation[]) {
  writes.push({ file, content, operation });
  operations.push(operation);
}

function parseArgs(values: string[]) {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (!token.startsWith("--")) fail(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    if (["dry-run", "json"].includes(key)) parsed[key] = true;
    else {
      const value = values[++index];
      if (!value || value.startsWith("--")) fail(`Missing value for --${key}`);
      parsed[key] = value;
    }
  }
  return parsed;
}

function stringArg(values: Record<string, string | boolean>, key: string, fallback: string) {
  return typeof values[key] === "string" ? values[key] : fallback;
}

async function readJson(file: string) {
  return JSON.parse(await readFile(file, "utf8"));
}
async function writeJson(file: string, value: unknown) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}
function hash(value: Buffer) {
  return createHash("sha256").update(value).digest("hex");
}
function relative(root: string, file: string) {
  return path.relative(root, file).split(path.sep).join("/");
}
function print(report: unknown) {
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    const value = report as any;
    console.log(`QLander migration ${value.status}: ${value.from} -> ${value.to}${value.dryRun ? " (dry run)" : ""}`);
    for (const operation of value.operations) console.log(`  PLAN ${operation.file}: ${operation.detail}`);
    for (const conflict of value.conflicts) console.log(`  CONFLICT ${conflict.file}: ${conflict.detail}`);
    for (const step of value.manualSteps) console.log(`  MANUAL ${step}`);
  }
}
function fail(message: string): never {
  throw new Error(message);
}

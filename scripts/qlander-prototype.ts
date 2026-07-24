#!/usr/bin/env node
/**
 * Bridges qlander-prototyper into QLander.
 *
 * Runs the prototyper CLI, maps its chosen variant through the versioned mapping
 * in src/lib/prototype-mapping.ts, and writes a layout blueprint plus the
 * edit-map entries the composition implies.
 *
 * It never writes copy. Content stays source-backed and is authored separately;
 * this produces the skeleton and the provenance record only.
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import {
  MAPPING_VERSION,
  TYPE_TO_COMPONENT,
  TYPE_TO_SAFE_FIELDS,
  mapVariant,
  type PrototyperSection
} from "../src/lib/prototype-mapping";

const exec = promisify(execFile);
const argv = process.argv.slice(2).filter((value, index) => !(value === "--" && index === 0));

try {
  const args = parseArgs(argv);
  rejectUnknown(args, new Set(["root", "prototyper", "request", "variant", "page", "write-edit-map"]));
  const root = path.resolve(str(args, "root") ?? process.cwd());
  const prototyper = path.resolve(str(args, "prototyper") ?? path.join(root, "../qlander-prototyper"));
  const requestPath = path.resolve(str(args, "request") ?? fail("--request is required"));
  const rank = Number.parseInt(str(args, "variant") ?? "1", 10);
  const pageKey = str(args, "page") ?? "home";

  if (!existsSync(path.join(prototyper, "cli/index.ts"))) {
    fail(`No prototyper CLI at ${prototyper}. Pass --prototyper <path to qlander-prototyper>.`);
  }
  if (!existsSync(requestPath)) fail(`Request file not found: ${requestPath}`);
  if (!Number.isInteger(rank) || rank < 1) fail("--variant must be a positive integer");

  const result = await runPrototyper(prototyper, requestPath);
  const variant = result.variants.find((candidate: { rank: number }) => candidate.rank === rank);
  if (!variant) fail(`Variant rank ${rank} not present; run produced ${result.variants.length}`);

  const hasProducts = existsSync(path.join(root, "content/products"));
  const mapping = mapVariant(variant.sections as PrototyperSection[], { pageKey, hasProducts });

  const blueprint = {
    version: 1,
    mappingVersion: MAPPING_VERSION,
    generatedFrom: {
      tool: "qlander-prototyper",
      runId: result.runId,
      catalogVersion: result.catalogVersion,
      seed: result.request.seed,
      pageType: result.request.pageType,
      goal: result.request.goal,
      variantRank: rank,
      variantScore: variant.score
    },
    page: pageKey,
    sections: mapping.sections,
    skipped: mapping.skipped,
    warnings: [...mapping.warnings, ...(result.warnings ?? [])]
  };

  const outDir = path.join(root, ".qlander/prototype", String(result.runId));
  await mkdir(outDir, { recursive: true });
  const blueprintFile = path.join(outDir, "blueprint.json");
  await writeFile(blueprintFile, `${JSON.stringify(blueprint, null, 2)}\n`);

  const entries = Object.fromEntries(
    mapping.sections.map((section, index) => [
      section.id,
      {
        route: pageKey === "home" ? "/" : `/${pageKey}`,
        label: `${titleCase(pageKey)} ${section.role}`,
        scope: "single-page-content",
        contentFile: `content/pages/${pageKey}.json`,
        jsonPath: `sections[${index}]`,
        component: TYPE_TO_COMPONENT[section.type],
        safeFields: TYPE_TO_SAFE_FIELDS[section.type],
        affectedRoutes: [pageKey === "home" ? "/" : `/${pageKey}`]
      }
    ])
  );
  const entriesFile = path.join(outDir, "edit-map-entries.json");
  await writeFile(entriesFile, `${JSON.stringify(entries, null, 2)}\n`);

  console.log(`Prototyper run ${result.runId} (catalog ${result.catalogVersion}, seed ${result.request.seed}, rank ${rank})`);
  console.log(`Mapping v${MAPPING_VERSION} produced ${mapping.sections.length} sections:`);
  for (const [index, section] of mapping.sections.entries()) {
    const flag = section.needsReview ? " [review]" : "";
    console.log(`  ${String(index + 1).padStart(2, " ")} ${section.id.padEnd(22)} ${section.type.padEnd(13)} ${section.referenceId.padEnd(7)} ${section.patternFamily}${flag}`);
    for (const note of section.notes) console.log(`     note: ${note}`);
  }
  for (const skip of mapping.skipped) console.log(`  skipped ${skip.referenceId} (${skip.contentShape}): ${skip.note}`);
  for (const warning of blueprint.warnings) console.log(`  WARN ${warning}`);
  console.log(`\nBlueprint: ${path.relative(root, blueprintFile)}`);
  console.log(`Edit-map entries: ${path.relative(root, entriesFile)}`);
  console.log("\nNext: author content/pages/*.json against these ids, merge the edit-map entries, then build a design handoff.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function runPrototyper(prototyper: string, requestPath: string) {
  const { stdout } = await exec("npx", ["tsx", "cli/index.ts", "generate", "--request", requestPath], {
    cwd: prototyper,
    maxBuffer: 32 * 1024 * 1024
  });
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error("Prototyper did not return JSON. Run its CLI directly to see the error.");
  }
}

function parseArgs(values: string[]) {
  const result: Record<string, string | boolean> = {};
  const booleans = new Set(["write-edit-map"]);
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) fail(`Unexpected argument ${value}`);
    const [key, inline] = value.slice(2).split("=", 2);
    if (inline !== undefined) { result[key] = inline || true; continue; }
    if (booleans.has(key)) { result[key] = true; continue; }
    const next = values[++index];
    if (next === undefined || next.startsWith("--")) fail(`Missing value for --${key}`);
    result[key] = next;
  }
  return result;
}

function rejectUnknown(args: Record<string, string | boolean>, allowed: Set<string>) {
  for (const key of Object.keys(args)) if (!allowed.has(key)) fail(`Unknown flag --${key}`);
}

function str(args: Record<string, string | boolean>, key: string) {
  const value = args[key];
  return typeof value === "string" ? value : undefined;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fail(message: string): never {
  throw new Error(message);
}

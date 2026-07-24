#!/usr/bin/env node
// Design reference evidence ledger.
//
// This command does NOT drive a browser. QLander ships no browser dependency, and
// the Stage A pilot established that captures come from the agent's own browser
// tooling. What must be trustworthy is the *record*: which sources were tried,
// what happened to each, which images exist, and their hashes. That is this file.
//
// Workflow:
//   plan    write the ranked candidate pool before any navigation
//   next    ask which candidate to attempt, or why the run should stop
//   record  append an attempt outcome and let rotation policy update status
//   ingest  hash an image the agent captured and file it inside the run
//   status  report run health
//
// See todo_research-led-layout-workflow.md section 3.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ResearchManifestSchema } from "../src/lib/schemas";

type Outcome = "captured" | "captured-obstructed" | "http-error" | "timeout" | "bot-challenge" | "blank-render" | "identity-mismatch";
type Manifest = ReturnType<typeof ResearchManifestSchema.parse>;

// captured-obstructed is a success. A consent banner degrades a capture, it does
// not block one, and rotating on it discards good references.
const SUCCESS_OUTCOMES = new Set<Outcome>(["captured", "captured-obstructed"]);
const FAILURE_STATUS: Record<string, "blocked" | "unavailable"> = {
  "bot-challenge": "blocked",
  "identity-mismatch": "blocked",
  "http-error": "unavailable",
  timeout: "unavailable",
  "blank-render": "unavailable"
};
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const REFERENCE_ID = /^[a-z0-9][a-z0-9-]*$/;
const IGNORE_RULE = ".qlander/design-research/**/references/";

const argv = process.argv.slice(2);
if (argv[0] === "--") argv.shift();
const options = parseArgs(argv);
// The subcommand is the first bare token, wherever it appears, so both
// "capture plan --root x" and "capture --root x plan" work.
const command = firstBareToken(argv);
const root = path.resolve(option("root") ?? ".");

try {
  if (command === "plan") plan();
  else if (command === "next") next();
  else if (command === "record") record();
  else if (command === "ingest") ingest();
  else if (command === "status") status();
  else fail("usage: pnpm qlander:design:capture <plan|next|record|ingest|status> --root <project> --run <run-id> [...]");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function plan() {
  const poolFile = path.resolve(root, required("pool"));
  const pool = JSON.parse(readFileSync(poolFile, "utf8")) as {
    direction?: string;
    attemptBudget?: number;
    targetSuccesses?: number;
    maxSuccesses?: number;
    candidates?: { id: string; rank: number; sourceUrl: string; rights?: string; surface?: string; rationale?: string }[];
  };
  const candidates = pool.candidates ?? [];
  // Safety checks run before pool-size policy: an unsafe source must be reported
  // as unsafe, not masked by a "pool too small" message.
  for (const candidate of candidates) {
    if (!REFERENCE_ID.test(candidate.id)) fail(`Invalid reference id ${candidate.id}`);
    if (!candidate.sourceUrl.startsWith("https://")) fail(`Reference sources must be HTTPS: ${candidate.sourceUrl}`);
  }
  if (new Set(candidates.map((item) => item.id)).size !== candidates.length) fail("Candidate IDs must be unique");
  if (candidates.length < 2) fail("A candidate pool needs at least two sources");

  // A fresh run starts with zero evidence. Nothing is inherited from an earlier
  // run, so a previous project's captures can never be presented as this one's.
  const manifest: Manifest = ResearchManifestSchema.parse({
    version: 1,
    researchRunId: runId(),
    direction: pool.direction ?? "unspecified",
    attemptBudget: pool.attemptBudget ?? 8,
    attemptsUsed: 0,
    targetSuccesses: pool.targetSuccesses ?? 2,
    maxSuccesses: pool.maxSuccesses ?? 4,
    successes: 0,
    researchException: null,
    references: [...candidates]
      .sort((a, b) => a.rank - b.rank)
      .map((candidate) => ({
        id: candidate.id,
        rank: candidate.rank,
        sourceUrl: candidate.sourceUrl,
        status: "candidate",
        rights: (candidate.rights as "inspiration-only") ?? "inspiration-only",
        attempts: [],
        captures: [],
        ...(candidate.surface ? { surface: candidate.surface } : {})
      }))
  });

  mkdirSync(path.join(runDir(), "references"), { recursive: true });
  ensureIgnoreRule();
  save(manifest);
  console.log(`Planned ${manifest.references.length} candidates for ${manifest.researchRunId}. Evidence stays local and gitignored.`);
}

function next() {
  const manifest = load();
  const successes = countSuccesses(manifest);
  if (successes >= manifest.targetSuccesses) {
    markRemainder(manifest, "skipped-satisfied");
    save(manifest);
    console.log(`Target satisfied: ${successes}/${manifest.targetSuccesses} captured. Remaining candidates marked skipped-satisfied.`);
    return;
  }
  if (manifest.attemptsUsed >= manifest.attemptBudget) {
    markRemainder(manifest, "skipped-budget");
    save(manifest);
    console.log(`Attempt budget exhausted at ${manifest.attemptsUsed}/${manifest.attemptBudget} with ${successes}/${manifest.targetSuccesses} captured. Ask the user for supplied screenshots.`);
    return;
  }
  const candidate = manifest.references.find((item) => item.status === "candidate");
  if (!candidate) {
    console.log(`Pool exhausted with ${successes}/${manifest.targetSuccesses} captured. Ask the user for supplied screenshots.`);
    return;
  }
  console.log(`${candidate.id} ${candidate.sourceUrl}`);
}

function record() {
  const manifest = load();
  const reference = find(manifest, required("id"));
  const outcome = required("outcome") as Outcome;
  if (!SUCCESS_OUTCOMES.has(outcome) && !FAILURE_STATUS[outcome]) fail(`Unknown outcome ${outcome}`);

  reference.attempts.push({ at: new Date().toISOString(), outcome, ...(option("note") ? { note: option("note")! } : {}) });
  manifest.attemptsUsed += 1;

  if (SUCCESS_OUTCOMES.has(outcome)) {
    // Status stays `candidate` until evidence is ingested. A recorded success
    // with no image on disk must never read as a captured reference.
    reference.reviewedAt = new Date().toISOString();
    console.log(`Recorded ${outcome} for ${reference.id}. Ingest the image to complete the capture.`);
  } else {
    reference.status = FAILURE_STATUS[outcome];
    console.log(`Recorded ${outcome} for ${reference.id} (${reference.status}). Rotating to the next candidate.`);
  }

  if (manifest.attemptsUsed >= manifest.attemptBudget && countSuccesses(manifest) < manifest.targetSuccesses) {
    markRemainder(manifest, "skipped-budget");
    console.log(`Attempt budget exhausted at ${manifest.attemptsUsed}/${manifest.attemptBudget}.`);
  }
  save(manifest);
}

function ingest() {
  const manifest = load();
  const id = required("id");
  if (!REFERENCE_ID.test(id)) fail(`Invalid reference id ${id}`);
  const reference = find(manifest, id);
  const breakpoint = required("breakpoint");
  if (breakpoint !== "desktop" && breakpoint !== "mobile") fail("Breakpoint must be desktop or mobile");

  const source = path.resolve(root, required("file"));
  const extension = path.extname(source).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) fail(`Evidence must be a png, jpg, jpeg, or webp image, got ${extension || "no extension"}`);
  if (!existsSync(source)) fail(`Evidence file not found: ${source}`);

  const viewport = option("viewport");
  const realizedWidth = option("realized-width");
  if (viewport) {
    const [width, height] = viewport.split("x").map(Number);
    if (!width || !height) fail("Viewport must look like 1440x1000");
    // Window resize floors near 500px on some drivers. A 500px image labelled 390
    // makes every downstream mobile assertion a false pass, so require proof.
    if (realizedWidth !== undefined && Number(realizedWidth) !== width) {
      fail(`Realized viewport was ${realizedWidth}px but ${width}px was requested. Use viewport emulation, not window resize, then recapture.`);
    }
    reference.viewport = { width, height };
  }

  const localPath = `references/${id}-${breakpoint}.png`;
  const destination = path.join(runDir(), localPath);
  // The run directory is the only legal destination. Evidence must never reach
  // public/ or dist/, where the build would publish it.
  if (!destination.startsWith(path.join(runDir(), "references") + path.sep)) fail("Evidence must be written inside the run's references directory");
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(source, destination);

  const sha256 = createHash("sha256").update(readFileSync(destination)).digest("hex");
  reference.captures = [...reference.captures.filter((item) => item.breakpoint !== breakpoint), { breakpoint, localPath, sha256 }];
  if (reference.status === "candidate") {
    reference.status = option("supplied") !== undefined ? "user-supplied" : "captured";
    if (option("supplied") !== undefined) reference.rights = "user-supplied";
  }
  manifest.successes = countSuccesses(manifest);
  save(manifest);
  console.log(`Ingested ${localPath} (${sha256.slice(0, 12)}...) for ${id}.`);
}

function status() {
  const manifest = load();
  const successes = countSuccesses(manifest);
  const outcomes = manifest.references.flatMap((item) => item.attempts.map((attempt) => attempt.outcome));
  const tally = outcomes.reduce<Record<string, number>>((acc, outcome) => ({ ...acc, [outcome]: (acc[outcome] ?? 0) + 1 }), {});
  console.log(`run ${manifest.researchRunId} (${manifest.direction})`);
  console.log(`captures ${successes} / ${manifest.targetSuccesses} target, ${manifest.maxSuccesses} max`);
  console.log(`attempts ${manifest.attemptsUsed} / ${manifest.attemptBudget}`);
  console.log(`outcomes ${Object.entries(tally).map(([key, value]) => `${key}=${value}`).join(" ") || "none"}`);
  for (const reference of manifest.references) console.log(`  ${reference.rank}. ${reference.id} ${reference.status} (${reference.captures.length} images)`);
  if (successes < manifest.targetSuccesses) console.log(`Not yet publishable: ${manifest.targetSuccesses - successes} more reference(s) or a user-supplied fallback needed.`);
}

// --- helpers -----------------------------------------------------------------

function countSuccesses(manifest: Manifest) {
  return manifest.references.filter((item) => item.captures.length > 0).length;
}

function markRemainder(manifest: Manifest, status: "skipped-satisfied" | "skipped-budget") {
  for (const reference of manifest.references) if (reference.status === "candidate") reference.status = status;
}

function find(manifest: Manifest, id: string) {
  const reference = manifest.references.find((item) => item.id === id);
  if (!reference) fail(`Unknown reference ${id}. Reference IDs come from the planned pool and cannot be invented.`);
  return reference!;
}

function runId() {
  return required("run");
}

function runDir() {
  return path.join(root, ".qlander", "design-research", runId());
}

function manifestFile() {
  return path.join(runDir(), "reference-manifest.json");
}

function load(): Manifest {
  if (!existsSync(manifestFile())) fail(`No manifest for run ${runId()}. Run "plan" first.`);
  return ResearchManifestSchema.parse(JSON.parse(readFileSync(manifestFile(), "utf8")));
}

function save(manifest: Manifest) {
  writeFileSync(manifestFile(), `${JSON.stringify(ResearchManifestSchema.parse(manifest), null, 2)}\n`);
}

function ensureIgnoreRule() {
  const file = path.join(root, ".gitignore");
  const existing = existsSync(file) ? readFileSync(file, "utf8") : "";
  if (existing.includes(IGNORE_RULE)) return;
  writeFileSync(file, `${existing}${existing && !existing.endsWith("\n") ? "\n" : ""}${IGNORE_RULE}\n`);
}

function parseArgs(input: string[]) {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = input[index + 1];
    if (value === undefined || value.startsWith("--")) parsed[key] = "";
    else { parsed[key] = value; index += 1; }
  }
  return parsed;
}

function firstBareToken(input: string[]) {
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token.startsWith("--")) {
      const value = input[index + 1];
      if (value !== undefined && !value.startsWith("--")) index += 1;
      continue;
    }
    return token;
  }
  return undefined;
}

function option(name: string) {
  return Object.prototype.hasOwnProperty.call(options, name) ? options[name] : undefined;
}

function required(name: string) {
  const value = option(name);
  if (!value) fail(`Missing --${name}`);
  return value!;
}

function fail(message: string): never {
  throw new Error(message);
}

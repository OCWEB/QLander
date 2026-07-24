#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const STATE_START = "<!-- qlander-audit-state";
const STATE_END = "-->";
const phases = ["initialized", "discovery-complete", "implementation-complete", "verification-complete"] as const;
type Phase = (typeof phases)[number];
type Checkpoint = "discovery" | "implementation" | "verification";
type AuditState = {
  version: 1;
  caseId: string;
  scenario: "redesign" | "clone-look";
  mode: "batch" | "interactive";
  kitCommit: string;
  baselineCommit: string;
  phase: Phase;
  updatedAt: string;
  checkpoints: Record<"initialization" | Checkpoint, { status: "pending" | "complete"; completedAt: string | null }>;
};

const argv = process.argv.slice(2);
if (argv[0] === "--") argv.shift();
const command = argv.shift();
const options = parseArgs(argv);
const root = path.resolve(stringOption(options, "root") ?? ".");
const feedbackFile = path.join(root, "feedback_improve.md");

try {
  if (command === "init") initialize();
  else if (command === "checkpoint") checkpoint();
  else if (command === "status") status();
  else if (command === "aggregate") aggregate();
  else fail("usage: pnpm qlander:audit <init|checkpoint discovery|implementation|verification|status|aggregate> --root <case-repo|cases-parent-dir> [--no-commit]");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function initialize() {
  requireGitRepository();
  if (existsSync(feedbackFile)) fail("feedback_improve.md already exists; use status or checkpoint instead");
  const caseId = stringOption(options, "case") ?? path.basename(root).replace(/^qlander[_-]/, "");
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(caseId)) fail("--case must be a lowercased case id");
  const scenario = (stringOption(options, "scenario") ?? "redesign") as AuditState["scenario"];
  if (!(["redesign", "clone-look"] as const).includes(scenario)) fail("--scenario must be redesign or clone-look");
  const mode = (stringOption(options, "mode") ?? "batch") as AuditState["mode"];
  if (!(["batch", "interactive"] as const).includes(mode)) fail("--mode must be batch or interactive");
  const now = new Date().toISOString();
  const state: AuditState = {
    version: 1,
    caseId,
    scenario,
    mode,
    kitCommit: git(sourceRoot(), ["rev-parse", "HEAD"]),
    baselineCommit: git(root, ["rev-parse", "HEAD"]),
    phase: "initialized",
    updatedAt: now,
    checkpoints: {
      initialization: { status: "complete", completedAt: now },
      discovery: { status: "pending", completedAt: null },
      implementation: { status: "pending", completedAt: null },
      verification: { status: "pending", completedAt: null }
    }
  };
  const template = loadTemplate();
  const markdown = fillTemplate(template, state);
  writeFileSync(feedbackFile, `${embedState(state)}\n${markdown.trim()}\n`);
  maybeCommit(`Audit: initialize ${caseId}`);
  printState(state);
}

function checkpoint() {
  requireGitRepository();
  if (!existsSync(feedbackFile)) fail("feedback_improve.md is missing; run qlander:audit init first");
  const checkpointName = options._[0] as Checkpoint | undefined;
  if (!checkpointName || !(["discovery", "implementation", "verification"] as const).includes(checkpointName)) fail("checkpoint must be discovery, implementation, or verification");
  const dirty = git(root, ["status", "--porcelain", "--", "feedback_improve.md"], true);
  if (dirty) fail("feedback_improve.md has uncommitted changes; commit or restore it before checkpointing");
  const source = readFileSync(feedbackFile, "utf8");
  const state = parseState(source);
  const expectedPhase: Record<Checkpoint, Phase> = { discovery: "initialized", implementation: "discovery-complete", verification: "implementation-complete" };
  const nextPhase: Record<Checkpoint, Phase> = { discovery: "discovery-complete", implementation: "implementation-complete", verification: "verification-complete" };
  if (state.phase !== expectedPhase[checkpointName]) fail(`invalid audit transition: ${checkpointName} requires ${expectedPhase[checkpointName]}, current phase is ${state.phase}`);
  const now = new Date().toISOString();
  state.phase = nextPhase[checkpointName];
  state.updatedAt = now;
  state.checkpoints[checkpointName] = { status: "complete", completedAt: now };
  let updated = replaceEmbeddedState(source, state);
  updated = updated.replace(/^- Checkpoint status: .*$/m, `- Checkpoint status: ${state.phase}`);
  const label = checkpointName[0].toUpperCase() + checkpointName.slice(1);
  updated = updated.replace(new RegExp(`^\\| ${label} \\| pending \\| - \\| - \\| - \\|$`, "m"), `| ${label} | complete | pending | - | Recorded by qlander:audit checkpoint |`);
  writeFileSync(feedbackFile, updated);
  const verb = checkpointName === "implementation" ? "implement" : checkpointName === "verification" ? "verify" : "discovery";
  maybeCommit(`Audit: ${verb} ${state.caseId}`);
  printState(state);
}

function status() {
  if (!existsSync(feedbackFile)) fail(`feedback file not found: ${feedbackFile}`);
  printState(parseState(readFileSync(feedbackFile, "utf8")));
}

function maybeCommit(message: string) {
  if (options["no-commit"] === true) return;
  git(root, ["add", "--", "feedback_improve.md"]);
  git(root, ["-c", "user.name=QLander Audit", "-c", "user.email=qlander-audit@local.invalid", "commit", "-m", message, "--", "feedback_improve.md"]);
}

function requireGitRepository() {
  try { git(root, ["rev-parse", "--show-toplevel"]); } catch { fail(`--root must be a git repository: ${root}`); }
}

function loadTemplate() {
  const file = path.join(sourceRoot(), "skills/qlander-audit/references/feedback-template.md");
  const source = readFileSync(file, "utf8");
  const match = source.match(/```markdown\n([\s\S]*?)\n```/);
  if (!match) fail(`feedback template has no markdown block: ${file}`);
  return match[1];
}

function fillTemplate(template: string, state: AuditState) {
  const date = state.updatedAt.slice(0, 10);
  const sources = stringOption(options, "sources") ?? "pending";
  return template
    .replaceAll("<case id>", state.caseId)
    .replace("<YYYY-MM-DD>", date)
    .replace("<redesign | clone-look>", state.scenario)
    .replace("<official or reference URL>", sources)
    .replace("<frozen kit SHA>", state.kitCommit)
    .replace("<case repo init commit>", state.baselineCommit)
    .replace("<batch | interactive>", state.mode)
    .replace("initialized | discovery-complete | implementation-complete | verification-complete | blocked", state.phase)
    .replace("<SHA or pending>", "pending")
    .replace("<specific next action>", "Run discovery and then qlander:audit checkpoint discovery")
    .replace("<used>/<limit>", "0/30")
    .replace("<elapsed>/<limit>", "0m/45m")
    .replace("<SHA>", "pending")
    .replaceAll("<value>", "0 calls / 0m");
}

function embedState(state: AuditState) { return `${STATE_START}\n${JSON.stringify(state, null, 2)}\n${STATE_END}`; }
function replaceEmbeddedState(source: string, state: AuditState) {
  const start = source.indexOf(STATE_START);
  const end = source.indexOf(STATE_END, start);
  if (start < 0 || end < 0) fail("feedback_improve.md has no valid qlander audit state");
  return `${source.slice(0, start)}${embedState(state)}${source.slice(end + STATE_END.length)}`;
}
function parseState(source: string): AuditState {
  const start = source.indexOf(STATE_START);
  const end = source.indexOf(STATE_END, start);
  if (start < 0 || end < 0) fail("feedback_improve.md has no machine-readable qlander audit state");
  let value: unknown;
  try { value = JSON.parse(source.slice(start + STATE_START.length, end)); } catch { fail("feedback_improve.md contains invalid qlander audit state JSON"); }
  const state = value as AuditState;
  if (state?.version !== 1 || !phases.includes(state.phase) || typeof state.caseId !== "string" || !state.checkpoints) fail("feedback_improve.md contains unsupported qlander audit state");
  return state;
}
function printState(state: AuditState) { console.log(JSON.stringify(state, null, 2)); }
function sourceRoot() { return path.resolve(import.meta.dirname, ".."); }
function git(cwd: string, args: string[], allowEmpty = false) {
  const output = execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  return allowEmpty ? output : output;
}
type ParsedArgs = { _: string[]; [key: string]: string | boolean | string[] };
function stringOption(values: ParsedArgs, key: string) { const value = values[key]; return typeof value === "string" ? value : undefined; }
function parseArgs(values: string[]) {
  const result: ParsedArgs = { _: [] };
  const booleans = new Set(["no-commit"]);
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--") continue;
    if (!value.startsWith("--")) { result._.push(value); continue; }
    const [key, inline] = value.slice(2).split("=", 2);
    if (inline !== undefined) { result[key] = inline; continue; }
    if (booleans.has(key)) { result[key] = true; continue; }
    const next = values[++index];
    if (!next || next.startsWith("--")) fail(`missing value for --${key}`);
    result[key] = next;
  }
  return result;
}
function fail(message: string): never { throw new Error(message); }

function aggregate() {
  const parent = root;
  const cases = readdirSync(parent).filter((entry) => entry.startsWith("qlander_") && existsSync(path.join(parent, entry, "feedback_improve.md")));
  if (!cases.length) fail(`No qlander_* case directories with feedback_improve.md under ${parent}`);
  const frictionCounts = new Map<string, { count: number; cases: string[] }>();
  const rows: string[] = [];
  for (const caseDir of cases.sort()) {
    const text = readFileSync(path.join(parent, caseDir, "feedback_improve.md"), "utf8");
    const grade = (dimension: string) => new RegExp(`\\| ${dimension} \\| ([a-z ]+?) \\|`, "i").exec(text)?.[1]?.trim() ?? "?";
    const pending = [...text.matchAll(/^### (F\d+): (.+)$/gm)]
      .filter((match) => new RegExp(`### ${match[1]}:[\\s\\S]*?- Decision: pending`).test(text.slice(match.index)))
      .map((match) => match[2]);
    rows.push(`| ${caseDir.replace(/^qlander_/, "")} | ${grade("Approval gate")} | ${grade("Fact integrity")} | ${grade("Copy provenance")} | ${grade("Diff scope")} | ${grade("Validation")} | ${grade("Design contract")} | ${pending.length} |`);
    for (const title of pending) {
      const key = title.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").slice(0, 6).join(" ");
      const entry = frictionCounts.get(key) ?? { count: 0, cases: [] };
      entry.count += 1;
      entry.cases.push(caseDir.replace(/^qlander_/, ""));
      frictionCounts.set(key, entry);
    }
  }
  console.log("| Case | Gate | Facts | Provenance | Diff | Validation | Design | Pending |");
  console.log("|---|---|---|---|---|---|---|---|");
  for (const row of rows) console.log(row);
  const recurring = [...frictionCounts.entries()].filter(([, value]) => value.count > 1).sort((a, b) => b[1].count - a[1].count);
  if (recurring.length) {
    console.log("\nRecurring pending friction (strongest implement candidates):");
    for (const [key, value] of recurring) console.log(`- ${value.count}x "${key}" (${value.cases.join(", ")})`);
  } else {
    console.log("\nNo recurring pending friction across cases.");
  }
}

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { ResearchManifestSchema } from "../src/lib/schemas";

const run = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, "..");
const script = path.join(repoRoot, "scripts", "qlander-design-capture.ts");
const RUN_ID = "2026-07-24-institutional-modern";

const capture = async (root: string, args: string[]) =>
  run("node", ["--import", "tsx", script, "--root", root, ...args], { cwd: repoRoot });

const captureFails = async (root: string, args: string[]) => {
  try {
    await capture(root, args);
    return null;
  } catch (error) {
    return String((error as { stderr?: string; message?: string }).stderr ?? (error as Error).message);
  }
};

const manifestPath = (root: string) => path.join(root, ".qlander", "design-research", RUN_ID, "reference-manifest.json");
const readManifest = async (root: string) => ResearchManifestSchema.parse(JSON.parse(await readFile(manifestPath(root), "utf8")));
const reference = async (root: string, id: string) => (await readManifest(root)).references.find((item) => item.id === id)!;

async function project(pool?: unknown) {
  const root = await mkdtemp(path.join(os.tmpdir(), "qlander-capture-"));
  await writeFile(path.join(root, "qlander.manifest.json"), JSON.stringify({ siteId: "test", creationMode: "prompted" }));
  const poolFile = path.join(root, "pool.json");
  await writeFile(poolFile, JSON.stringify(pool ?? {
    version: 1,
    researchRunId: RUN_ID,
    direction: "Institutional Modern",
    attemptBudget: 8,
    targetSuccesses: 2,
    maxSuccesses: 4,
    candidates: [
      { id: "ref-a", rank: 1, sourceUrl: "https://a.example/", rights: "inspiration-only" },
      { id: "ref-b", rank: 2, sourceUrl: "https://b.example/", rights: "inspiration-only" },
      { id: "ref-c", rank: 3, sourceUrl: "https://c.example/", rights: "inspiration-only" },
      { id: "ref-d", rank: 4, sourceUrl: "https://d.example/", rights: "inspiration-only" }
    ]
  }));
  await capture(root, ["plan", "--run", RUN_ID, "--pool", poolFile]);
  return root;
}

async function png(root: string, name: string, bytes = "fake-png-bytes") {
  const file = path.join(root, name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  return file;
}

test("[fast] plan writes every candidate as a candidate before any capture", async () => {
  const root = await project();
  const manifest = await readManifest(root);
  assert.equal(manifest.references.length, 4);
  assert.ok(manifest.references.every((item) => item.status === "candidate"));
  assert.ok(manifest.references.every((item) => item.attempts.length === 0 && item.captures.length === 0));
  assert.equal(manifest.attemptsUsed, 0);
  // The ignore rule must exist so screenshots never reach Git.
  assert.match(await readFile(path.join(root, ".gitignore"), "utf8"), /design-research\/\*\*\/references\//);
});

test("[fast] next walks the pool in rank order and stops when the target is satisfied", async () => {
  const root = await project();
  assert.match((await capture(root, ["next", "--run", RUN_ID])).stdout, /ref-a/);

  await capture(root, ["record", "--run", RUN_ID, "--id", "ref-a", "--outcome", "captured"]);
  await capture(root, ["ingest", "--run", RUN_ID, "--id", "ref-a", "--breakpoint", "desktop", "--file", await png(root, "a.png"), "--viewport", "1440x1000"]);
  assert.match((await capture(root, ["next", "--run", RUN_ID])).stdout, /ref-b/);

  await capture(root, ["record", "--run", RUN_ID, "--id", "ref-b", "--outcome", "captured"]);
  await capture(root, ["ingest", "--run", RUN_ID, "--id", "ref-b", "--breakpoint", "desktop", "--file", await png(root, "b.png"), "--viewport", "1440x1000"]);

  const out = (await capture(root, ["next", "--run", RUN_ID])).stdout;
  assert.match(out, /satisfied/i);
  const manifest = await readManifest(root);
  assert.deepEqual(
    manifest.references.filter((item) => item.status === "skipped-satisfied").map((item) => item.id),
    ["ref-c", "ref-d"]
  );
  assert.ok(!manifest.references.some((item) => item.status === "skipped-budget"), "a satisfied run must never report budget exhaustion");
});

test("[fast] a consent wall is recorded as an obstructed success and never rotates", async () => {
  const root = await project();
  await capture(root, ["record", "--run", RUN_ID, "--id", "ref-a", "--outcome", "captured-obstructed", "--note", "consent banner over lower third"]);
  await capture(root, ["ingest", "--run", RUN_ID, "--id", "ref-a", "--breakpoint", "desktop", "--file", await png(root, "a.png"), "--viewport", "1440x1000"]);
  const ref = await reference(root, "ref-a");
  assert.equal(ref.status, "captured");
  assert.equal(ref.attempts[0].outcome, "captured-obstructed");
  assert.equal((await readManifest(root)).successes, 1);
});

test("[fast] rotation records failures honestly and never fabricates a capture", async () => {
  const root = await project();
  await capture(root, ["record", "--run", RUN_ID, "--id", "ref-a", "--outcome", "bot-challenge"]);
  await capture(root, ["record", "--run", RUN_ID, "--id", "ref-b", "--outcome", "http-error"]);
  const manifest = await readManifest(root);
  assert.equal(manifest.references.find((item) => item.id === "ref-a")!.status, "blocked");
  assert.equal(manifest.references.find((item) => item.id === "ref-b")!.status, "unavailable");
  assert.ok(manifest.references.every((item) => item.captures.length === 0));
  assert.equal(manifest.attemptsUsed, 2);
  assert.match((await capture(root, ["next", "--run", RUN_ID])).stdout, /ref-c/);
});

test("[fast] budget exhaustion is a clean exit distinct from satisfaction", async () => {
  const root = await project();
  await capture(root, ["plan", "--run", "tight", "--pool", await (async () => {
    const file = path.join(root, "tight.json");
    await writeFile(file, JSON.stringify({
      version: 1, researchRunId: "tight", direction: "D", attemptBudget: 2, targetSuccesses: 2, maxSuccesses: 4,
      candidates: [
        { id: "ref-a", rank: 1, sourceUrl: "https://a.example/", rights: "inspiration-only" },
        { id: "ref-b", rank: 2, sourceUrl: "https://b.example/", rights: "inspiration-only" },
        { id: "ref-c", rank: 3, sourceUrl: "https://c.example/", rights: "inspiration-only" }
      ]
    }));
    return file;
  })()]);
  await capture(root, ["record", "--run", "tight", "--id", "ref-a", "--outcome", "timeout"]);
  const second = await capture(root, ["record", "--run", "tight", "--id", "ref-b", "--outcome", "timeout"]);
  assert.match(second.stdout, /budget/i);

  const next = await capture(root, ["next", "--run", "tight"]);
  assert.match(next.stdout, /budget/i);
  assert.equal(next.stdout.includes("ref-c"), false, "no candidate may be offered past the budget");

  const raw = JSON.parse(await readFile(path.join(root, ".qlander", "design-research", "tight", "reference-manifest.json"), "utf8"));
  assert.equal(raw.references.find((item: { id: string }) => item.id === "ref-c").status, "skipped-budget");
});

test("[fast] ingest hashes evidence, keeps it inside the run, and rejects unsafe input", async () => {
  const root = await project();
  await capture(root, ["record", "--run", RUN_ID, "--id", "ref-a", "--outcome", "captured"]);
  await capture(root, ["ingest", "--run", RUN_ID, "--id", "ref-a", "--breakpoint", "desktop", "--file", await png(root, "a.png", "distinct-bytes"), "--viewport", "1440x1000"]);

  const ref = await reference(root, "ref-a");
  const capturedFile = ref.captures[0];
  assert.equal(capturedFile.localPath, "references/ref-a-desktop.png");
  assert.match(capturedFile.sha256, /^[a-f0-9]{64}$/);
  assert.ok(existsSync(path.join(root, ".qlander", "design-research", RUN_ID, capturedFile.localPath)));
  // Evidence never lands anywhere the build can publish it.
  assert.ok(!existsSync(path.join(root, "public", "references")));
  assert.ok(!existsSync(path.join(root, "dist", "references")));

  assert.match(String(await captureFails(root, ["ingest", "--run", RUN_ID, "--id", "ref-a", "--breakpoint", "desktop", "--file", "/etc/hosts"])), /png|jpg|jpeg|webp|image/i);
  assert.match(String(await captureFails(root, ["ingest", "--run", RUN_ID, "--id", "../escape", "--breakpoint", "desktop", "--file", await png(root, "x.png")])), /reference id/i);
});

test("[fast] a mobile ingest must prove the realized viewport matched the request", async () => {
  const root = await project();
  await capture(root, ["record", "--run", RUN_ID, "--id", "ref-a", "--outcome", "captured"]);
  // resize_page silently floors near 500px; a 500px capture labelled 390 is a false pass.
  const floored = await captureFails(root, [
    "ingest", "--run", RUN_ID, "--id", "ref-a", "--breakpoint", "mobile",
    "--file", await png(root, "m.png"), "--viewport", "390x844", "--realized-width", "500"
  ]);
  assert.match(String(floored), /realized viewport|390/i);

  await capture(root, [
    "ingest", "--run", RUN_ID, "--id", "ref-a", "--breakpoint", "mobile",
    "--file", await png(root, "m.png"), "--viewport", "390x844", "--realized-width", "390"
  ]);
  assert.equal((await reference(root, "ref-a")).captures[0].breakpoint, "mobile");
});

test("[fast] plan refuses insecure sources and never inherits another run's evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "qlander-capture-"));
  await writeFile(path.join(root, "qlander.manifest.json"), JSON.stringify({ siteId: "test", creationMode: "prompted" }));
  const insecure = path.join(root, "insecure.json");
  await writeFile(insecure, JSON.stringify({
    version: 1, researchRunId: RUN_ID, direction: "D", attemptBudget: 8, targetSuccesses: 2, maxSuccesses: 4,
    candidates: [{ id: "ref-a", rank: 1, sourceUrl: "http://a.example/", rights: "inspiration-only" }]
  }));
  assert.match(String(await captureFails(root, ["plan", "--run", RUN_ID, "--pool", insecure])), /https/i);

  const clean = await project();
  await capture(clean, ["record", "--run", RUN_ID, "--id", "ref-a", "--outcome", "captured"]);
  await capture(clean, ["ingest", "--run", RUN_ID, "--id", "ref-a", "--breakpoint", "desktop", "--file", await png(clean, "a.png"), "--viewport", "1440x1000"]);
  await capture(clean, ["plan", "--run", "second-run", "--pool", path.join(clean, "pool.json")]);
  const second = JSON.parse(await readFile(path.join(clean, ".qlander", "design-research", "second-run", "reference-manifest.json"), "utf8"));
  assert.ok(second.references.every((item: { captures: unknown[]; status: string }) => item.captures.length === 0 && item.status === "candidate"));
});

test("[fast] status reports run health and refuses to record an unknown reference", async () => {
  const root = await project();
  await capture(root, ["record", "--run", RUN_ID, "--id", "ref-a", "--outcome", "captured"]);
  await capture(root, ["ingest", "--run", RUN_ID, "--id", "ref-a", "--breakpoint", "desktop", "--file", await png(root, "a.png"), "--viewport", "1440x1000"]);
  const out = (await capture(root, ["status", "--run", RUN_ID])).stdout;
  assert.match(out, /1\s*\/\s*2/);
  assert.match(String(await captureFails(root, ["record", "--run", RUN_ID, "--id", "ref-zzz", "--outcome", "captured"])), /unknown reference/i);
});

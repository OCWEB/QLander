import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { deflateSync } from "node:zlib";
import { findAuditPreviewPort } from "../skills/qlander-audit/scripts/audit-preview-port";

const run = promisify(execFile);
const repo = path.resolve(import.meta.dirname, "..");
const tsx = path.join(repo, "node_modules/.bin/tsx");
const checker = path.join(repo, "scripts/qlander-check.ts");
const auditCli = path.join(repo, "scripts/qlander-audit.ts");

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const name = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return chunk;
}

function minimalPng(width: number, height: number) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 0, 0, 0, 0], 8);
  const rows = Buffer.alloc((width + 1) * height);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(rows)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

async function copyRuntimeFixture() {
  const target = await mkdtemp(path.join(os.tmpdir(), "qlander-audit-resilience-"));
  for (const name of ["content", "data", "public", "src", "scripts", "skills", "astro.config.mjs", "package.json", "pnpm-workspace.yaml", "tsconfig.json", "pnpm-lock.yaml", "qlander.edit-map.json", "qlander.manifest.json"]) {
    await cp(path.join(repo, name), path.join(target, name), { recursive: true });
  }
  await symlink(path.join(repo, "node_modules"), path.join(target, "node_modules"), "dir");
  return target;
}

async function runChecker(root: string, flags: string[]) {
  try {
    const { stdout, stderr } = await run(tsx, [checker, root, ...flags], { cwd: root, maxBuffer: 5_000_000 });
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (error: any) {
    return { code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

test("[fast] audit workflow is resumable and preserves feedback from initialization onward", async () => {
  const skill = await readFile(path.join(repo, "skills/qlander-audit/SKILL.md"), "utf8");
  const feedback = await readFile(path.join(repo, "skills/qlander-audit/references/feedback-template.md"), "utf8");
  for (const pattern of [
    /create `feedback_improve\.md` immediately after.*init/is,
    /discovery checkpoint/i,
    /implementation checkpoint/i,
    /verification checkpoint/i,
    /separate commit/i,
    /call budget/i,
    /time budget/i,
    /resume/i,
    /partial scorecard/i,
    /visual-contract/i,
    /browser-visual-qa/i,
    /expected site ID/i,
    /expected.*title/i
  ]) assert.match(skill, pattern);
  assert.match(feedback, /Checkpoint status/i);
  assert.match(feedback, /not reached/i);
});

test("[fast] design research records short-lived campaign source health and frozen-audit substitutions", async () => {
  const research = await readFile(path.join(repo, "skills/qlander-design-research/SKILL.md"), "utf8");
  const audit = await readFile(path.join(repo, "skills/qlander-audit/SKILL.md"), "utf8");
  assert.match(research, /source-health cache/i);
  assert.match(research, /per-campaign/i);
  assert.match(research, /24 hours/i);
  assert.match(research, /blocked.*substitut/is);
  assert.match(audit, /frozen audit/i);
  assert.match(audit, /do not modify the kit/i);
});

test("[fast] audit preview ports are deterministic and advance when the preferred port is occupied", async () => {
  const first = await findAuditPreviewPort("example.com", { start: 43000, span: 100 });
  const repeat = await findAuditPreviewPort("example.com", { start: 43000, span: 100 });
  assert.equal(repeat, first);

  const server = net.createServer();
  await new Promise<void>((resolve, reject) => server.once("error", reject).listen(first, "127.0.0.1", resolve));
  try {
    const fallback = await findAuditPreviewPort("example.com", { start: 43000, span: 100 });
    assert.notEqual(fallback, first);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("[integration] audit checker distinguishes visual contract from required committed browser evidence", async () => {
  const fixture = await copyRuntimeFixture();
  const missing = await runChecker(fixture, ["--audit", "--json"]);
  assert.notEqual(missing.code, 0);
  const missingJson = JSON.parse(missing.output);
  assert.equal(missingJson.checks.visual, "passed");
  assert.equal(missingJson.checks.visualContract, "passed");
  assert.equal(missingJson.checks.browserVisualQa, "failed");
  assert.match(missing.output, /browser_visual_qa\.(?:manifest_missing|evidence_uncommitted)/);

  await mkdir(path.join(fixture, "docs/screenshots"), { recursive: true });
  const desktop = minimalPng(1280, 720);
  const phone = minimalPng(390, 844);
  await writeFile(path.join(fixture, "docs/screenshots/audit-desktop.png"), desktop);
  await writeFile(path.join(fixture, "docs/screenshots/audit-phone.png"), phone);
  const capture = (filename: string, viewport: { width: number; height: number }, buffer: Buffer) => ({
    route: "/",
    viewport,
    siteId: "site_123",
    pageTitle: "QLander Starter Site",
    previewPort: 4321,
    url: "http://127.0.0.1:4321/",
    filename,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    capturedAt: "2026-07-23T00:00:00.000Z"
  });
  await writeFile(path.join(fixture, "docs/screenshots/manifest.json"), `${JSON.stringify({ version: 1, screenshots: [capture("audit-desktop.png", { width: 1280, height: 720 }, desktop), capture("audit-phone.png", { width: 390, height: 844 }, phone)] }, null, 2)}\n`);
  await run("git", ["init", "-b", "main"], { cwd: fixture });
  await run("git", ["add", "docs/screenshots"], { cwd: fixture });
  await run("git", ["-c", "user.name=QLander Test", "-c", "user.email=test@local.invalid", "commit", "-m", "Add browser evidence"], { cwd: fixture });

  const withEvidence = await runChecker(fixture, ["--audit", "--json"]);
  assert.equal(withEvidence.code, 0, withEvidence.output);
  const evidenceJson = JSON.parse(withEvidence.output);
  assert.equal(evidenceJson.checks.visualContract, "passed");
  assert.equal(evidenceJson.checks.browserVisualQa, "passed");

  const tampered = Buffer.from(desktop);
  tampered[tampered.length - 1] ^= 1;
  await writeFile(path.join(fixture, "docs/screenshots/audit-desktop.png"), tampered);
  const dirty = await runChecker(fixture, ["--audit", "--json", "--skip-build"]);
  assert.notEqual(dirty.code, 0);
  assert.match(dirty.output, /browser_visual_qa\.evidence_uncommitted/);
});

test("audit CLI initializes durable JSON state and enforces clean ordered checkpoints", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "qlander-audit-cli-"));
  await run("git", ["init", "-b", "main"], { cwd: fixture });
  await writeFile(path.join(fixture, "README.md"), "fixture\n");
  await run("git", ["add", "README.md"], { cwd: fixture });
  await run("git", ["-c", "user.name=QLander Test", "-c", "user.email=test@local.invalid", "commit", "-m", "Baseline"], { cwd: fixture });

  const initialized = await run(tsx, [auditCli, "init", "--root", fixture, "--case", "example-com", "--scenario", "clone-look", "--mode", "batch", "--sources", "https://example.com"], { cwd: repo });
  const initState = JSON.parse(initialized.stdout);
  assert.equal(initState.phase, "initialized");
  assert.equal(initState.version, 1);
  assert.match(await readFile(path.join(fixture, "feedback_improve.md"), "utf8"), /qlander-audit-state/);
  assert.match((await run("git", ["log", "-1", "--pretty=%s"], { cwd: fixture })).stdout, /Audit: initialize example-com/);

  await assert.rejects(run(tsx, [auditCli, "checkpoint", "implementation", "--root", fixture], { cwd: repo }), /invalid audit transition/);
  const discovery = await run(tsx, [auditCli, "checkpoint", "discovery", "--root", fixture], { cwd: repo });
  assert.equal(JSON.parse(discovery.stdout).phase, "discovery-complete");
  const status = await run(tsx, [auditCli, "status", "--root", fixture], { cwd: repo });
  assert.equal(JSON.parse(status.stdout).checkpoints.discovery.status, "complete");

  await writeFile(path.join(fixture, "feedback_improve.md"), `${await readFile(path.join(fixture, "feedback_improve.md"), "utf8")}dirty\n`);
  await assert.rejects(run(tsx, [auditCli, "checkpoint", "implementation", "--root", fixture], { cwd: repo }), /uncommitted changes/);
});

test("audit CLI no-commit mode leaves initialization available to test harnesses", async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "qlander-audit-no-commit-"));
  await run("git", ["init", "-b", "main"], { cwd: fixture });
  await writeFile(path.join(fixture, "README.md"), "fixture\n");
  await run("git", ["add", "README.md"], { cwd: fixture });
  await run("git", ["-c", "user.name=QLander Test", "-c", "user.email=test@local.invalid", "commit", "-m", "Baseline"], { cwd: fixture });
  await run(tsx, [auditCli, "init", "--root", fixture, "--case", "no-commit", "--no-commit"], { cwd: repo });
  assert.match((await run("git", ["status", "--porcelain", "--", "feedback_improve.md"], { cwd: fixture })).stdout, /feedback_improve\.md/);
  assert.equal((await run("git", ["rev-list", "--count", "HEAD"], { cwd: fixture })).stdout.trim(), "1");
});

test("[integration] empty blog sentinel prevents glob warnings without creating routes, list items, or sitemap entries", async () => {
  const fixture = await copyRuntimeFixture();
  await rm(path.join(fixture, "content/blog/welcome.md"));
  const manifestFile = path.join(fixture, "qlander.manifest.json");
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  manifest.routes = manifest.routes.filter((route: string) => route !== "/blog/welcome");
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);

  const { stdout, stderr } = await run("pnpm", ["build"], { cwd: fixture, maxBuffer: 5_000_000 });
  assert.doesNotMatch(`${stdout}${stderr}`, /glob\(\) did not match any files/i);
  const listing = await readFile(path.join(fixture, "dist/blog/index.html"), "utf8");
  assert.doesNotMatch(listing, /qlander-empty-blog-sentinel/i);
  await assert.rejects(readFile(path.join(fixture, "dist/blog/qlander-empty-blog-sentinel/index.html"), "utf8"));
  assert.doesNotMatch(await readFile(path.join(fixture, "dist/sitemap.xml"), "utf8"), /qlander-empty-blog-sentinel/i);

  const checked = await runChecker(fixture, ["--json"]);
  assert.equal(checked.code, 0, checked.output);
  assert.doesNotMatch(checked.output, /qlander-empty-blog-sentinel/i);
});

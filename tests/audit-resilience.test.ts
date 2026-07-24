import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { findAuditPreviewPort } from "../skills/qlander-audit/scripts/audit-preview-port";

const run = promisify(execFile);
const repo = path.resolve(import.meta.dirname, "..");
const tsx = path.join(repo, "node_modules/.bin/tsx");
const checker = path.join(repo, "scripts/qlander-check.ts");

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

test("audit workflow is resumable and preserves feedback from initialization onward", async () => {
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

test("design research records short-lived campaign source health and frozen-audit substitutions", async () => {
  const research = await readFile(path.join(repo, "skills/qlander-design-research/SKILL.md"), "utf8");
  const audit = await readFile(path.join(repo, "skills/qlander-audit/SKILL.md"), "utf8");
  assert.match(research, /source-health cache/i);
  assert.match(research, /per-campaign/i);
  assert.match(research, /24 hours/i);
  assert.match(research, /blocked.*substitut/is);
  assert.match(audit, /frozen audit/i);
  assert.match(audit, /do not modify the kit/i);
});

test("audit preview ports are deterministic and advance when the preferred port is occupied", async () => {
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

test("audit checker distinguishes visual contract from required committed browser evidence", async () => {
  const fixture = await copyRuntimeFixture();
  const missing = await runChecker(fixture, ["--audit", "--json"]);
  assert.notEqual(missing.code, 0);
  const missingJson = JSON.parse(missing.output);
  assert.equal(missingJson.checks.visual, "passed");
  assert.equal(missingJson.checks.visualContract, "passed");
  assert.equal(missingJson.checks.browserVisualQa, "failed");
  assert.match(missing.output, /browser_visual_qa\.evidence_missing/);

  await mkdir(path.join(fixture, "docs/screenshots"), { recursive: true });
  await writeFile(path.join(fixture, "docs/screenshots/audit-desktop.png"), "desktop evidence");
  await writeFile(path.join(fixture, "docs/screenshots/audit-phone.png"), "phone evidence");
  await run("git", ["init", "-b", "main"], { cwd: fixture });
  await run("git", ["add", "docs/screenshots/audit-desktop.png", "docs/screenshots/audit-phone.png"], { cwd: fixture });
  await run("git", ["-c", "user.name=QLander Test", "-c", "user.email=test@local.invalid", "commit", "-m", "Add browser evidence"], { cwd: fixture });

  const withEvidence = await runChecker(fixture, ["--audit", "--json"]);
  assert.equal(withEvidence.code, 0, withEvidence.output);
  const evidenceJson = JSON.parse(withEvidence.output);
  assert.equal(evidenceJson.checks.visualContract, "passed");
  assert.equal(evidenceJson.checks.browserVisualQa, "passed");
});

test("empty blog sentinel prevents glob warnings without creating routes, list items, or sitemap entries", async () => {
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

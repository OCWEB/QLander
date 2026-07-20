#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

type Upstream = {
  name: string;
  repository: string;
  ref: string;
  sourcePath: string;
  pinnedCommit: string;
  license: string;
  tracking: "optional-reference" | "vendored";
  reviewDocument: string;
};

const root = path.resolve(process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? ".");
const strict = process.argv.includes("--strict");
const files = await fg("skills/*/references/upstream-*.json", { cwd: root });

if (!files.length) {
  console.log("No tracked skill upstreams found.");
  process.exit(0);
}

let drift = false;
for (const file of files) {
  const config = validate(JSON.parse(await readFile(path.join(root, file), "utf8")), file);
  const current = await lsRemote(config.repository, config.ref);
  const state = current === config.pinnedCommit ? "up to date" : "update available";
  console.log(`${config.name}: ${state}`);
  console.log(`  pinned:  ${config.pinnedCommit}`);
  console.log(`  current: ${current}`);
  if (current !== config.pinnedCommit) {
    drift = true;
    console.log(`  review:  ${config.reviewDocument}`);
  }
}

if (strict && drift) process.exitCode = 2;

function validate(value: unknown, file: string): Upstream {
  if (!value || typeof value !== "object") throw new Error(`${file} must contain an object`);
  const item = value as Record<string, unknown>;
  for (const key of ["name", "repository", "ref", "sourcePath", "pinnedCommit", "license", "tracking", "reviewDocument"]) {
    if (typeof item[key] !== "string" || !item[key]) throw new Error(`${file}: ${key} must be a non-empty string`);
  }
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(String(item.repository))) throw new Error(`${file}: repository must be an HTTPS GitHub repository`);
  if (!/^[0-9a-f]{40}$/.test(String(item.pinnedCommit))) throw new Error(`${file}: pinnedCommit must be a full Git commit SHA`);
  if (!String(item.sourcePath).startsWith("skills/") || String(item.sourcePath).includes("..")) throw new Error(`${file}: sourcePath must stay under skills/`);
  if (!String(item.reviewDocument).startsWith("skills/") || String(item.reviewDocument).includes("..")) throw new Error(`${file}: reviewDocument must stay under skills/`);
  if (!['optional-reference', 'vendored'].includes(String(item.tracking))) throw new Error(`${file}: tracking must be optional-reference or vendored`);
  return item as Upstream;
}

function lsRemote(repository: string, ref: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["ls-remote", repository, ref], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => stdout += chunk);
    child.stderr.on("data", (chunk) => stderr += chunk);
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr.trim() || `git ls-remote exited ${code}`));
      const commit = stdout.trim().split(/\s+/)[0];
      if (!/^[0-9a-f]{40}$/.test(commit)) return reject(new Error(`Unable to resolve ${ref} from ${repository}`));
      resolve(commit);
    });
  });
}

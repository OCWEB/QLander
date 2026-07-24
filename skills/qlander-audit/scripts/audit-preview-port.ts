#!/usr/bin/env node
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PreviewPortOptions = { host?: string; start?: number; span?: number };

export async function findAuditPreviewPort(caseId: string, options: PreviewPortOptions = {}) {
  const host = options.host ?? "127.0.0.1";
  const start = options.start ?? 4300;
  const span = options.span ?? 1000;
  if (!caseId.trim()) throw new Error("case id is required");
  if (!Number.isInteger(start) || !Number.isInteger(span) || start < 1 || span < 1 || start + span > 65536) throw new Error("invalid port range");
  const preferredOffset = hashCaseId(caseId.toLowerCase()) % span;
  for (let attempt = 0; attempt < span; attempt += 1) {
    const port = start + ((preferredOffset + attempt) % span);
    if (await isAvailable(host, port)) return port;
  }
  throw new Error(`no available audit preview port in ${start}-${start + span - 1}`);
}

function hashCaseId(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isAvailable(host: string, port: number) {
  return new Promise<boolean>((resolve) => {
    const server = createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}

async function main() {
  const args = process.argv.slice(2);
  const caseId = valueFor(args, "--case") ?? args.find((arg) => !arg.startsWith("--"));
  if (!caseId) throw new Error("usage: tsx audit-preview-port.ts --case <case-id> [--root <case-repo>]");
  const root = path.resolve(valueFor(args, "--root") ?? ".");
  const host = valueFor(args, "--host") ?? "127.0.0.1";
  const port = await findAuditPreviewPort(caseId, { host });
  const manifest = JSON.parse(await readFile(path.join(root, "qlander.manifest.json"), "utf8"));
  const site = JSON.parse(await readFile(path.join(root, "data/site.json"), "utf8"));
  console.log(JSON.stringify({
    caseId,
    host,
    port,
    url: `http://${host}:${port}/`,
    expectedSiteId: manifest.siteId,
    expectedTitleSuffix: site.name,
    command: `pnpm preview -- --port ${port}`
  }, null, 2));
}

function valueFor(args: string[], flag: string) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

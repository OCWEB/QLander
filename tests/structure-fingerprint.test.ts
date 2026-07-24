import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { parse } from "node-html-parser";
import { DIVERGENCE_MIN, KIT_SECTION_CLASSES, divergence, fingerprint } from "../src/lib/structure-fingerprint";

const fixtures = path.join(import.meta.dirname, "fixtures");
const load = async (name: string) => fingerprint(parse(await readFile(path.join(fixtures, name), "utf8")) as never);

// Fixtures are real built output from the Stage A pilot:
//   core-fallback     the project's content rendered with no handoffs registered
//   bundled-variant   the same content through src/design-variants/* handoffs (v3)
//   research-derived  the same content through a src/design/ page renderer (v4)

test("[fast] the core fallback rendering scores zero divergence", async () => {
  const print = await load("core-fallback-home.html");
  assert.equal(print.sections.length, 7);
  assert.equal(print.kitShapedCount, 7, "every fallback section is a kit component");
  assert.equal(divergence(print), 0);
});

test("[fast] bundled variants do not diverge from the fallback rendering", async () => {
  const print = await load("bundled-variant-home.html");
  const score = divergence(print);
  assert.ok(score < DIVERGENCE_MIN, `bundled-variant design scored ${score}, expected below ${DIVERGENCE_MIN}`);
});

test("[fast] a research-derived page renderer diverges well past the threshold", async () => {
  const print = await load("research-derived-home.html");
  const score = divergence(print);
  assert.ok(score > DIVERGENCE_MIN, `research-derived design scored ${score}, expected above ${DIVERGENCE_MIN}`);
});

test("[fast] the threshold separates the two designs by a wide margin", async () => {
  const bundled = divergence(await load("bundled-variant-home.html"));
  const derived = divergence(await load("research-derived-home.html"));
  assert.ok(derived > bundled * 3, `separation too narrow: bundled ${bundled}, research-derived ${derived}`);
  // The threshold must not sit against either observation.
  assert.ok(DIVERGENCE_MIN - bundled > 0.05 && derived - DIVERGENCE_MIN > 0.05);
});

test("[fast] renaming a bundled variant into src/design/ does not buy divergence", async () => {
  // The failure mode the check exists to catch: provenance metadata is trivially
  // satisfiable, so a renamed variant must still score as the fallback it is.
  const html = await readFile(path.join(fixtures, "bundled-variant-home.html"), "utf8");
  const print = fingerprint(parse(html) as never);
  assert.ok(divergence(print) < DIVERGENCE_MIN);
  // Divergence reads rendered structure only; no manifest field can raise it.
  assert.equal(Object.keys(print).includes("provenance"), false);
});

test("[fast] section edit IDs survive reordering and remain the join key", async () => {
  const fallback = await load("core-fallback-home.html");
  const derived = await load("research-derived-home.html");
  assert.deepEqual([...fallback.order].sort(), [...derived.order].sort(), "reordering must preserve every edit ID");
  assert.notDeepEqual(fallback.order, derived.order, "the research-derived page reorders sections");
});

test("[fast] an empty page cannot fake divergence", () => {
  const print = fingerprint(parse("<main></main>") as never);
  assert.equal(print.sections.length, 0);
  assert.equal(divergence(print), 0);
});

test("[fast] the kit class vocabulary stays in sync with the shipped components", async () => {
  // If a new kit component ships with an unlisted root class, every page using it
  // would read as project-composed and the check would silently weaken.
  const { readdir } = await import("node:fs/promises");
  const repo = path.resolve(import.meta.dirname, "..");
  const missing: string[] = [];
  for (const dir of ["src/components", "src/design-variants"]) {
    for (const file of await readdir(path.join(repo, dir))) {
      // Header and Footer are site chrome rendered outside <main>, so the
      // fingerprint never reaches them and they are not part of the vocabulary.
      if (!file.endsWith(".astro") || file === "Header.astro" || file === "Footer.astro") continue;
      const source = await readFile(path.join(repo, dir, file), "utf8");
      const line = source.split("\n").find((item) => item.includes("data-pp-edit-id"));
      if (!line) continue;
      const literal = line.match(/class="([^"]*)"/)?.[1];
      const list = line.match(/class:list=\{\[\s*"([^"]+)"/)?.[1];
      const rootClass = (literal ?? list ?? "").split(/\s+/).filter(Boolean)[0];
      if (rootClass && !KIT_SECTION_CLASSES.includes(rootClass)) missing.push(`${file}: ${rootClass}`);
    }
  }
  assert.deepEqual(missing, [], `KIT_SECTION_CLASSES is missing shipped component classes: ${missing.join(", ")}`);
});

# Research-Led Layout Workflow Implementation Plan (v3)

> **For Hermes:** Implement in an isolated worktree using the software-development workflow, TDD, and staged review. Stage A is complete. Its findings are already folded into this document; read `spike-report.md` in the pilot before starting Stage B. Do not resume broad site generation until Stage C gates are green.

**Status: all stages complete (2026-07-24).** Implemented on branch `research-led-layout`: B1 `59b8cd9`, B2 `d951a9b`, B3/B4/B5 `ef19b4e`, C1/C2 `ccbab41`, C3/C4 `f8c7344`. Pilot regression in `qlander_tests/qlander_futurafinancial.com-v4` at `54461b5`.

Two plan sections were overturned by measurement during implementation and are corrected in place below: the divergence baseline (section 6) and the assumption that blocked sources are common (section 3). One task changed shape: B2 is an evidence ledger rather than a browser driver, because the kit ships no browser dependency.

**Stage A status: complete (2026-07-24).** Pilot `qlander_tests/qlander_futurafinancial.com-v4`, commit `a00fc48`. Evidence and findings live in `.qlander/design-research/2026-07-24-institutional-modern/spike-report.md`. Every section below marked **[A]** was corrected by measurement, not assumption.

**Goal:** Replace QLander's "populate the built-in frame" workflow with a screenshot-backed, research-led process that extracts layout anatomy from approved inspiration, builds a project-specific layout first, then writes verified content to fit that layout.

**Architecture:** Built-in components stay as blank-mode fallbacks and as implementation primitives. Prompted projects capture private/local reference evidence, convert selected references into a small machine-readable layout blueprint, implement a project-local page renderer from that blueprint, then populate final content. Shared tokens stay authoritative. Motion is deferred until static layout approval.

**Tech stack:** Astro 7, TypeScript, Zod 4, existing QLander CLI/checker, browser screenshots, JSON/Markdown research artifacts, Node test runner.

---

## 0. What v2 changed versus v1

| Problem in v1 | v2 fix |
|---|---|
| A bundled variant copied into `src/design/<slug>/` passes every gate | Add a structural divergence check (section 6) |
| One blocked reference source stalls the whole chain | Candidate pool with explicit rotation policy and attempt budget (section 3) |
| Schema frozen before any real evidence exists | Stage A pilot spike runs first, schema fields derived from it (section 7) |
| Blueprint carries unvalidatable prose fields | Blueprint v1 slimmed to enums plus counts, prose moved to markdown (section 4) |
| Every new rule is a hard failure on day one | Three-tier severity ladder with a staged rollout switch (section 5) |
| No way back if prompted mode becomes unshippable | `design.gate` escape hatch honored by checker and skills (section 5) |

## 0b. What Stage A measurement changed versus v2 **[A]**

| v2 assumption | What the pilot measured | Fix |
|---|---|---|
| Divergence is measured against the **starter baseline** | Starter vs bundled-variant v3 scored 0.7746, starter vs research-derived v4 scored 0.7672. Indistinguishable, and v4 scored *lower* | Compare each project against **its own content rendered with handoffs disabled**. v3 = 0.0476, v4 = 0.3429, a 7.2x separation. Threshold 0.20 (section 6) |
| Blocked sources are the expected case | 4 of 4 attempted captures succeeded, 0 rotations. sofi.com, recorded 403 in v2/v3, captured on the first attempt via a real browser context | Browser-context capture is materially more reliable than the fetch path. Keep the fallback ladder, stop treating it as the common path (section 3) |
| A consent wall is a rotation trigger | Two consent walls appeared (wealthfront, rocketmortgage). Neither blocked content. Rotating would have discarded two good references | Consent walls are a capture *quality* problem. New outcome `captured-obstructed`, never rotates (section 3) |
| `primitive` enum covers the needed moves | The pilot's single most important research-derived move, lifting licensing into a full-bleed band under the hero, had no enum value | Add `proof-band` (section 4) |
| A `factList` slot can be populated from existing content | Deriving facts by regex-splitting the licensing paragraph broke on "Futura Financial Inc." and "3230 E. Imperial Hwy", emitting fragments that read as false statements about a regulated business | Drop `factList` from v1. Renderers must never parse prose into structure (section 4) |
| Slot line/character targets are reasonable guidance | The hero headline target of 3 lines rendered as 5. Correct response was to revise the blueprint, not shrink type | Confirms targets must never gate. Notice tier at most (section 4) |
| Mobile assertions can use window resize | `resize_page` silently floors at roughly 500px. Requesting 390x844 produced a 500px viewport and a false pass | Mobile capture and assertions must use viewport **emulation** (section 3, Task B2) |
| Fingerprint fields all carry signal | `headingPattern` never moved (content dictates it). `hasList` and `hasDisclosure` never moved independently | Drop `headingPattern`. Discriminating fields are `classShape`, `mediaFirst`, section `order`, `childBucket` (section 6) |

## 1. Target workflow

```text
approved site brief and verified facts
→ assemble a reference candidate pool (5 to 8 sources)
→ capture reference screenshots at desktop/mobile, rotating past blocked sources
→ select and approve a visual direction from at least 2 successful captures
→ extract composition, hierarchy, geometry, and responsive behavior
→ synthesize an original project-specific layout blueprint
→ build the layout skeleton with placeholders/content slots
→ approve static layout (human, screenshot-backed)
→ write verified copy to fit those slots
→ add authorized imagery and final tokens
→ desktop/mobile visual QA
→ record optional subtle motion in todo_motion-polish.md
```

The workflow must not return to:

```text
site brief → populate starter JSON → select a bundled variant → call it designed
```

## 2. Non-negotiable rules

- Explicit blank mode may continue using the built-in starter unchanged.
- Prompted mode may use built-in components as implementation primitives, but its primary page composition must be research-derived and project-local.
- Bundled `src/design-variants/*` renderers may accelerate prototyping but cannot independently satisfy design completion.
- Reference screenshots are evidence, not reusable site assets.
- Adapt principles from multiple references. Do not clone a source's distinctive trade dress, code, copy, branding, or imagery.
- `data/theme.json` stays authoritative for semantic colors and radius.
- `data/design-system.json` stays authoritative for typography, spacing, widths, component treatment, imagery treatment, and motion policy.
- Final copy stays source-backed. "Fit the layout" means editing length, hierarchy, grouping, and labels, not inventing claims.
- Static composition is approved before motion work begins.
- Existing generated projects are never destructively migrated.
- No capture step may bypass robots directives, paywalls, logins, or bot controls. A blocked source is recorded and rotated past, never worked around.

## 3. Reference sourcing and rotation policy **[A]**

Capture is the step with the most external dependencies. Stage A measured a 100 percent success rate over 4 attempts with 0 rotations, so blocked sources are **not** the common case when capturing through a real browser context. Build the rotation machinery because it is cheap and the failure is otherwise total, but do not over-invest in the fallback ladder.

**Capture through a browser context, never a fetch.** The v2 and v3 runs recorded sofi.com, land-book.com, lapa.ninja, and uiverse.io as 403. Stage A captured sofi.com on the first attempt. The sites did not change; the access method did. Any research path that concludes "blocked" from a fetch must retry through the browser before recording it.

### Candidate pool

Research proposes a **pool of 5 to 8 candidate sources** per direction before any capture runs, ranked by relevance. The pool is written to `reference-manifest.json` up front with `status: "candidate"`. Capture then walks the pool in rank order.

### Rotation rules

- **Target:** 2 successful captures minimum, 4 maximum, per direction.
- **Attempt budget:** at most 8 capture attempts per run. Exceeding the budget ends the run with a `research.capture_budget_exhausted` notice, not a crash.
- **Per-source timeout:** 25s desktop, 25s mobile. Timeout counts as `unavailable`, rotate immediately.
- **Rotate on:** HTTP 4xx/5xx, navigation timeout, bot-challenge/captcha interstitial, blank or near-blank render (page text under 200 characters), or a title/identity mismatch against the expected host.
- **Do not rotate on:** a slow but succeeding load (retry once with a longer settle delay), or **a consent wall**. Stage A found two consent walls that obstructed the capture without blocking content. Rotating on them would have discarded two good references. Attempt one dismissal, then record the outcome as `captured-obstructed` and keep the reference.
- **Never** synthesize, mock, or substitute a screenshot for a rotated source.
- Every attempt is recorded, including failures. The manifest is an audit log, not a success list.
- Stop at `maxSuccesses` and mark the untouched remainder `skipped-satisfied`. That is a healthy run and must not be reported the same way as `skipped-budget`, which is exhaustion.

### Fallback ladder

When the pool is exhausted without 2 successful captures, fall back in this order and record which rung was used:

1. **User-supplied screenshots** via `--input <local-image>`. First-class path, not a consolation prize. The agent should ask for these as soon as 3 consecutive rotations fail.
2. **Partial evidence:** 1 successful capture plus 1 user-supplied. Allowed, direction proceeds.
3. **Text-only research with explicit user approval.** Records `researchException: { approvedBy, approvedAt, reason }` in the manifest. Produces a permanent `research.text_only_exception` warning on every subsequent check. Never silently upgraded to a pass.
4. **Abort the direction** and propose a different one.

Rungs 3 and 4 require the user in the loop. Rungs 1 and 2 do not.

### Capture implementation notes **[A]**

Stage A established the working path: chrome-devtools `take_screenshot` with `filePath`, plus `emulate` for the viewport.

- Capture viewport-sized images at the stated widths, not full-page, so geometry comparisons stay meaningful.
- **Set the viewport with emulation, never with window resize.** `resize_page` silently floors at roughly 500px wide: requesting 390x844 yields a 500px viewport and any mobile assertion made against it is a false pass. Use a device viewport string (`390x844x3,mobile,touch`). This applies to Task B2 capture and to every mobile assertion in Task C3 and D3.
- `take_screenshot` refuses any path outside the configured workspace root. In real use the command runs with `--root .` inside the project, so this is fine, but B2 must resolve and assert its output path against the project root explicitly rather than assuming.
- Attempt one consent-banner dismissal using a small selector allowlist. If a banner survives, record `captured-obstructed` and keep the capture. Only mark `blocked` when content itself is unreachable.
- Settle: wait for network idle or 3s, whichever is first, then a fixed 500ms paint delay.
- Verify identity before accepting: response host matches the requested host, and page title is non-empty.
- Hash every accepted image with sha256.
- Screenshots never enter `public/`, `dist/`, or Git by default. Verified in the pilot: 0 PNGs tracked.

## 4. Artifact model

```text
content/design-research.md
.qlander/design-research/<research-run-id>/
  reference-manifest.json
  layout-blueprint.json
  reference-board.html
  references/
    <reference-id>-desktop.png
    <reference-id>-mobile.png
src/design/<direction-slug>/
  HomePage.astro
  components/
    ...
todo_motion-polish.md
```

### Screenshot retention policy

- Add `.qlander/design-research/**/references/` to `.gitignore` by default.
- Keep captured public-site screenshots local and out of `dist`, `public/`, and Git history.
- Commit only manifests, source URLs, hashes, observations, and original schematic abstractions.
- Permit committed screenshots only when user-supplied or explicitly authorized.
- `reference-board.html` uses local evidence and is never published by the Astro build.

### `reference-manifest.json`

```json
{
  "version": 1,
  "researchRunId": "2026-07-24-institutional-modern",
  "direction": "Institutional Modern",
  "attemptBudget": 8,
  "attemptsUsed": 5,
  "researchException": null,
  "references": [
    {
      "id": "ref-a",
      "rank": 1,
      "sourceUrl": "https://example.com/direct-page",
      "status": "captured",
      "reviewedAt": "2026-07-24T10:14:02.000Z",
      "attempts": [
        { "at": "2026-07-24T10:14:02.000Z", "outcome": "captured" }
      ],
      "viewport": { "width": 1440, "height": 1000 },
      "captures": [
        { "breakpoint": "desktop", "localPath": "references/ref-a-desktop.png", "sha256": "..." },
        { "breakpoint": "mobile", "localPath": "references/ref-a-mobile.png", "sha256": "..." }
      ],
      "surface": "homepage hero",
      "rights": "inspiration-only",
      "observations": ["left-aligned copy", "media occupies right column"]
    },
    {
      "id": "ref-b",
      "rank": 2,
      "sourceUrl": "https://blocked.example/page",
      "status": "blocked",
      "attempts": [
        { "at": "2026-07-24T10:14:31.000Z", "outcome": "bot-challenge" }
      ],
      "captures": [],
      "rights": "inspiration-only",
      "observations": []
    }
  ]
}
```

Statuses: `candidate`, `captured`, `user-supplied`, `blocked`, `unavailable`, `skipped-satisfied`, `skipped-budget`. **[A]** `skipped-satisfied` (target met, remainder untouched) and `skipped-budget` (attempts exhausted) must stay distinct; conflating them misreports run health.

Attempt outcomes: `captured`, `captured-obstructed`, `http-error`, `timeout`, `bot-challenge`, `blank-render`, `identity-mismatch`. **[A]** `captured-obstructed` is a success with an overlay present and never triggers rotation.

### `layout-blueprint.json` (v1, deliberately small)

Only fields a machine can validate. Everything descriptive lives in `content/design-research.md`.

```json
{
  "version": 1,
  "researchRunId": "2026-07-24-institutional-modern",
  "direction": "Institutional Modern",
  "pages": [
    {
      "route": "/",
      "renderer": "src/design/institutional-modern/HomePage.astro",
      "referenceIds": ["ref-a", "ref-c"],
      "sections": [
        {
          "id": "home.hero",
          "role": "hero",
          "primitive": "split-media-right",
          "responsive": "stack-copy-first",
          "slots": [
            { "id": "home.hero.headline", "kind": "headline", "targetLines": 3 },
            { "id": "home.hero.body", "kind": "body", "targetCharacters": 180 }
          ]
        }
      ]
    }
  ]
}
```

**Validated enums (v1):** **[A]**

- `role`: `hero`, `index`, `proof`, `guidance`, `detail`, `faq`, `cta`.
- `primitive`: `full-bleed-centered`, `split-media-left`, `split-media-right`, `offset-editorial`, `grid-cards`, `stacked-rows`, `list-disclosure`, `proof-band`, `banded-cta`.
- `responsive`: `stack-copy-first`, `stack-media-first`, `reflow-grid`, `collapse-to-list`, `unchanged`.
- `slot.kind`: `eyebrow`, `headline`, `body`, `microcopy`, `action`, `cardList`, `stepList`, `qaList`.

`proof-band` was added from pilot evidence. It was the single most important research-derived move in the pilot (licensing lifted into a full-bleed band directly under the hero, where every reference places a metric band) and no v1 enum value described it.

`factList` was **removed** from `slot.kind`. The pilot tried to populate it by splitting a licensing paragraph on a sentence regex; it broke on "Futura Financial Inc." and "3230 E. Imperial Hwy" and emitted fragments that read as false statements about a regulated business. **A renderer must never derive structure by parsing prose.** A real fact list needs a structured content shape that `richText` cannot carry. Revisit only from evidence, as a `PageSectionSchema` addition, not as a renderer trick.

`targetLines` and `targetCharacters` are editing guidance. They never fail a check; a notice at most. Confirmed necessary: the pilot's hero headline target of 3 lines rendered as 5, and the correct response was to revise the blueprint, not shrink type. As a gate this would have been a false failure on the first real page.

Fields still deferred out of v1, all confirmed unnecessary during the pilot: `silhouette`, `contentRhythm`, `mediaGeometry`, `adaptationNotes`, `requiredFacts`, `optionalFacts`. Adaptation reasoning reads fine as a renderer comment plus research markdown.

## 5. Severity ladder and rollout stages

The checker gains a third informational channel alongside its existing errors and warnings.

| Tier | Channel | Effect on exit code | Use for |
|---|---|---|---|
| `notice` | `notices[]` | none | Guidance, slot target drift, budget exhaustion, rotation summaries |
| `warning` | `warnings[]` | none, sets check status to `warning` | Recoverable gaps, text-only exception, legacy provenance, single-reference directions |
| `error` | `errors[]` | exit 1 | Contract violations, unsafe paths, schema failures, missing renderer once enforcing |

### Rollout switch

Add `design.gate` to the manifest design block: `"off" | "warn" | "enforce"`, defaulting to `"warn"` for new prompted projects and `"off"` for existing ones on migration. Environment override `QLANDER_DESIGN_GATE` for CI experiments.

- `off`: research rules emit notices only. This is the escape hatch. Prompted generation keeps working exactly as it does today.
- `warn`: research rules emit warnings. `pnpm qlander:check` still exits 0. This is the default while Stage B lands.
- `enforce`: research rules emit errors. Flipped on per project only after the Stage A pilot and the v4 regression pilot both pass.

Rules that are **always errors regardless of gate**, because they are safety not policy: unsafe paths, path traversal, schema parse failures, screenshots found in `public/` or `dist/`, a renderer referenced in the manifest that does not exist on disk.

## 6. Structural divergence check **[A]**

This is the gate that makes the rest of the plan mean something. Provenance metadata alone is trivially satisfiable by renaming a bundled variant.

### The starter-baseline method does not work

Stage A tested the v2 method and it failed:

| Comparison | Distance |
|---|---|
| starter vs v3 (bundled variants) | 0.7746 |
| starter vs v4 (research-derived) | 0.7672 |

Indistinguishable, and the research-derived page scored marginally *lower*. The comparison is dominated by content differences (4 sections versus 7, entirely different section IDs) and carries no signal about design.

### Corrected method: handoffs-disabled baseline

Compare the project's actual `/` against **the same project's content rendered with both handoff registries empty**. That holds content fixed and isolates composition.

| Comparison | Distance |
|---|---|
| v3 (bundled variants) vs its own core-fallback render | **0.0476** |
| v4 (research-derived) vs its own core-fallback render | **0.3429** |

A 7.2x separation on exactly the failure mode the check exists to catch. Bundled variants are, as suspected, structurally near-identical to the core fallback.

**Threshold: 0.20.** Roughly midway on a log scale, far from both observed values. Confirmed against the shipped static implementation: 0.0 fallback, 0.0 bundled, 0.536 research-derived.

**Cost the v2 plan did not budget, and how it was resolved.** The baseline is not a shipped fixture; it must be produced per project. A second full build per check was too slow to run by default. **Resolution shipped in C2:** the same signal is computed statically without any second build. The fallback rendering is made entirely of the kit's own components, so a section whose root element carries a kit class is a section the project did not compose. Measured on the pilot fixtures: core fallback 0.0, bundled variants 0.0, research-derived 0.536. The separation is wider than the two-build method produced, and `tests/structure-fingerprint.test.ts` keeps the class vocabulary in sync with the shipped components so the check cannot silently weaken.

**Fingerprint fields**, narrowed by what actually discriminated in the pilot:

- Ordered list of section edit IDs, and section count.
- Per section: `classShape` (sorted class list), `mediaFirst` (media precedes first heading in source order), `childBucket` (bucketed element child count).
- Dropped: `headingPattern`, which never moved because content dictates it. `hasList` and `hasDisclosure` never moved independently of `classShape`; keep only if they earn it later.

Distance is `0.4 * fieldPenalty + 0.4 * orderPenalty + 0.2 * countPenalty`, normalized to [0,1]. Working prototype: `fingerprint-prototype.mjs` in the pilot research directory.

**Section IDs must survive reordering.** The whole comparison depends on it, and reordering sections while preserving edit IDs is the core research-derived operation. State this explicitly in Task B4.

**Explicit boundaries:**

- This measures *difference from the project's own fallback rendering*, not originality, not quality, not visual similarity to references.
- Ship as a notice, promote to warning after the D1 regression, to error only after that passes on a second project.
- False positives are expected and acceptable at notice/warning tier. That is why it does not start as an error.
- A legitimate design that scores low can record `design.divergenceWaiver` with a reason. The waiver is visible in check output, not silent.

## 7. Implementation stages

### Stage A: pilot spike first (no production code) — **COMPLETE**

**Task A1: Manual Futura v4 spike** — done 2026-07-24, pilot commit `a00fc48`, no QLander core changes.

Delivered: a 6-source candidate pool, 4 captures with a full attempt log, a hand-written `layout-blueprint.json`, a research-derived `src/design/institutional-modern/HomePage.astro` serving `/`, verified Futura content populated into it, and a working fingerprint prototype.

All four required outputs landed and are folded into sections 0b, 3, 4, and 6 above:

1. **Capture rate:** 4 of 4 attempted, 0 rotations, 2 consent walls that did not block content.
2. **Blueprint fields:** confirmed sufficient, minus `factList`, plus `proof-band`.
3. **Divergence:** starter-baseline method disproved; handoffs-disabled method measured at 0.0476 (bundled) versus 0.3429 (research-derived); threshold 0.20.
4. **Friction:** blueprint-before-renderer works; renderer owns composition and delegates leaf rendering; delegated components carry an alignment seam; `resize_page` produces false mobile passes.

Artifacts: `.qlander/design-research/2026-07-24-institutional-modern/` in the pilot (`spike-report.md`, `reference-manifest.json`, `layout-blueprint.json`, `pool.json`, `fingerprint-prototype.mjs`). Reference PNGs are local and gitignored; 0 are tracked.

### Stage B: build the workflow (warn tier only)

**Task B1: Research evidence and layout blueprint schemas**

- Files: modify [src/lib/schemas.ts](src/lib/schemas.ts), test [tests/qlander.test.ts](tests/qlander.test.ts).
- Add `ResearchAttemptSchema`, `ResearchReferenceSchema`, `ResearchManifestSchema`, `LayoutBlueprintSchema`, `BlueprintPageSchema`, `BlueprintSectionSchema`, `BlueprintSlotSchema`.
- Extend `LayoutHandoffSchema` with `provenance: "core-fallback" | "bundled-variant" | "research-derived" | "legacy-unknown"`, optional `blueprintId`, optional `referenceIds`.
- Add `gate: z.enum(["off","warn","enforce"]).default("warn")` and optional `divergenceWaiver` to `DesignManifestSchema`.
- All new manifest fields optional so existing manifests keep parsing. Add explicit legacy-compatibility tests.
- TDD: failing tests for a valid research-derived handoff, then rejection tests for unsafe renderer paths, unknown provenance, unknown enum values, and a research-derived handoff with fewer than 2 reference IDs. Then implement. Then `pnpm test:fast`.
- Commit: `Add research evidence and layout blueprint schemas`

**Task B2: Reference capture command with rotation**

- Files: create `scripts/qlander-design-capture.ts`, modify [package.json](package.json), modify [scripts/qlander-init.ts](scripts/qlander-init.ts), test `tests/design-capture.test.ts`.

```bash
pnpm qlander:design:capture -- \
  --root . \
  --run <run-id> \
  --pool pool.json \
  --desktop 1440x1000 \
  --mobile 390x844 \
  --target-successes 2 \
  --attempt-budget 8
```

Single-source and user-supplied forms:

```bash
pnpm qlander:design:capture -- --root . --run <run-id> --id <ref-id> --url <direct-url>
pnpm qlander:design:capture -- --root . --run <run-id> --id <ref-id> --input ./local.png --breakpoint desktop
```

- Write the full candidate pool to the manifest as `status: "candidate"` before the first navigation.
- Walk in rank order, applying the section 3 rotation rules. Stop at `--target-successes` (marking the remainder `skipped-satisfied`) or at budget exhaustion (`skipped-budget`).
- Record every attempt with its outcome. Hash accepted images. Never fabricate.
- **Set viewports by emulation, not window resize.** **[A]** `resize_page` floors at roughly 500px, so a `--mobile 390x844` run would silently capture at 500px and every downstream mobile assertion would be a false pass. Assert the realized viewport width equals the requested width before accepting a capture, and fail loudly if it does not.
- Refuse unsafe URLs and any output path outside the run directory. **[A]** Resolve the output path against the project root explicitly; the underlying screenshot tool enforces its own workspace root and will reject paths the command considers valid.
- Consent banners: one dismissal attempt from a small selector allowlist, then record `captured-obstructed` and keep the capture. Never rotate on a consent wall.
- Initialize `.qlander/design-research/` and the `.gitignore` rule during prompted init.
- Tests: pool ordering and rotation, `skipped-satisfied` versus `skipped-budget`, budget exhaustion is a clean exit, blocked-source recording, `captured-obstructed` does not rotate, realized-viewport assertion catches a floored resize, hash verification, unsafe URL/path refusal, user-supplied ingestion, no leakage of a prior run's files into a new run, screenshots never written under `public/` or `dist/`.
- Commit: `Add design reference capture with source rotation`

**Task B3: Screenshot-backed research templates**

- Files: modify [skills/qlander-design-research/SKILL.md](skills/qlander-design-research/SKILL.md), modify [skills/qlander-design-research/references/design-research-template.md](skills/qlander-design-research/references/design-research-template.md), create `skills/qlander-design-research/references/layout-extraction-template.md`, modify [tests/qlander.test.ts](tests/qlander.test.ts).
- Require the candidate pool to be proposed before capture, and a compact reference board per direction.
- Require direct source URL, desktop/mobile evidence when available, observed surface, rights status, and transferable layout principles.
- Document the rotation and fallback ladder so the agent asks for user-supplied screenshots at the right moment rather than grinding.
- Layout-extraction table covering: page silhouette, alignment and grid, section anatomy, media geometry, hierarchy, density and whitespace, responsive transformation, interaction, anti-copy adaptation. This is prose, deliberately kept out of the blueprint JSON.
- Preserve existing source-health and blocked-source rules.
- Commit: `Make QLander research screenshot-backed`

**Task B4: Layout approval before content population**

- Files: modify [skills/qlander-discovery/SKILL.md](skills/qlander-discovery/SKILL.md), modify [skills/qlander-design/SKILL.md](skills/qlander-design/SKILL.md), modify [docs/qlander-start.md](docs/qlander-start.md), modify [docs/agent-playbook.md](docs/agent-playbook.md), modify [AGENTS.md](AGENTS.md), test [tests/qlander.test.ts](tests/qlander.test.ts).
- Sequence: discovery approves facts/sitemap/actions/inventory → research captures and compares → design writes `layout-blueprint.json` plus a static renderer skeleton → human approves the silhouette → population writes verified content into slots → design completes tokens, imagery, responsive behavior, QA.
- Prompted mode does not begin from populated starter pages.
- **Reordering sections must preserve their edit IDs.** **[A]** Reordering while keeping IDs stable is the core research-derived operation, and the Task C2 comparison depends on it entirely.
- **Renderers must never derive structure by parsing prose.** **[A]** If the blueprint wants a structured slot, the content must supply structure. See the section 4 `factList` finding.
- Placeholder slot text is allowed only during the prototype and must be visibly marked non-final.
- Copy editors may shorten, group, or reprioritize verified facts. They may not invent proof.
- If real content cannot fit accessibly, revise the blueprint rather than shrinking text.
- Commit: `Make layout approval precede content population`

**Task B5: Research-derived primary page renderer**

- Files: modify [skills/qlander-design/references/layout-handoff-recipe.md](skills/qlander-design/references/layout-handoff-recipe.md), modify [src/layout-handoffs.ts](src/layout-handoffs.ts) docs/comments, modify [skills/qlander-design/SKILL.md](skills/qlander-design/SKILL.md), test [tests/resource-cli-init.test.ts](tests/resource-cli-init.test.ts), test [tests/qlander.test.ts](tests/qlander.test.ts).
- Keep `src/design-variants/*` as prototyping aids and state plainly that they do not satisfy prompted completion alone.
- Require a primary page renderer under `src/design/<direction-slug>/` for `/`.
- The renderer may compose generic content primitives while owning page silhouette, section relationships, responsive transformations, and media geometry. **[A]** Confirmed workable: the pilot delegated FAQ and the program index to shared components and still produced a materially different page in roughly 380 lines.
- **[A]** Note the alignment seam: `ProductGrid` centers its heading while a left-aligned research-derived page surrounds it. Either make alignment inheritable in the delegated components, or document that the design layer must override it. Do not leave it to be rediscovered per project.
- Every design renderer cites blueprint and reference IDs in manifest metadata.
- Preserve edit IDs, structured content, SEO, accessibility, and route contracts.
- Commit: `Require research-derived primary page renderers`

### Stage C: enforcement, calibrated by the pilot

**Task C1: Checker research gates**

- Files: modify [scripts/qlander-check.ts](scripts/qlander-check.ts), modify [src/lib/schemas.ts](src/lib/schemas.ts), test [tests/qlander.test.ts](tests/qlander.test.ts), test [tests/resource-cli-init.test.ts](tests/resource-cli-init.test.ts).
- Add the `notices[]` channel and `addNotice()` alongside the existing error/warning arrays. Include notices in JSON output. Notices never change exit code or check status.
- Add `resolveGate()` reading `design.gate`, `QLANDER_DESIGN_GATE`, and defaulting per creation mode. A helper `addGated(code, message)` routes to notice/warning/error by gate tier.

Gated conditions, all routed through `addGated`:

- Reference manifest or layout blueprint missing for a prompted project.
- Fewer than 2 successful or user-supplied references for the active direction.
- Text-only research without a recorded approved exception.
- Evidence hashes do not match local captures when captures are present.
- Blueprint direction disagrees with research, design system, or manifest.
- The primary `/` experience has no `research-derived` page renderer.
- All registered handoffs point to `src/design-variants/*` or core fallbacks.
- Blueprint renderer/route/reference IDs disagree with the manifest.

Always errors regardless of gate:

- Renderer path listed in the manifest does not exist on disk.
- Unsafe or traversing paths anywhere in research artifacts.
- Reference screenshots present under `public/` or `dist/`.
- Schema parse failure on any research artifact that exists.

Boundaries: validate contracts and provenance only. Do not claim to score originality or visual quality. Human screenshot approval stays a separate gate. Legacy projects get notices, explicit blank projects stay valid and untouched.

- Commit: `Enforce research-led layout completion behind a gate`

**Task C2: Structural divergence check**

- Files: modify [scripts/qlander-check.ts](scripts/qlander-check.ts), create `src/lib/structure-fingerprint.ts`, create `tests/structure-fingerprint.test.ts`, add HTML fixtures captured from the pilot.
- Port `fingerprint-prototype.mjs` from the pilot research directory. It already works against real built output.
- **[A] Resolve the baseline-production question first.** The baseline is the project's own content rendered with both handoff registries empty. It is not a shipped fixture and cannot be one. Options: a build-time flag that empties the registries, or an in-process render of the fallback path. A second full build per check is the naive option and is likely too slow to run by default. **Do not start C2 until this is decided.**
- Threshold constant `DIVERGENCE_MIN = 0.20`, with a comment citing the pilot measurement (0.0476 bundled, 0.3429 research-derived, run `2026-07-24-institutional-modern`).
- Fingerprint fields per section 6: section order and count, `classShape`, `mediaFirst`, `childBucket`. No `headingPattern`.
- Ships at notice tier. Promote per section 6.
- Honor `design.divergenceWaiver` and print it in check output when applied.
- Tests: a page versus itself scores 0; the v3 bundled-variant fixture scores below 0.20; the v4 research-derived fixture scores above 0.20; the starter-baseline comparison is *not* used; waiver suppresses the finding but appears in output.
- Commit: `Add structural divergence check against the fallback baseline`

**Task C3: Layout-first visual review**

- Files: create `skills/qlander-design/references/layout-review-checklist.md`, modify [skills/qlander-audit/SKILL.md](skills/qlander-audit/SKILL.md), modify `skills/qlander-audit/references/feedback-template.md`, test [tests/audit-resilience.test.ts](tests/audit-resilience.test.ts).
- Evidence set: built-in baseline screenshot, selected reference board, layout skeleton desktop/phone before final copy, populated final desktop/phone.
- Human questions: is the silhouette visibly derived from approved principles rather than the starter, does content fit without tiny type or clipping or filler, are reference influences traceable without reproducing trade dress, does mobile preserve hierarchy rather than merely stacking, are edit/SEO/route/accessibility contracts preserved.
- **[A] Mobile evidence must come from viewport emulation.** A screenshot taken after a window resize to 390 is actually 500 wide and will pass checks the real device fails.
- Commit: `Add layout-first visual review evidence`

**Task C4: Compatibility and migration**

- Files: modify [scripts/qlander-migrate.ts](scripts/qlander-migrate.ts), modify [qlander.manifest.json](qlander.manifest.json), modify [package.json](package.json), test [tests/migration.test.ts](tests/migration.test.ts).
- Bump the template contract version after the schema and checker changes.
- Migration labels existing handoffs `provenance: "legacy-unknown"` and sets `design.gate: "off"`. It never claims they are research-derived.
- Never auto-create evidence, blueprints, or reference IDs.
- Existing sites stay buildable and get a notice before their next prompted redesign.
- Commit: `Add research-layout contract migration`

### Stage D: regression and release

**Task D1: Controlled v4 regression**

- Baseline `../qlander_tests/qlander_futurafinancial.com-v2`, current `-v3`, pilot `-v4`.
- Fixed inputs: same approved facts and routes, same Institutional Modern direction, same token palette unless blueprint approval changes it explicitly, same candidate pool.
- Re-run v4 through the *implemented* Stage B and C tooling rather than by hand, and confirm the tooling reproduces what the spike did manually.
- Compare v2, v3, v4 at 1440px and 390px.
- Acceptance: v4 does not use a bundled variant as its primary renderer, FAQ stays fixed, no horizontal overflow at 390px, no invented rates/metrics/testimonials/guarantees/credentials, divergence score above threshold, human review confirms the board materially influenced composition.

**Task D2: Motion deferral**

- Create `todo_motion-polish.md` in each designed project after static layout approval. No motion during the first layout synthesis pass.

```markdown
# Motion polish TODO

- [ ] Stagger hero copy/media reveal with CSS only.
- [ ] Add subtle image scale/opacity transition on section entry.
- [ ] Add FAQ icon state transition.
- [ ] Add button press feedback at scale(0.96).
- [ ] Confirm every effect is disabled by prefers-reduced-motion.
- [ ] Verify no layout shift and no animation-dependent meaning.
```

Motion stays optional, `none` or `subtle`. Cinematic behavior is reserved for Scroll World.

- Commit: `Document deferred premium motion pass`

**Task D3: Release gate**

From QLander core:

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm qlander:check && git diff --check
```

From the pilot:

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm qlander:check -- --audit
```

Also verify:

- Reference screenshots absent from `dist/`, `public/`, and Git unless authorized.
- Blank initialization still shows the starter with zero new warnings.
- Prompted initialization stays pending until evidence, blueprint, renderer, and approval exist.
- A bundled-only fixture fails prompted completion at `enforce` and warns at `warn`.
- A research-derived fixture passes at all three gate tiers.
- `design.gate: "off"` reproduces today's exact behavior on an existing project.
- Desktop and true 390px captures match the expected site ID and title.
- `document.documentElement.scrollWidth === innerWidth` at 390px.

## 8. Success criteria

- Design research returns visual evidence and layout extraction, not only prose.
- Blocked sources rotate cleanly and are recorded honestly, and no run stalls on a single unreachable site.
- Prompted work begins from an approved layout blueprint rather than the starter frame.
- Final content is written to fit approved slots while preserving factual integrity.
- The primary page uses a research-derived project renderer that measurably diverges from the starter.
- Bundled variants alone cannot mark a prompted design implemented.
- The checker verifies provenance, contracts, and structural divergence without pretending to judge originality.
- Every new rule ships as a notice or warning first and is promoted to an error only after pilot evidence.
- Human screenshot review confirms visible research influence at desktop and mobile.
- Motion is deferred until static layout and content are approved.
- Blank mode and existing projects remain byte-stable at `design.gate: "off"`.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| A bundled variant is renamed into `src/design/` and passes | Structural divergence check against the project's own handoffs-disabled render, threshold 0.20 measured in the pilot |
| Copyrighted screenshots enter a public repository | Captures stay local and ignored, commit only authorized images and derived schematic data |
| Reference sources block automation | Candidate pool, rotation policy, attempt budget, user-supplied fallback, never bypass controls |
| Capture failures block the entire workflow | Fallback ladder ends in an approved text-only exception, gated to warn, never silently upgraded |
| Layout becomes a clone | Require 2+ references, adaptation notes in prose, anti-copy review in the audit checklist |
| Content distorted to fit | Preserve verified facts, revise layout when copy cannot fit accessibly |
| Blueprint over-engineered | v1 is enums plus counts only, fields added only from Stage A pilot evidence |
| Divergence check produces false positives | Ships as a notice, waiver mechanism is explicit and visible, promoted only after the regression |
| Checker claims subjective originality | Automated checks limited to files, hashes, provenance, routes, renderer contracts, and structural distance from the starter |
| Mobile becomes an afterthought | Require desktop/mobile evidence and an explicit responsive enum per blueprint section |
| Prompted mode becomes unshippable mid-migration | `design.gate: "off"` escape hatch restores current behavior |
| Motion distracts from structural work | Deferred to `todo_motion-polish.md` after static approval |

## 10. Delivery order

1. **Stage A** manual Futura v4 spike. Produces the capture success rate, the confirmed blueprint field list, and the divergence threshold. Nothing else starts until this reports.
2. **Stage B** schemas, capture command with rotation, research templates, workflow sequencing, renderer requirement. All at `warn` tier.
3. **Stage C** checker gates, structural divergence check, audit review, migration.
4. **Stage D** tooling-driven v4 regression, motion TODO, release gate. Flip `design.gate` to `enforce` per project only after D1 passes.

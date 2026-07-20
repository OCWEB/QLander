# Upstream: oso95/scroll-world

## Policy

QLander vendors and customizes `https://github.com/oso95/scroll-world` under
`skills/scroll-world/`. The pinned commit is the upstream comparison base. QLander's
manual slow-queue additions, scoped `scroll-section` mode, eager-poster loading, and
route-dot alignment fix are intentionally local and must be preserved during an upstream review.

The machine-readable pin is [upstream-scroll-world.json](upstream-scroll-world.json). Run:

```bash
pnpm skills:check-upstream
```

Use `-- --strict` in CI when upstream drift should fail the command.

## Vendored files and local policy

- `skills/scroll-world/SKILL.md`
- `skills/scroll-world/LICENSE`
- `skills/scroll-world/agents/openai.yaml`
- `skills/scroll-world/references/index-template.html`
- `skills/scroll-world/references/knockout.py`
- `skills/scroll-world/references/pipeline.md`
- `skills/scroll-world/references/prompts.md`
- `skills/scroll-world/references/scrub-engine.js`
- `skills/scroll-world/references/manual-queue.md`
- `skills/scroll-world/references/qlander-adapter.md`
- `skills/scroll-world/references/queue-template.md`
- `skills/scroll-world/references/queue-template.json`
- `skills/scroll-world/references/scripts/ingest.sh`
- `skills/scroll-world/references/scripts/register-qlander-experience.mjs`
- `skills/scroll-world/references/scripts/seam-qa.sh`
- `skills/scroll-world/references/scripts/walkthrough.py`

The runtime references, pipeline, prompts, and base `SKILL.md` derive from upstream.
QLander modifies `SKILL.md`, supplies its own agent metadata, adds the manual queue plus
the multi-page route/section adapter and registration script, and patches the scrub
runtime with scoped sticky-section mode, eager posters, and zero route-dot button padding.
Manual queue is the default generation mode once the user approves a Scroll World page.
Automated/API generation is opt-in. Scroll World itself remains an opt-in page
experience and does not change normal QLander pages.

## Review and update procedure

1. Run `pnpm skills:check-upstream` and record the reported current commit.
2. Create a temporary review checkout and compare the pinned commit with upstream `main`:

   ```bash
   review_dir=$(mktemp -d)
   git clone --filter=blob:none https://github.com/oso95/scroll-world.git "$review_dir/scroll-world"
   git -C "$review_dir/scroll-world" diff 2912048246d057cdfe134dfc0b4dfb7e6a12f30e..origin/main -- LICENSE README.md skills/scroll-world
   ```

3. Review changes in this order: license, scrub runtime safety/accessibility, content contract, provider assumptions, generation prompts, then pipeline scripts.
4. Compare upstream `skills/scroll-world/` with QLander's vendored
   `skills/scroll-world/`. Port reviewed upstream changes file by file; never replace the
   directory wholesale.
5. Preserve the manual-queue default, scoped `scroll-section` mode, eager poster loading,
   zero-padding route-dot alignment, `manual-queue.md`, `queue-template.md`,
   `queue-template.json`,
   `qlander-adapter.md`, `references/scripts/`, QLander handoff rules, and
   `agents/openai.yaml` unless a
   deliberate QLander change supersedes them.
6. Keep the upstream MIT license with the vendored skill.
7. Update `pinnedCommit` only after review, add a review-log entry below, validate all
   three QLander skills, then run build, typecheck, tests, and `qlander:check`.

## Review log

| Reviewed | Upstream commit | Result |
|---|---|---|
| 2026-07-18 | `2912048246d057cdfe134dfc0b4dfb7e6a12f30e` | Initial pin. Optional reference only; no upstream runtime or Higgsfield pipeline vendored. |
| 2026-07-19 | `2912048246d057cdfe134dfc0b4dfb7e6a12f30e` | Vendored the reviewed skill and runtime. Added QLander's default manual slow queue, local ingest/QA/preview scripts, and preserved paid/API generation as opt-in. |
| 2026-07-19 | `2912048246d057cdfe134dfc0b4dfb7e6a12f30e` | Added the QLander internal-route adapter, generic experience renderer, safe registration command, and multi-page regression contract. |
| 2026-07-19 | `2912048246d057cdfe134dfc0b4dfb7e6a12f30e` | Preserved eager poster loading and zero-padding route-dot alignment as protected QLander runtime fixes; added regression coverage. |
| 2026-07-19 | `2912048246d057cdfe134dfc0b4dfb7e6a12f30e` | Added scoped `scroll-section` placement, sticky local-scroll runtime, registration workflow, and route-preservation regression coverage. |

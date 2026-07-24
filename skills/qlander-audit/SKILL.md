---
name: qlander-audit
description: Use when a QLander kit maintainer asks to field-test the kit against realistic site requests (redesign, clone-the-look, migration) for one or many sites to collect friction and improvement feedback. Kit-internal; never use inside a detached site project, and never use it to build a site someone will actually launch.
---

# QLander Audit

Simulate a real owner's request end to end, grade the kit, and leave durable evidence in each disposable test project. This skill is excluded from detached project copies on purpose.

## Audit case inputs

Each case needs a lowercased reference-domain `case id`, a `redesign` or `clone-look` scenario, its approved sources, and optional owner context. Clone-look cases use a fictional subject and never impersonate the reference business.

## Directory and freeze contract

- Create a new sibling `qlander_<case id>` only through `pnpm qlander:init`; never reuse or clean an existing directory.
- The case is its own git repository. Do not edit or commit the kit repository during an audit run.
- Record the kit SHA at initialization. That SHA is the frozen audit subject. If friction reveals a kit fix, log it in feedback; do not modify the kit, replace files from another checkout, or restart against a newer SHA during the frozen audit.

## Immediate durable feedback

Create `feedback_improve.md` immediately after init, before discovery or web research, with the executable helper. It copies [references/feedback-template.md](references/feedback-template.md), embeds versioned machine-readable JSON state, fills case metadata, marks every scorecard row `not reached`, and commits `Audit: initialize <case id>` by default:

```bash
pnpm qlander:audit init --root ../qlander_<case-id> --case <case-id> \
  --scenario <redesign|clone-look> --mode <batch|interactive> --sources <url>
```

Use `--no-commit` only in automated tests. If any later phase fails or exhausts its budget, preserve and commit the partial scorecard instead of losing the run.

## Resumable checkpoints and budgets

Run each phase from the last committed checkpoint. To resume, read `feedback_improve.md`, `git status`, and `git log`; do not repeat completed source calls or overwrite evidence.

Set a call budget and time budget in the feedback file before work starts. Defaults per case are 30 external research/browser calls and 45 elapsed minutes, with no more than 12 calls or 15 minutes in discovery. Stop at the first exhausted budget, record the incomplete result and next action, preserve the partial scorecard, and commit the checkpoint.

Each checkpoint is a separate commit. Follow this sequence:

1. **Discovery checkpoint:** follow `AGENTS.md`, `docs/qlander-start.md`, and bundled discovery exactly. Record and commit the approval package and source ledger, then run `pnpm qlander:audit checkpoint discovery --root <case-repo>` for the separate durable checkpoint commit.
2. **Implementation checkpoint:** after approval, run design research when requested, populate, run design, and commit the work and current feedback. Then run `pnpm qlander:audit checkpoint implementation --root <case-repo>`.
3. **Verification checkpoint:** run the CLI visual-contract and all required checks, perform browser-visual-qa, save and commit evidence, and complete and commit the scorecard. Then run `pnpm qlander:audit checkpoint verification --root <case-repo>`. Never combine these three checkpoint commits.

Use `pnpm qlander:audit status --root <case-repo>` to read the embedded state as JSON. The checkpoint helper refuses out-of-order transitions and refuses to overwrite dirty `feedback_improve.md`.

Batch mode self-approves with [references/owner-proxy-rules.md](references/owner-proxy-rules.md); interactive mode stops at the approval gate.

## Source health during a campaign

Keep a short-lived per-campaign source-health cache in orchestrator memory or campaign notes, not in the frozen kit. Entries contain URL/host, checked time, `healthy | blocked | unavailable`, reason, and substitute. Expire after 24 hours and recheck on a later campaign. When a selected source blocks access, do not log in or evade it: choose a relevant substitute from the same source pool and record both URLs in the source ledger and feedback. A blocked source is evidence, not permission to modify the kit during a frozen audit.

## Preview identity and browser evidence

Allocate a deterministic available per-case port from the kit checkout:

```bash
pnpm exec tsx skills/qlander-audit/scripts/audit-preview-port.ts \
  --case <case-id> --root ../qlander_<case-id>
```

Use the returned preview command and URL. Before accepting any browser evidence, parse the loaded page's `<title>` and compare its suffix with `expectedTitleSuffix`; parse `<meta name="qlander-site-id">` and compare it with the helper's expected site ID. Also verify the browser URL uses the returned port. A page from another case, title mismatch, site-ID mismatch, error document, or stale server invalidates the capture.

Save PNG screenshots under `docs/screenshots/` and add each to the version 1 `docs/screenshots/manifest.json`. Every entry must contain `route`, `viewport.width`, `viewport.height`, `siteId`, `pageTitle`, `previewPort`, `url`, `filename`, lowercase `sha256`, and ISO `capturedAt`. The filename is a basename relative to `docs/screenshots/`. Commit the manifest and every listed PNG. Record the observed result in feedback.

At least one capture must be desktop width (1024px or wider) and one must be phone width (480px or narrower). The checker verifies clean/tracked state, declared site and route, URL route and port, SHA-256, and actual PNG IHDR dimensions. Filename labels are not evidence.

## Validation semantics

- `pnpm qlander:check` performs deterministic **visual-contract** checks over built HTML. It does not prove rendering in a browser.
- `pnpm qlander:check -- --audit` adds separate **browser-visual-qa** evidence validation. Audit mode requires a committed structured manifest and its committed desktop and phone PNGs; missing, dirty, inconsistent, corrupt, or tampered evidence is a failure, never a pass.
- Run build, typecheck, tests, and audit-mode `qlander:check`. Record exact commands and outputs.

## Hard limits

No deploys, host/DNS config, image generation, reference-asset downloads, or third-party tool installs. Keep the site draft/noindex. Clone-look content never contains reference copy, claims, branding, or names outside provenance notes.

Two run-time guardrails that are easy to violate:

- Environment noise is not a finding. A globally installed hook (for example an Impeccable design hook) may fire on the case repo's edits and suggest commands. Ignore its suggestions in batch mode and note it only if it blocks progress.
- `pnpm qlander:init` writes only inside the target directory. If the kit working tree appears dirty during a run, it is a concurrent maintainer session, not your run; never revert or commit kit files to "clean up".

## Grading rubric

Grade each dimension `pass`, `warn`, `fail`, or `not reached`, with one evidence line: approval gate, fact integrity, copy provenance, diff scope, validation, design contract, visual contract, and browser visual QA. Validation passes only when required commands pass; browser visual QA passes only with identity-verified, committed desktop and phone evidence.

## Batch runs

Cases are independent and may run in parallel. Aggregate scorecards and recurring friction, linking each `feedback_improve.md` and reporting how many cases hit each item.

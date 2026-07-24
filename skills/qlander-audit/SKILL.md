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

Create `feedback_improve.md` immediately after init: as soon as `pnpm qlander:init` returns, before discovery or web research, copy [references/feedback-template.md](references/feedback-template.md). Fill case metadata, mark every scorecard row `not reached`, set the checkpoint status to `initialized`, and commit it as `Audit: initialize <case id>`. If any later phase fails or exhausts its budget, update and commit this partial scorecard instead of losing the run.

## Resumable checkpoints and budgets

Run each phase from the last committed checkpoint. To resume, read `feedback_improve.md`, `git status`, and `git log`; do not repeat completed source calls or overwrite evidence.

Set a call budget and time budget in the feedback file before work starts. Defaults per case are 30 external research/browser calls and 45 elapsed minutes, with no more than 12 calls or 15 minutes in discovery. Stop at the first exhausted budget, record the incomplete result and next action, preserve the partial scorecard, and commit the checkpoint.

1. **Discovery checkpoint:** follow `AGENTS.md`, `docs/qlander-start.md`, and bundled discovery exactly. Record the approval package and source ledger, update checkpoint status, then make a separate commit `Audit: discovery <case id>`.
2. **Implementation checkpoint:** after approval, run design research when requested, populate, and run design. Update friction and grades reached so far, then make a separate commit `Audit: implement <case id>`.
3. **Verification checkpoint:** run the CLI visual-contract and all required checks, perform browser-visual-qa, save evidence, complete the scorecard, then make a separate commit `Audit: verify <case id>`. Never combine these three checkpoint commits.

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

Save non-empty desktop and phone screenshots with `desktop` and `phone` (or `mobile`) in their filenames under `docs/screenshots/`, commit them, and record route, viewport, title, site ID, port, and observed result in feedback.

## Validation semantics

- `pnpm qlander:check` performs deterministic **visual-contract** checks over built HTML. It does not prove rendering in a browser.
- `pnpm qlander:check -- --audit` adds **browser-visual-qa** evidence validation. Audit mode requires committed desktop and phone screenshots; missing evidence is a failure, never a pass.
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

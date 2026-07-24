---
name: qlander-audit
description: Use when a QLander kit maintainer asks to field-test the kit against realistic site requests (redesign, clone-the-look, migration) for one or many sites to collect friction and improvement feedback. Kit-internal; never use inside a detached site project, and never use it to build a site someone will actually launch.
---

# QLander Audit

Simulate a real owner's request end to end, grade how the kit performed, and leave a reviewable feedback file in each test project. The kit is the test subject; the generated site is disposable evidence.

This skill is excluded from `pnpm qlander:init` copies on purpose. If you are inside a detached site project, stop; this skill is not for you.

## Audit case inputs

Each case needs:

- `case id`: the reference domain, lowercased (example: `ocwebfirm.com`).
- `scenario`: `redesign` (owner's real site is the source) or `clone-look` (a site the owner likes is a style reference only).
- `sources`: for redesign, the official URL. For clone-look, the reference URL plus a fictional business brief supplied in the case; clone-look cases must never impersonate the reference business or use a real third-party business as the subject.
- optional owner context: contact info, tone, profile override (default `marketing-site`), and whether a finished design pass is requested.

## Directory contract

- Each case gets its own sibling directory named `qlander_<case id>` (example: `../qlander_branch.io`). It must not already exist; never reuse or clean a dirty directory.
- Create it only via `pnpm qlander:init` from the kit repo. It becomes its own git repository; all case commits happen there. Never commit, push, or edit anything in the kit repo during an audit run.

## Run protocol (per case)

1. Act as the site owner's coding agent. Follow the kit's own `AGENTS.md`, `docs/qlander-start.md`, and bundled skills exactly as written; do not use maintainer knowledge to shortcut them. Everything confusing, missing, contradictory, or broken goes into the friction log with evidence.
2. Run discovery to the combined approval gate. In batch mode (the default), self-approve as the owner proxy using [references/owner-proxy-rules.md](references/owner-proxy-rules.md) and record the full approval package in the feedback file. In interactive mode (maintainer says they want to approve), stop and present the package.
3. After approval: when the case requested finished design, run `qlander-design-research` before population; then populate, run `qlander-design`, run `pnpm qlander:check`, and commit inside the case repo.
4. Hard limits: no deploys, no host or DNS config, no image generation (annotated placeholders plus prompt docs only), site stays draft/noindex, no downloads of reference-site assets, and clone-look content never contains the reference site's copy, claims, branding, or name outside brief provenance notes.

## Grading rubric

Grade each dimension pass, warn, or fail, with one line of evidence:

| Dimension | Pass means |
|---|---|
| Approval gate | Population started only after the gate (proxy or maintainer) |
| Fact integrity | No invented facts, proof, pricing, or contact details; gaps marked |
| Copy provenance | Redesign: owner-site facts only. Clone-look: zero lifted sentences or branding |
| Diff scope | Only `content/`, `data/`, `public/images/` changed, plus kit-mandated bookkeeping (`qlander.manifest.json`, `qlander.edit-map.json`, `data/route-seo.json`, `docs/qlander-run.md`, init profile artifacts) and sanctioned developer-mode edits that followed `AGENTS.md` rules |
| Validation | `pnpm qlander:check` green with only the expected draft warning; typecheck and tests pass |
| Design contract | Theme follows the design-skill recipe with measured contrast ratios; template-tier edits only when sanctioned |

## Feedback file

Before the final case commit, write `feedback_improve.md` at the case repo root from [references/feedback-template.md](references/feedback-template.md) and commit it. Every friction item gets `Decision: pending`; the maintainer later marks each `pass` (won't fix) or `implement`. Do not implement kit improvements during an audit run; the feedback files are the deliverable.

## Batch runs

Cases are independent: run one agent per case, in parallel when the environment supports it. The orchestrator aggregates every case's scorecard and top friction items into one summary for the maintainer and links each `feedback_improve.md`. Recurring items across cases are the strongest implement candidates; say in the summary how many cases hit each item.

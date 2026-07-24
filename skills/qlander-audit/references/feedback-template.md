# Feedback template

Copy this structure into `feedback_improve.md` at the case repo root immediately after initialization. Keep it plain Markdown; no em or en dashes. Preserve it at every checkpoint, even when a run fails.

`pnpm qlander:audit init` prepends a `qlander-audit-state` HTML comment containing versioned JSON. Do not edit or remove that machine-readable block by hand; `checkpoint` updates it and `status` reads it.

```markdown
# QLander Audit Feedback: <case id>

- Date: <YYYY-MM-DD>
- Scenario: <redesign | clone-look>
- Sources: <official or reference URL>
- Kit commit audited: <frozen kit SHA>
- Baseline commit: <case repo init commit>
- Mode: <batch | interactive>
- Checkpoint status: initialized | discovery-complete | implementation-complete | verification-complete | blocked
- Last checkpoint commit: <SHA or pending>
- Resume next action: <specific next action>
- Call budget: <used>/<limit>
- Time budget: <elapsed>/<limit>

## Scorecard

Use `not reached` until evidence exists. Never delete grades already reached.

| Dimension | Grade | Evidence |
|---|---|---|
| Approval gate | not reached | Discovery has not reached the gate |
| Fact integrity | not reached | Population has not started |
| Copy provenance | not reached | Population has not started |
| Diff scope | not reached | Population has not started |
| Validation | not reached | Verification has not run |
| Design contract | not reached | Design phase has not run |
| Visual contract | not reached | CLI visual-contract has not run |
| Browser visual QA | not reached | Browser evidence has not been captured |

## Checkpoint ledger

| Checkpoint | Status | Commit | Calls/time | Evidence or blocker |
|---|---|---|---|---|
| Initialization | complete | <SHA> | <value> | Feedback created before research |
| Discovery | pending | - | - | - |
| Implementation | pending | - | - | - |
| Verification | pending | - | - | - |

## Source ledger

| URL | Checked | Health | Evidence | Substitute |
|---|---|---|---|---|
|  |  | healthy/blocked/unavailable |  |  |

## Browser evidence ledger

Structured capture metadata and hashes live in `docs/screenshots/manifest.json`; this table records the human QA result.

| Route | Viewport | Manifest entry | Result |
|---|---|---|---|
|  | width x height | docs/screenshots/manifest.json |  |

## Friction items

One section per item, ordered by severity.

### F1: <short title>

- Area: <docs | schema | scripts | skills | template | checker>
- Severity: <high | medium | low>
- Evidence: <file, command, or reproducible output>
- Suggested fix: <smallest kit change>
- Decision: pending

## Approval appendix

<Full approval package plus owner-proxy rules applied in batch mode.>
```

Rules:

- `Decision` starts as `pending`; maintainers later set `pass`, `implement`, or `done` with a kit commit.
- Evidence names the file, command, URL, or output.
- On failure or budget exhaustion, update checkpoint status, resume action, partial scorecard, and friction before committing.

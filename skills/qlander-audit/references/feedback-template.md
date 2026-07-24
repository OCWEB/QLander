# Feedback template

Copy this structure into `feedback_improve.md` at the case repo root. Keep it plain Markdown; no em or en dashes.

```markdown
# QLander Audit Feedback: <case id>

- Date: <YYYY-MM-DD>
- Scenario: <redesign | clone-look>
- Sources: <official or reference URL>
- Kit commit audited: <kit repo commit hash>
- Baseline commit: <case repo init commit>
- Population commit: <case repo population commit; the final commit is the one adding this file>
- Mode: <batch | interactive>

## Scorecard

| Dimension | Grade | Evidence |
|---|---|---|
| Approval gate | pass/warn/fail | <one line> |
| Fact integrity | pass/warn/fail | <one line> |
| Copy provenance | pass/warn/fail | <one line> |
| Diff scope | pass/warn/fail | <one line> |
| Validation | pass/warn/fail | <one line> |
| Design contract | pass/warn/fail or n/a | <one line> |

## Friction items

One section per item, ordered by severity (high, medium, low).

### F1: <short title>

- Area: <docs | schema | scripts | skills | template | checker>
- Severity: <high | medium | low>
- Evidence: <what happened, file or command involved>
- Suggested fix: <smallest kit change that removes the friction>
- Decision: pending

## Approval appendix

<The full approval package presented at the gate, plus which owner-proxy
rules were applied in batch mode.>
```

Rules:

- `Decision` starts as `pending` for every item. The maintainer later sets `pass` (won't fix), `implement`, or `done` with the kit commit that fixed it.
- Evidence must be reproducible: name the file, command, or output, not just an impression.
- If a run fails partway, still write the file with the scorecard graded as far as reached and the failure as a high-severity item.

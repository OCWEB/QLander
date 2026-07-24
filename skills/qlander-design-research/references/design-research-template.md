---
status: proposed
lastReviewed: YYYY-MM-DD
researchRunId: YYYY-MM-DDTHH-MM-SSZ
sourceMix: []
siteBrief: content/site-brief.md
selectedDirection: ""
approvedAt: ""
---

# Design research

## Design problem

- Audience:
- Primary action:
- Brand personality:
- Content and page-shape constraints:
- Accessibility and responsive requirements:
- User likes, dislikes, and supplied references:

## Source scope

State what the user authorized: supplied materials, official sites, named local paths, and/or broader public design research.

## Source mix

- Research run ID:
- Relevant shipped sites:
- Visual-discovery sources:
- Component-pattern sources:
- Typography/editorial sources:
- Blocked or skipped sources and replacements:
- Source-health cache checked at (entries expire after 24 hours):
- Difference from recent runs:

## Capture evidence

- Reference manifest: `.qlander/design-research/<run-id>/reference-manifest.json`
- Candidates planned / attempts used / budget:  /  / 
- Successful captures (target 2, max 4):
- Attempt outcome tally (captured, captured-obstructed, http-error, timeout, bot-challenge, blank-render, identity-mismatch):
- Remainder status (`skipped-satisfied` is a healthy stop, `skipped-budget` is exhaustion):
- Fallback rung used, if any (user-supplied / partial / approved text-only exception / direction aborted):
- Text-only exception approver, timestamp, and reason (leave blank unless rung 3 was used):

Captures live under `references/` in the run directory and are gitignored. Commit an image only when the user supplied or authorized it.

## Design token invariants

Mark each item `locked` or `provisional`.

- Color roles and approved hex values:
- Radius and shape language:
- Typography commitments:
- Spacing and density character:
- Motion policy:
- Imagery character:
- Explicitly approved rebrand hypotheses, if any:

All directions below must use the same locked invariants. Variation belongs in layout, hierarchy, components, and art direction rather than silent token changes.

## Existing-site findings

For redesigns only:

- Preserve:
- Repair:
- Remove:

## Reference inventory

Repeat for each source:

### Reference: [Name](https://example.com/direct-page)

- Reviewed: YYYY-MM-DD
- Observed surface: exact page, section, or component
- Evidence: concise factual observations
- Transferable principles:
- Fit to brief:
- Accessibility/responsive/performance risks:
- Asset rights: inspiration-only | license-needs-review | user-authorized
- Capture status: captured | captured-obstructed | user-supplied | blocked | unavailable | skipped-satisfied | skipped-budget
- Evidence files and hashes (desktop / mobile), or the recorded reason there are none:

## Aesthetic families

Create 3–5 genuinely different directions.

### Direction A — Name

- Vocabulary:
- Structural idea:
- Hero and page-body treatment:
- Typography and color character:
- Imagery and motion implications:
- Supporting references:
- Why it fits:
- Main trade-offs:

## Direction scorecard

Score 1–5 and explain important differences.

| Direction | Audience fit | Distinctiveness | Conversion clarity | Content fit | Accessibility | Responsive feasibility | Performance | QLander effort |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A |  |  |  |  |  |  |  |  |

## Recommendation

- Recommended direction:
- Why:
- Acceptable fallback:
- Design hypotheses requiring a prototype:

## Design-system handoff

Translate the selected direction into one consistent site-wide contract before implementation.

- `data/theme.json`: approved color roles and radius:
- `data/design-system.json`: display/body/label families and weights, type rhythm, spacing base, section rhythm, content/reading widths, surface/image/button treatment, and motion policy:
- Locked brand tokens preserved:
- Approved changes from provisional research:
- Cross-page rules that every custom renderer must consume:

## Layout extraction

Complete the table in `references/layout-extraction-template.md` for each proposed direction and paste it here, including the mandatory anti-copy row. A direction without a layout-extraction table is not ready for approval.

## Layout handoff plan

Prompted work must materially replace starter composition. The primary `/` renderer must be a project-local, research-derived page renderer under `src/design/<direction-slug>/`. A bundled `src/design-variants/*` renderer is a prototyping aid and does not satisfy completion on its own; token, copy, image, or section-order changes alone do not qualify.

| Kind | Page route or section edit ID | Project-local renderer | Structural difference from starter | Preserved content/edit contracts |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Project-specific anti-goals

- Avoid:
- Preserve:
- Do not copy or reuse without authorization:

## Run history

Keep the latest three prior runs so repeated research can avoid the same mix.

| Research run ID | Source mix summary | Selected direction | Outcome |
| --- | --- | --- | --- |
|  |  |  |  |

## Approval

- Status: proposed
- Selected direction:
- User changes:
- Approved at:

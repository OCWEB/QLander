# Site brief template

Create `content/site-brief.md` with this structure. Replace bracketed instructions; do not leave fake facts.

```markdown
---
kind: qlander-site-brief
lastReviewed: YYYY-MM-DD
sourceMode: website | local | written-brief | combined
officialUrl: ""
status: proposed | approved
---

# Site brief

## Sources

- User context: [short description]
- Local context: [explicit paths only]
- Official sources: [direct links]
- Broader web sources: [approved links or “Not used”]

## Verified identity and contact

| Fact | Value | Status | Source |
|---|---|---|---|
| Name | ... | verified | ... |

## Audience, offers, and positioning

| Item | Draft | Status | Source |
|---|---|---|---|

## Products and services

| Name | Summary | Status | Source |
|---|---|---|---|

## Proof and claims

| Claim or proof | Status | Source | Usage constraint |
|---|---|---|---|

## Voice and visual direction

- Tone: ...
- Palette/logo: ...
- Existing authorized assets: ...
- Proposed art direction: ...

## Proposed sitemap and page experiences

| Route | Purpose | Primary action | Experience | Source/assumption |
|---|---|---|---|---|
| / | ... | ... | standard | ... |

Allowed experience values: `standard`, `focused-landing`, `image-scroll`, `scroll-world`.

## Image plan

| Prompt ID | Placement | Purpose | Aspect ratio | Strategy | Status |
|---|---|---|---|---|---|

Strategies: `authorized-existing`, `codex-generate`, `magnific-generate`, `magnific-enhance`, `placeholder`.

## Unresolved questions

- ...

## Approval

- Key facts: pending | approved
- Sitemap and experiences: pending | approved
- Image plan: pending | approved
```

The file is not part of an Astro content collection and must not be added to the public route manifest. It may be committed to Git, so keep it public-safe and credential-free.

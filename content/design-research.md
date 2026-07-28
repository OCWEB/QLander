---
kind: qlander-design-research
status: approved
selectedDirection: Connected growth with clarity
lastReviewed: 2026-07-24
---

# Design research

## Origin

Proposed. Nothing was supplied: no brand system, Figma file, or page built
elsewhere. The direction answers to the approved facts in
[content/site-brief.md](site-brief.md), reviewed 2026-07-24:

- Category: mobile linking, measurement, and attribution platform.
- Audience: enterprise growth, marketing, product, data, and developer teams.
- Core promise: connect customer journeys and make campaign impact measurable.
- Primary conversion: request a demo.

No brand asset, logo, screenshot, or customer material was downloaded or reused.

## Token invariants

All values below are locked as of this approval. Previous starter values were
provisional.

| Token | Value | State |
|---|---|---|
| `colors.ink` | `#10142b` | locked |
| `colors.paper` | `#f7f8fc` | locked |
| `colors.muted` | `#5a6180` | locked |
| `colors.accent` | `#2c4be0` | locked |
| `colors.accentDark` | `#1b31a6` | locked |
| `radius` | 4 | locked |
| `typography.displayFamily` | Newsreader, Georgia, serif | locked |
| `typography.bodyFamily` / `labelFamily` | Work Sans, ui-sans-serif, system-ui, sans-serif | locked |
| `spacing.sectionY` | 96 | locked |
| `spacing.contentGap` | 24 | locked |
| `layout.contentMax` | 1200 | locked |
| `layout.readingMax` | 70 | locked |
| `components` | bordered surface, framed image, solid-outline button | locked |
| `motion` | subtle | locked |

`data/theme.json` stays authoritative for color and radius,
`data/design-system.json` for typography, spacing, widths, components, and
motion. Renderers hardcode none of them.

## The direction

Structure: a full-bleed hero banner opening the landing page, then the existing
starter sections inside the standard content width. The banner is the only
gradient surface on the site.

Hierarchy: one uppercase label-scale eyebrow, one display-scale H1 in the serif
display face, one subhead at 1.15x body, then a paired primary and secondary
call to action. The visual sits beside the copy at 900px and above, below it on
phones.

Density: generous. 96px section rhythm and a 70ch reading measure keep enterprise
copy calm rather than dense.

Imagery character: framed, restrained, product-and-data oriented. Until Branch
supplies approved assets, the banner renders the annotated QLander placeholder so
the gap stays obvious.

Motion policy: CSS-only. A short staggered rise on the banner copy and visual,
plus a 1px button lift on hover. The whole block sits inside
`@media (prefers-reduced-motion: no-preference)`. No animation runtime, no client
JavaScript.

Typography note: the two families are the OFL-licensed variable fonts already
bundled in `public/fonts/`, self-hosted through `@font-face` in
`src/layouts/BaseLayout.astro`. No font CDN link or `@import` was added. Space
Grotesk was considered and rejected as an over-used face; Newsreader carries the
institutional, measurement-oriented tone better.

## Accessibility and responsiveness

Measured contrast ratios:

| Pair | Ratio | Minimum |
|---|---|---|
| ink `#10142b` on paper `#f7f8fc` | 17.3:1 | 7:1 |
| accent `#2c4be0` on paper `#f7f8fc` | 6.2:1 | 4.5:1 |
| white on accent `#2c4be0` | 6.5:1 | 4.5:1 |
| accentDark `#1b31a6` on paper | 9.9:1 | 4.5:1 |

Banner text and buttons render paper-on-accent gradient; the darkest point of the
gradient is `accentDark`, so every banner pair stays at or above 6.5:1. The
layout is a single column at 360px and a two-column grid from 900px. Exactly one
`h1` per page, alt text required on any supplied hero image, no new routes, and
visible focus outlines on both banner buttons.

## Anti goals

- No second hue. `accentDark` is the same hue stepped darker.
- No gradient outside the hero banner or the primary CTA.
- No emoji icons, no stock photography standing in for Branch brand imagery.
- No client JavaScript in the banner.
- No copying Branch's composition, wording, or trade dress; copy here is written
  for this site.
- No unsupported certification badges or customer logos until rights are
  confirmed.

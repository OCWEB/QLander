# Layout extraction template

Complete one table per proposed direction. This is the artifact `qlander-design` turns into `layout-blueprint.json`. Prose about a reference is not layout extraction.

Fill it from the captured screenshots, not from memory of the site and not from its marketing copy. Every row is an observation you can point at in an image.

## Direction: <name>

Evidence: `.qlander/design-research/<run-id>/reference-manifest.json`
References used: `<ref-a>`, `<ref-b>` (at least two, independently captured)

| Dimension | What to record | ref-a | ref-b | Transferable principle |
|---|---|---|---|---|
| Page silhouette | The shape of the whole page at 1440. Where does it widen, narrow, band, or break? | | | |
| Alignment and grid | Left, centered, or asymmetric. Column count and how it changes per section. | | | |
| Section anatomy | Order and role of each section. What sits directly under the hero? | | | |
| Media geometry | Boxed, bled, offset, cropped, overflowing. Position relative to copy. | | | |
| Hierarchy | Eyebrow, headline, body, action order. Type scale jumps. Where the eye lands second. | | | |
| Density and whitespace | Dense, sparse, or alternating. Where the page breathes and where it compresses. | | | |
| Responsive transformation | What actually changes below 900 and 560. Does hierarchy survive, or does everything just stack? | | | |
| Interaction | Disclosure, sticky elements, hover states. Only what is visible in evidence. | | | |
| Anti-copy adaptation | What you will deliberately NOT reproduce, and what replaces it. | | | |

## The anti-copy row is mandatory

Every reference will contain something you cannot use. Name it and name the substitute.

The most common case: reference sites fill the band under the hero with metrics ("$110B+ funded", "4.20% APY"). A project with no published metrics, rates, or testimonials cannot reproduce that band. The correct move is substitution, not omission: carry licensing, credentials, or scope facts in the same structural position. That substitution is the research-derived design decision. Record it here so the renderer and the reviewer both know it was deliberate.

## Mapping to blueprint enums

Translate the table into `layout-blueprint.json` using only these values. If an observation has no matching enum, say so in the research file rather than inventing a value; the enum grows from evidence.

- `role`: `hero`, `index`, `proof`, `guidance`, `detail`, `faq`, `cta`
- `primitive`: `full-bleed-centered`, `split-media-left`, `split-media-right`, `offset-editorial`, `grid-cards`, `stacked-rows`, `list-disclosure`, `proof-band`, `banded-cta`
- `responsive`: `stack-copy-first`, `stack-media-first`, `reflow-grid`, `collapse-to-list`, `unchanged`
- `slot.kind`: `eyebrow`, `headline`, `body`, `microcopy`, `action`, `cardList`, `stepList`, `qaList`

There is no `factList` slot kind. A renderer must never derive structure by parsing prose: splitting a paragraph on sentence boundaries mangles abbreviations ("Futura Financial Inc.", "3230 E. Imperial Hwy") into fragments that read as false statements. If a section needs structured facts, the content must supply structure.

## Slot targets

Record `targetLines` and `targetCharacters` as guidance for the copy pass. They never gate a check, and they are expected to move once real content lands. When approved copy cannot fit the target accessibly, revise the blueprint rather than shrinking type.

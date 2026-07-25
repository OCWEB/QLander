---
name: qlander-prototype
description: Measure layout geometry from the qlander-prototyper catalog, or derive a section sequence for a page that has no design to port. Use when you need proportions grounded in measured reference layouts rather than guessed. Produces a layout blueprint and edit-map entries; never writes copy.
---

# QLander Prototype

A measuring tool, not a designer. It has two uses, and the first is the common one.

## Use 1: measure geometry

Given a reference preview, return its real proportions. The catalog's own
`patternFamily` is derived from text fields and never looks at the image.
Measured against pixels, 27% of `split` sections are not two-column, 18% of
`grid` are not multi-column, and 7 of 11 `timeline` sections do not alternate.

`node/measure.ts` in the prototyper wraps `engine/geometry.ts`:

```bash
cd <prototyper>
npx tsx -e 'import("./node/measure.js").then(async m => console.log(await m.measurePreview("<file.png>")))'
```

Trust `mediaColumns` and `alternating`. Treat `columns` as directional only: it
merges tight-gapped panels and cannot locate a divider. Measure any rule or spine
position directly at full resolution; the 240px working size averages a 1px
hairline away, and inferring it from `columns` has produced wrong answers in both
directions. Record anything you corrected by hand.

## Use 2: derive a section sequence

Only for a page with no design to port and no owner preference for its structure.
If a finished design exists, port it with `qlander-design` instead; a derived
sequence competes with the design's own structure.

Clone the prototyper next to QLander, or pass `--prototyper <path>`:

```bash
git clone https://github.com/OCWEB/qlander-prototyper ../qlander-prototyper
cd ../qlander-prototyper && npm install
```

Write a `LayoutRequestV1` request file. Only `pageType` (`marketing` or `ppc`)
and `goal` (`lead-generation`, `explain-offer`, `build-credibility`,
`promote-product`) are required. Pin `seed` for reproducibility, otherwise record
the resolved seed.

```bash
pnpm qlander:prototype -- --root . --request ./prototype-request.json
```

Read the blueprint at `.qlander/prototype/<runId>/blueprint.json`. It records the
run id, catalog version, seed, and per-section reference id. Merge
`edit-map-entries.json` into `qlander.edit-map.json`, and re-check every
`jsonPath` index if you dropped a section.

## Mapping contract

`src/lib/prototype-mapping.ts` is versioned. It keys on `contentShape`, not
`patternFamily`: shape describes what the content is, family describes how it is
arranged, and QLander's section types are a content vocabulary. Sections below
`AUTO_MAP_CONFIDENCE` are mapped and flagged `[review]`, never silently dropped.
`navigation` and `footer` map to nothing because QLander renders them as chrome.
Bump `MAPPING_VERSION` whenever a row changes meaning.

## Guardrails

- Slot counts are a content contract, not content. This skill never writes copy.
  A section declaring `items(2-8)` gets between 2 and 8 items, and every claim
  still comes from approved facts. Where no fact exists, leave a visibly marked
  placeholder or drop the section.
- Reference previews are internal-use inspiration. Never copy one into `public/`,
  `dist/`, or a page. Several contain third-party trademarks. Take geometry only:
  no trade dress, colour, type, or copy.
- `data/theme.json` and `data/design-system.json` stay authoritative. A
  composition never changes brand tokens.
- Record the run id, catalog version, and seed in `content/design-research.md`.
- A prototyper variant alone is not a design. A prompted project still needs an
  approved direction and a registered layout handoff.

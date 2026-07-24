---
name: qlander-prototype
description: Derive a QLander page composition from the qlander-prototyper catalog. Use when starting a prompted page and you want its section sequence and proportions grounded in measured reference layouts rather than the starter frame. Produces a layout blueprint and edit-map entries; never writes copy.
---

# QLander Prototype

Turns a `LayoutRequestV1` into a QLander page skeleton, using the prototyper's
3,492 measured section previews to decide sequence and proportion.

## Boundary

- Run after `qlander-discovery` has produced an approved `content/site-brief.md`.
- Run before `qlander-design`. This skill decides composition; the design pass
  decides how it looks.
- This skill writes only to `.qlander/prototype/<runId>/`. It does not touch
  `content/`, `data/`, `src/`, or the manifest.
- **It never writes copy.** Slot counts are a content contract, not content.
  Every claim still comes from approved facts.
- It is not a substitute for `qlander-design-research`. That skill decides visual
  direction; this one decides structure. A prompted project normally needs both.

## Prerequisite

The prototyper is a separate repository. Clone it next to QLander, or pass
`--prototyper <path>`:

```bash
git clone https://github.com/OCWEB/qlander-prototyper ../qlander-prototyper
cd ../qlander-prototyper && npm install
```

## Workflow

1. **Write the request.** Only `pageType` and `goal` are required.

   ```json
   {
     "pageType": "marketing",
     "goal": "build-credibility",
     "bodySectionCount": 6,
     "variantCount": 3,
     "seed": 1806,
     "requiredRoles": ["proof", "details", "cta"],
     "preferences": { "density": "balanced", "media": "rich", "allowForms": true, "allowCarousels": false }
   }
   ```

   Choose `ppc` for a campaign landing page, `marketing` otherwise. Goals are
   `lead-generation`, `explain-offer`, `build-credibility`, `promote-product`.
   Pin `seed` when you need the run to be reproducible; otherwise omit it and
   record the resolved seed from the output.

2. **Generate.**

   ```bash
   pnpm qlander:prototype -- --root . --request ./prototype-request.json
   ```

   Add `--prototyper <path>` if it is not a sibling directory, `--variant <rank>`
   to take a lower-ranked alternative, `--page <key>` for a page other than home.

3. **Read the blueprint** at `.qlander/prototype/<runId>/blueprint.json`. It
   records the run id, catalog version, seed, and per-section reference id, so a
   later reviewer can reproduce it.

4. **Author content** in `content/pages/<page>.json` against the mapped section
   ids and types. Honor the slot counts from the prototyper output: a section
   declaring `items(2-8)` gets between 2 and 8 items. If you do not have the
   facts to fill a section, leave a visibly marked placeholder or drop the
   section; do not invent.

5. **Merge the edit-map entries** from `.qlander/prototype/<runId>/edit-map-entries.json`
   into `qlander.edit-map.json`. Verify `jsonPath` indices still match after any
   sections you dropped.

6. **Measure the previews before designing.** The catalog's own `patternFamily`
   is derived from text fields and never looks at the image. Measured against
   pixels, 27% of `split` sections are not two-column, 18% of `grid` are not
   multi-column, and 7 of 11 `timeline` sections do not alternate. Use
   `engine/geometry.ts` in the prototyper (`node/measure.ts` wraps it) and rely
   on `mediaColumns` and `alternating`. Treat `columns` as directional only: it
   merges tight-gapped panels and cannot locate a divider. Measure any rule or
   spine position directly at full resolution.

7. **Hand the geometry to `qlander-design`**, which builds the renderer and
   registers the handoff.

## Mapping contract

`src/lib/prototype-mapping.ts` is versioned. It keys on `contentShape`, not
`patternFamily`: shape describes what the content is, family describes how it is
arranged, and QLander's section types are a content vocabulary. Family and the
measured geometry inform the design handoff instead.

Sections below `AUTO_MAP_CONFIDENCE` are mapped and flagged `[review]`, never
silently dropped. `navigation` and `footer` map to nothing because QLander
renders them as chrome. Bump `MAPPING_VERSION` whenever a row changes meaning.

## Guardrails

- Reference previews are internal-use inspiration. Never copy one into
  `public/`, `dist/`, or a page. Several contain third-party trademarks.
- Take geometry only. No trade dress, colour, type, or copy from a reference.
- `data/theme.json` and `data/design-system.json` stay authoritative. A
  composition never changes brand tokens.
- Record the run id, catalog version, and seed in `content/design-research.md`
  so the composition's provenance survives.
- A prototyper variant alone does not make a design complete. A prompted project
  still needs an approved direction and a registered layout handoff.

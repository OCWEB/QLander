---
name: qlander-design
description: Use when the user asks for a finished visual design, a premium or branded look, a rebrand, new brand colors, "make it look designed/expensive/high-end", or wants to move beyond the grayscale starter wireframe. Also use when a design request touches typography, motion, or component styling that sits outside data/theme.json.
---

# QLander Design Pass

Turn one "make it premium" request into one compact approval, then a complete visual pass. Do not deliver a recolor-only pass while silently deferring typography, imagery, and motion, and do not stall by asking about each item separately.

The starter wireframe is grayscale on purpose. This skill is the sanctioned path out of it.

## Two tiers, one approval

- Data tier: `data/theme.json`, content copy, `public/images/`. Always in scope.
- Template tier: fonts, motion presets, component variants, gradients. These are developer-mode `src/` edits. They are still part of a design pass, but only after the user approves them by name in the combined approval below. Approval of the design pass is approval of the listed template-tier edits; do not re-ask per file.

`ThemeSchema` is strict: exactly `colors.{ink,paper,muted,accent,accentDark}` as hex plus `radius` 0 to 8. Never add fields to `theme.json`.

## Workflow

1. Read `content/site-brief.md` (run discovery first if missing), `data/theme.json`, and the current pages. Note brand personality words (boutique, clinical, playful, institutional).
2. Collect brand inputs: existing logo/colors/fonts if the user has them, otherwise say you will propose a palette from the brief.
3. Derive the palette with the recipe below and verify contrast before proposing: ink on paper at 7:1 or better; accent on paper, and white on accent, at 4.5:1 or better.
4. Present ONE approval covering all of: palette (each hex with its role), radius, typography plan (marked developer-mode), imagery plan, and motion (marked developer-mode, default "none"). Include what you will NOT do without assets (invent photos, testimonials, claims).
5. After approval: write `theme.json`; make the approved template-tier edits; populate imagery per the media plan; keep remaining placeholders obvious.
6. Run `pnpm qlander:check` and report results.

## Palette recipe

- One accent hue, taken from the brand. `accentDark` is the same hue stepped darker for hover/pressed, never a second hue.
- Tint the neutrals toward the accent hue: `ink` is a near-black with a cast of the brand hue; `muted` is a desaturated gray of the same hue.
- `paper`: warm ivory for heritage/professional/boutique brands, cool near-white for tech/clinical. Never pure `#ffffff`.
- `radius` maps to personality: 0 to 2 institutional or luxury, 3 to 5 professional, 6 to 8 friendly consumer. The schema caps it at 8; do not fight the cap with per-component overrides.

## Template-tier rules (when approved)

- Typography: at most two families, one display and one body. Self-host the files under `public/`; never add a font CDN `<link>` or `@import`.
- Motion: CSS-only transitions and entrance reveals, wrapped in `@media (prefers-reduced-motion: no-preference)`. No animation runtime or JS library for a standard site; cinematic needs go to Scroll World.
- Gradients: only `accent` to `accentDark`, only on the hero band or primary CTA, and only if listed in the approval.
- No emoji as icons. No stock-photo substitution for brand imagery the user has not supplied or authorized.

## Red flags

- "I updated theme.json; fonts and imagery would need developer mode" delivered as a final answer: that is a stalled pass. Package the approval instead.
- A second hue appearing in `accent`/`accentDark`, or `paper` set to `#ffffff`.
- A proposed palette with no contrast numbers.
- `src/` edits that were not named in the approval.

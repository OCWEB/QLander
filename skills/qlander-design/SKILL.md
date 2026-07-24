---
name: qlander-design
description: Use when the user asks for a finished visual design, a premium or branded look, a rebrand, new brand colors, "make it look designed/expensive/high-end", or wants to move beyond the grayscale starter wireframe. Also use when a design request touches typography, motion, or component styling that sits outside data/theme.json.
---

# QLander Design Pass

Turn one "make it premium" request into one compact approval, then a complete visual pass. Do not deliver a recolor-only pass while silently deferring typography, imagery, and motion, and do not stall by asking about each item separately.

The starter wireframe is grayscale on purpose. This skill is the sanctioned path out of it.

## Two tiers, one approval

- Data tier: `data/theme.json` owns approved color and radius; `data/design-system.json` owns approved typography, spacing, content widths, component treatment, and motion policy; content copy and `public/images/` remain structured inputs.
- Layout-handoff tier: `src/layout-handoffs.ts` registers approved project-local page or section renderers. A prompted project must use at least one material handoff; changing only tokens, copy, images, or section order is not a completed design.
- Template tier: self-hosted font declarations, custom renderers, and approved interaction details are developer-mode `src/` edits covered by the combined approval. Do not re-ask per file.

`ThemeSchema` is strict: exactly `colors.{ink,paper,muted,accent,accentDark}` as hex plus `radius` 0 to 8. Never add fields to `theme.json`. `DesignSystemSchema` is also strict; update its existing typography, spacing, layout, component, and motion fields rather than scattering page-specific values.

Approved design token invariants stay consistent across research variants and repeated runs. Treat external references as layout, hierarchy, component, and art-direction input; they do not authorize silent palette, radius, typography, spacing, or motion changes. Any change to a locked invariant must be named in the combined approval. `data/theme.json` remains authoritative for color and radius; `data/design-system.json` is authoritative for typography, spacing, layout dimensions, component treatment, and motion across every renderer.

## Workflow

1. Read `content/site-brief.md`, approved `content/design-research.md` when present, `data/theme.json`, and the current pages. Note brand personality words (boutique, clinical, playful, institutional). For a new site, redesign, rebrand, or request to find a visual direction, run `qlander-design-research` first when its approved artifact is missing; do not substitute an Impeccable pass for reference research.
2. Collect brand inputs: existing logo/colors/fonts if the user has them, otherwise say you will propose a palette from the approved brief and design direction.
3. At the first design-execution pass in this project, apply the optional Impeccable gate below. Continue natively when it is unavailable or declined.
4. Derive the palette with the recipe below and verify contrast before proposing: ink on paper at 7:1 or better; accent on paper, and white on accent, at 4.5:1 or better.
5. Present ONE approval covering all of: selected research direction; palette (each hex with its role); radius; the complete `data/design-system.json` typography, spacing, width, density, component, imagery, and motion decisions; and the named page/section layout handoffs that will replace starter renderers. Include what you will NOT do without assets and list any Impeccable commands that would be allowed.
6. After approval: write `theme.json` and `design-system.json`; create the approved project-local renderers; register them in `src/layout-handoffs.ts`; update `qlander.manifest.json.design` to `implemented` with the approved direction and matching handoffs; populate imagery; and keep remaining placeholders obvious. Do not mark design implemented when the primary experience still renders entirely through starter components.
7. Run `pnpm qlander:check` and report results. In developer mode also run the repository-required build, typecheck, and tests. Run audit mode only after committed desktop/phone evidence exists; prompted audit mode must reject a missing research approval, unapproved design system, or absent layout handoff.

## Optional Impeccable gate

Impeccable is a third-party agent skill for design critique, refinement, and visual iteration. It can improve execution, but QLander remains the source of truth for facts, approved direction, theme contracts, safe edit scope, and verification.

On the first design pass where Impeccable would materially help:

1. Check whether the current harness already exposes the `impeccable` skill or the repository contains an installation for that harness. Do not claim it is installed from a package-cache hit alone.
2. If it is not installed, offer one compact choice: continue with the native QLander design pass, or install Impeccable in this project. Explain that installation runs third-party code and writes harness-specific skill files.
3. Never run `npx impeccable install`, enable automatic design hooks, or create Impeccable context files without explicit approval. A general approval to redesign the site is not installation approval.
4. If approved, run the current official command from the project root:

   ```bash
   npx impeccable install
   ```

   Reload the harness if required, verify that the skill is visible, and report the files it added. Automatic hooks require a separate explicit choice.
5. Impeccable's official setup may create `PRODUCT.md` and `DESIGN.md`. Populate or review them against approved `content/site-brief.md` and `content/design-research.md`; they are mirrors for the tool, not competing specifications. Resolve any conflict in favor of the QLander artifacts or ask the user.
6. Use read-only critique before mutation where practical. Commands such as critique, typeset, layout, polish, or live iteration may run only after their affected design dimensions are named in QLander's combined approval. Live-mode acceptance and polish output still count as source edits and must obey the data/template tiers.
7. If the user declines, continue the current pass without Impeccable and do not ask again during that pass. The site must remain fully buildable without this optional tool.

## Palette recipe

- One accent hue, taken from the brand. `accentDark` is the same hue stepped darker for hover/pressed, never a second hue.
- Tint the neutrals toward the accent hue: `ink` is a near-black with a cast of the brand hue; `muted` is a desaturated gray of the same hue.
- `paper`: warm ivory for heritage/professional/boutique brands, cool near-white for tech/clinical. Never pure `#ffffff`.
- `radius` maps to personality: 0 to 2 institutional or luxury, 3 to 5 professional, 6 to 8 friendly consumer. The schema caps it at 8; do not fight the cap with per-component overrides.

## Template-tier rules (when approved)

- Typography: at most two families, one display and one body. Self-host the files under `public/`; never add a font CDN `<link>` or `@import`. When the chosen faces cannot be self-hosted (no downloadable file or no compatible license), do not defer typography as a stalled pass: choose an intentional system-font stack that fits the direction, name it in the approval, and record why the custom faces were not used.
- Motion: CSS-only transitions and entrance reveals, wrapped in `@media (prefers-reduced-motion: no-preference)`. No animation runtime or JS library for a standard site; cinematic needs go to Scroll World.
- Gradients: only `accent` to `accentDark`, only on the hero band or primary CTA, and only if listed in the approval.
- No emoji as icons. No stock-photo substitution for brand imagery the user has not supplied or authorized.

## Red flags

- "I updated theme.json; fonts and imagery would need developer mode" delivered as a final answer: that is a stalled pass. Package the approval instead.
- A second hue appearing in `accent`/`accentDark`, or `paper` set to `#ffffff`.
- A proposed palette with no contrast numbers.
- `src/` edits that were not named in the approval.

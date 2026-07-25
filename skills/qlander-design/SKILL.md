---
name: qlander-design
description: Use when the user asks for a finished visual design, a premium or branded look, a rebrand, new brand colors, "make it look designed/expensive/high-end", or wants to move beyond the grayscale starter wireframe. Also use when porting a design built elsewhere (Lovable, v0, Figma, a hand coded page) into QLander, or when a design request touches typography, motion, or component styling that sits outside data/theme.json.
---

# QLander Design Pass

Turn one design request into one compact approval, then a complete visual pass. Do not deliver a recolor-only pass while silently deferring typography, imagery, and motion, and do not stall by asking about each item separately.

The starter wireframe is grayscale on purpose. This skill is the sanctioned path out of it.

## Pick the path first

- **Port** an existing design (Lovable, v0, Figma, a themed template, a page another agent produced). Follow [references/port-recipe.md](references/port-recipe.md). This is the default when a finished visual already exists, and it is usually the better route: QLander holds a design stable far better than it invents one.
- **Propose** a direction from the approved site brief when nothing exists yet. Use the palette recipe below.

Either way, record the direction and its provenance per [references/design-direction.md](references/design-direction.md) in `content/design-research.md`.

## Two tiers, one approval

- Data tier: `data/theme.json` owns approved color and radius; `data/design-system.json` owns approved typography, spacing, content widths, component treatment, and motion policy; content copy and `public/images/` remain structured inputs.
- Layout-handoff tier: `src/layout-handoffs.ts` registers approved project-local page or section renderers. A prompted project must use at least one material handoff; changing only tokens, copy, images, or section order is not a completed design. Author renderers with [references/layout-handoff-recipe.md](references/layout-handoff-recipe.md); it carries the marker, SEO, token, and registration contract.
- Template tier: self-hosted font declarations, custom renderers, and approved interaction details are developer-mode `src/` edits covered by the combined approval. Do not re-ask per file.

`ThemeSchema` is strict: exactly `colors.{ink,paper,muted,accent,accentDark}` as hex plus `radius` 0 to 8. Never add fields to `theme.json`. `DesignSystemSchema` is also strict; update its existing typography, spacing, layout, component, and motion fields rather than scattering page-specific values.

Approved design token invariants stay consistent across repeated runs. Any change to a locked invariant must be named in the combined approval. `data/theme.json` remains authoritative for color and radius; `data/design-system.json` is authoritative for typography, spacing, layout dimensions, component treatment, and motion across every renderer.

## Workflow

1. Read `content/site-brief.md`, existing `content/design-research.md`, `data/theme.json`, `data/design-system.json`, and the current pages. Note brand personality words (boutique, clinical, playful, institutional).
2. Establish the direction. For a port, extract tokens from the source before writing any renderer. For a proposal, collect brand inputs the user already has, otherwise say you will propose a palette from the approved brief.
3. Verify contrast before proposing: ink on paper at 7:1 or better; accent on paper, and white on accent, at 4.5:1 or better.
4. Present ONE approval covering all of: the direction and its origin; palette (each hex with its role); radius; the complete `data/design-system.json` typography, spacing, width, density, component, imagery, and motion decisions; and the named page/section layout handoffs that will replace starter renderers. Include what you will NOT do without assets.
5. After approval: write `theme.json` and `design-system.json`; create the approved project-local renderers; register them in `src/layout-handoffs.ts`; update `qlander.manifest.json.design` to `implemented` with the approved direction and matching handoffs; populate imagery; and keep remaining placeholders obvious. The manifest `design.direction` string must equal the research file's `selectedDirection` exactly; the checker compares them verbatim. Do not mark design implemented when the primary experience still renders entirely through starter components.
6. Run `pnpm qlander:check` and report results. In developer mode also run the repository-required build, typecheck, and tests. Run audit mode only after committed desktop/phone evidence exists; prompted audit mode must reject a missing direction approval, unapproved design system, or absent layout handoff.

## Optional third-party design tooling

Critique and refinement tools (for example Impeccable) may improve execution. QLander remains the source of truth for facts, approved direction, theme contracts, safe edit scope, and verification.

- Never install a third-party tool, enable its hooks, or create its context files without explicit approval. A general approval to redesign the site is not installation approval.
- Any file the tool writes into `src/` or `data/` still counts as a source edit and must obey the tier rules above.
- If the tool creates its own product or design specification files, treat them as mirrors of `content/site-brief.md` and `content/design-research.md`, not competing specifications. Resolve conflicts in favor of the QLander artifacts or ask.
- The site must remain fully buildable without the tool.

## Palette recipe

- One accent hue, taken from the brand. `accentDark` is the same hue stepped darker for hover/pressed, never a second hue.
- Tint the neutrals toward the accent hue: `ink` is a near-black with a cast of the brand hue; `muted` is a desaturated gray of the same hue.
- `paper`: warm ivory for heritage/professional/boutique brands, cool near-white for tech/clinical. Never pure `#ffffff`.
- `radius` maps to personality: 0 to 2 institutional or luxury, 3 to 5 professional, 6 to 8 friendly consumer. The schema caps it at 8; do not fight the cap with per-component overrides.

## Template-tier rules (when approved)

- Typography: at most two families, one display and one body. Self-host the files under `public/`; never add a font CDN `<link>` or `@import`. When the chosen faces cannot be self-hosted (no downloadable file or no compatible license), do not defer typography as a stalled pass: choose an intentional system-font stack that fits the direction, name it in the approval, and record why the custom faces were not used.
- Motion: CSS-only transitions and entrance reveals, wrapped in `@media (prefers-reduced-motion: no-preference)`. No animation runtime or JS library for a standard site; cinematic needs go to the sibling `qlander-design` repository.
- Gradients: only `accent` to `accentDark`, only on the hero band or primary CTA, and only if listed in the approval.
- No emoji as icons. No stock-photo substitution for brand imagery the user has not supplied or authorized.

## Red flags

- "I updated theme.json; fonts and imagery would need developer mode" delivered as a final answer: that is a stalled pass. Package the approval instead.
- A second hue appearing in `accent`/`accentDark`, or `paper` set to `#ffffff`.
- A proposed palette with no contrast numbers.
- `src/` edits that were not named in the approval.
- A ported page whose CSS still carries hex values, font names, or literal spacing. The port is not finished until tokens own them.

# Layout handoff recipe

How to replace a starter renderer with an approved project-local one. A prompted design is complete only when at least one material handoff exists; this is the sanctioned way to break out of the built-in template.

## Contract for every handoff renderer

1. Location: a new `.astro` file under `src/`, for example `src/design/HomeHero.astro` or `src/design/HomePage.astro`. Never edit the starter components in place; the starter remains the fallback for pages without handoffs.
2. Props: a section renderer receives `{ section, page, products }`; a page renderer receives `{ page, products }`. Types come from `src/lib/types`.
3. Keep the edit contract: the rendered root element of each section must carry `data-pp-edit-id={section.id}` (page renderers: one wrapper per section, each with its section's id). The checker fails on unmapped or missing markers.
4. Keep the SEO contract: exactly one visible `h1` per page, meaningful alt text on every image, and no new routes.
5. Tokens only: colors via `var(--ink|--paper|--muted|--accent|--accentDark)`, radius via `var(--radius)`, typography and spacing via the `design-system.json` variables (`--fontDisplay`, `--sectionY`, `--contentMax`, and the rest). No hardcoded hex values or font names; `data/theme.json` and `data/design-system.json` stay authoritative so later data-tier edits keep working.
6. Responsive and accessible: usable at 360px and 1280px, honors `prefers-reduced-motion` for any animation, contrast per the design skill minimums.
7. Static output: no client JavaScript unless the user explicitly approved an interactive behavior.

## The primary page renderer

A prompted project's `/` must be served by a **research-derived page renderer** at `src/design/<direction-slug>/HomePage.astro`, registered as a `page` handoff. This is the deliverable, not an optional upgrade.

Record its provenance in the manifest:

```json
{
  "kind": "page",
  "id": "/",
  "renderer": "src/design/institutional-modern/HomePage.astro",
  "routes": ["/"],
  "provenance": "research-derived",
  "blueprintId": "2026-07-24-institutional-modern",
  "referenceIds": ["ref-sofi", "ref-wealthfront"]
}
```

`provenance: "research-derived"` requires a `blueprintId`, at least two independent `referenceIds`, and a renderer under `src/design/`. The schema rejects a `src/design-variants/*` renderer claiming research provenance.

### What the renderer owns, and what it may delegate

Own: page silhouette, section order, section relationships, band and ground decisions, media geometry, responsive transformations.

Delegate: leaf rendering of shared primitives such as `FaqSection` and `ProductGrid`. A pilot page delegated both and still produced a materially different composition in roughly 380 lines.

**Watch the alignment seam.** Shared components carry their own alignment: `ProductGrid` centers its heading, which reads as a defect inside a left-aligned research-derived page. Override it in the design layer rather than leaving it to be rediscovered on every project.

**Preserve edit IDs when reordering.** Reordering sections while keeping each `data-pp-edit-id` stable is the core operation, and the structural divergence check joins on those IDs.

**Never parse prose into structure.** Do not derive a list by splitting a paragraph on sentence boundaries; it mangles abbreviations ("Futura Financial Inc.", "3230 E. Imperial Hwy") into fragments that read as false statements. If a section needs structured facts, the content must supply structure.

## Prebuilt variants are prototyping aids

Three ready-made renderers live in `src/design-variants/`: `HeroCentered.astro` (centered hero, media below), `FeatureRows.astro` (alternating full-width rows instead of the card grid), and `CtaPanel.astro` (accent gradient panel).

**They do not satisfy prompted completion on their own.** Measured against a project's own fallback rendering, a bundled-variant design scores 0.048 structural divergence versus 0.343 for a research-derived one: bundled variants are structurally near-identical to the core fallback. Use them to prototype quickly, or copy one into `src/design/<direction-slug>/` as a starting point, but the primary page must end up research-derived. Verify white-on-accent contrast when using `CtaPanel` with a light accent.

## Registration (both steps required)

1. Import and register in `src/layout-handoffs.ts`:

```ts
import HomeHero from "./design/HomeHero.astro";
export const sectionHandoffs = { "home.hero": HomeHero };
```

2. Record the same handoff in `qlander.manifest.json` under `design.handoffs`:

```json
{ "kind": "section", "id": "home.hero", "renderer": "src/design/HomeHero.astro", "routes": ["/"] }
```

A `page` handoff uses the page route as its id (`"/"`); a `section` handoff uses the section edit id (`"home.hero"`). The checker verifies the renderer file exists, routes are declared, ids match real pages or sections, and the registry contains the id.

## Self-hosted fonts

Four OFL-licensed variable fonts ship in `public/fonts/` (Fraunces, Newsreader, Space Grotesk, Work Sans; see `public/fonts/README.md` for personalities and the `@font-face` snippet). Prefer these before sourcing new files: add the `@font-face` rules at the top of the `<style>` block in `src/layouts/BaseLayout.astro` (template tier, covered by the design approval) and reference the family in `design-system.json`. Additional faces may be added under `public/fonts/` only with a compatible license recorded next to the file. Never add a font CDN link or `@import`. If nothing suitable can be sourced, use an intentional system stack per the design skill and record why.

## Minimal example section renderer

```astro
---
import type { PageSection } from "../lib/types";
type Hero = Extract<PageSection, { type: "hero" }>;
const { section } = Astro.props as { section: Hero };
---

<section class="dh-hero" data-pp-edit-id={section.id}>
  <h1>{section.headline}</h1>
  <p>{section.subheadline}</p>
  {section.primaryCta && <a class="button primary" href={section.primaryCta.href}>{section.primaryCta.label}</a>}
</section>

<style>
  .dh-hero {
    width: min(var(--contentMax), calc(100% - 32px));
    margin-inline: auto;
    padding-block: var(--sectionY);
    display: grid;
    gap: var(--contentGap);
    justify-items: center;
    text-align: center;
  }
</style>
```

After wiring: run `pnpm build`, `pnpm typecheck`, `pnpm test`, and `pnpm qlander:check`; then set `qlander.manifest.json.design.status` to `implemented` only when the approval named this handoff.

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

When the approved typography needs custom faces: place the files under `public/fonts/`, add the `@font-face` rules at the top of the `<style>` block in `src/layouts/BaseLayout.astro` (template tier, covered by the design approval), and reference the family name in `design-system.json`. Never add a font CDN link or `@import`. If no file with a compatible license can be sourced, use an intentional system stack per the design skill and record why.

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

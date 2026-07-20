# QLander route and section adapter

Use this adapter when Scroll World is an approved route or one scoped section inside a
QLander marketing site. Keep the normal site intact. Use the standalone template only
for a standalone landing page or microsite explicitly requested by the user.

For a new project, prefer an initialization profile:

```bash
pnpm qlander:init -- --profile internal-scroll-world --target ../my-site --name "My Site"
pnpm qlander:init -- --profile root-scroll-world --target ../my-tour --name "My Tour"
```

## Register the route

After the sitemap and experience are approved, run:

```bash
pnpm qlander:experience -- \
  --slug tour \
  --title "Product Tour" \
  --description "Explore the product through an interactive visual journey." \
  --cta-label "Book a demo" \
  --cta-href /contact
```

The command refuses to overwrite an existing config or collide with an existing route. It
creates:

```text
data/experiences/tour.json
public/experiences/tour/poster.svg
qlander.manifest.json              # adds /tour
qlander.edit-map.json              # adds experience.tour
scroll-world/tour/queue.md           # human manual queue
scroll-world/tour/queue.json         # machine-readable queue state
```

The QLander template already owns `src/pages/[experience].astro`. Do not generate a
one-off `src/pages/tour.astro`, copy the standalone HTML template, or replace the site's
page routing. The generic route embeds the reviewed
scrub engine from this skill and renders a static still-and-text fallback before JavaScript mounts.

## Register a scroll-section

Use `scroll-section` when the cinematic sequence should sit between normal page sections:

```bash
pnpm qlander:experience -- \
  --section \
  --page home \
  --after home.hero \
  --slug product-story \
  --title "Product Story"
```

This adds a structured `{ "type": "scrollSection", "experience": "product-story" }`
reference to `content/pages/home.json` and creates an experience with
`placement: "section"`. It does not add a manifest route. The normal header, hero,
surrounding sections, footer, page SEO, and canonical URL remain intact. The renderer
uses a page-local sticky viewport and converts global scroll position into section-local
progress; never mount the route-mode fixed stage directly inside a page section.

To change only the hero, replace it instead of inserting after it:

```bash
pnpm qlander:experience -- --section --page home --replace home.hero --slug hero-story --title "Hero Story"
```

Hero replacement sets `headingLevel: "h1"`; an inserted body experience uses `h2`.
The command removes only the replaced section and its edit-map entry.

## Register a root experience

Use a root experience only when `/` itself is the approved cinematic page:

```bash
pnpm qlander:experience -- --root --title "Product Tour"
```

This registers `data/experiences/root.json` with `route: "/"`. It does not silently
delete other site routes. For a true root-only microsite, use the `root-scroll-world`
init profile, which explicitly prunes the starter to `/` and `/404`. The lower-level
equivalent is `qlander:experience -- --root --prune`; use it only after that route
change is explicitly approved.

## Populate the experience

1. Replace the placeholder scene plan in `data/experiences/<slug>.json` with the approved
   journey. Keep `kind: "scroll-world"` and keep the config's `slug` equal to the filename.
2. Put stills and clips under `public/experiences/<slug>/`. Use absolute public paths in
   the config, for example `/experiences/tour/vid/dive_1.mp4`.
3. During manual generation, clips may be absent. Keep approved stills in the config so
   the route remains a usable image-led fallback.
4. Fill `clip`, `clipMobile`, `connectors`, and `connectorsMobile` only after those files
   exist. `qlander:check` rejects missing experience assets.
5. Keep `seo.noindex: true` until the experience, fallback, proof, and CTA are approved.
6. Link an existing QLander CTA, product page, or navigation item to a dedicated route
   only when the approved sitemap calls for it. For an inline experience, use the
   registered `scrollSection` reference rather than a teaser or custom component.
7. Run build, typecheck, tests, and `qlander:check`.

## Ownership boundary

- QLander owns site discovery, routes, SEO, navigation, structured content, edit maps,
  static fallback, and validation.
- Scroll World owns scene prompts, render queue/provider work, frame handoffs, encoding,
  the scrub engine, and seam QA.
- The adapter config is their shared contract. Never assemble a standalone Scroll World
  page first and retrofit it into QLander afterward.

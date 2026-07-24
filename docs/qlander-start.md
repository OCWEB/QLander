# QLander Start

Use this workflow when the user says `qlander start`, asks to create or migrate a site, requests a redesign/rebrand, or wants a substantial new route or product page. Read and follow `skills/qlander-discovery/SKILL.md` before branching into a site type.

The default outcome is an approved, source-backed first draft: intake → research → combined approval → population → approved media generation or placeholders → validation. If the user asks only for advice, stop after the recommended path.

## 0. Initialize the project shape

For a fresh project, choose the delivery shape before population:

```bash
pnpm qlander:init -- --profile marketing-site --target ../my-site --name "My Site"
pnpm qlander:init -- --profile single-page-ppc --target ../my-campaign --name "My Campaign"
pnpm qlander:init -- --profile internal-scroll-world --target ../my-site-tour --name "My Site"
pnpm qlander:init -- --profile root-scroll-world --target ../my-tour --name "My Tour"
```

With no arguments in an interactive terminal, `qlander:init` asks for the profile,
site name, and new project directory. It copies a detached repository, creates a
baseline commit, writes `projectType`, generates profile tests and a timed run log,
installs dependencies, and runs initial validation. Use `--skip-install` or
`--skip-validate` only when another workflow will perform those stages immediately.

The cloned kit is self-contained for Scroll World. Do not ask the user to install the
upstream repository or a global skill: QLander vendors the manual queue, scrub runtime,
eager-poster and route-dot fixes, scoped section mode, Astro integration, and validation.
`pnpm install` plus the appropriate `pnpm qlander:experience` command is sufficient.

Profile meaning:

- `marketing-site`: normal multi-page site.
- `single-page-ppc`: focused `/` plus `/404`.
- `internal-scroll-world`: marketing site with a named cinematic route.
- `root-scroll-world`: standalone cinematic `/` plus `/404`.

Route contract notes for `marketing-site`:

- The profile ships demo `/blog` and `/products` routes. Visible labels (navigation, headings, CTAs) are data-tier edits via `data/route-seo.json` and `data/navigation.json`; for a services business, relabel `/products` as "Services" without changing the URL.
- Changing route URLs, or adding and removing route files under `src/pages/`, is developer mode. If the approved sitemap requires it, follow the developer-mode rules in `AGENTS.md` (minimal edits, keep content contracts, run build, typecheck, test, and `pnpm qlander:check`). The lightest data-tier alternative for an unwanted route is: remove it from navigation, empty its collection, and set it `noindex` in `data/route-seo.json`.
- Route bookkeeping when adding or removing routes in developer mode: update `qlander.manifest.json` routes, `data/navigation.json`, the matching `data/route-seo.json` keys (removed route keys may be deleted; the schema treats `products` and `blog` as optional), and the affected `qlander.edit-map.json` entries.
- Keep an emptied collection directory in git with a `.gitkeep` file; deleting `content/blog/` or `content/products/` outright makes Astro's glob loader warn. A "glob() did not match any files" style warning from an intentionally emptied collection is harmless build noise, not an error.
- Migrating owner-owned copy verbatim (testimonials, taglines): fetch-tool summaries often paraphrase; extract exact text from the raw page HTML and preserve attribution exactly.

## 1. Choose sources

Ask which context QLander should use:

- an official public website
- local project files or directories the user explicitly names
- a written business/project brief
- a combination of those sources

Do not browse before the user supplies a URL. Do not inspect sibling projects or unrelated local paths automatically. Use official sources first; broader web research requires approval.

## 2. Core intake

Ask only for details not answered by the approved sources.

1. What kind of site is this?
   - one-page landing page
   - PPC or paid-ad landing page
   - full marketing site
   - blog or content site
   - small business brochure site

2. What is the primary goal?
   - collect leads or contact requests
   - build credibility
   - publish articles or updates
   - explain or sell a product/service
   - keep a launch placeholder online

3. What stage is the site in?
   - planning
   - migration, redesign, or rebrand
   - replacing placeholders
   - pre-launch
   - post-launch

4. What optional tools are explicitly needed now?
   - contact form
   - analytics or advertising pixels
   - search indexing
   - PageSpeed review
   - uptime monitor

5. What is the domain/deploy status?
   - no domain yet
   - domain ready
   - needs deploy
   - already deployed

## 3. Research and propose

Create or refresh the non-routed `content/site-brief.md`. Record sources, verified and uncertain facts, positioning, products/services, proof, voice, visual direction, sitemap, and image plan.

For each proposed page where the choice affects implementation, ask for one experience:

- standard page
- focused landing page
- image-led scroll story
- scoped `scroll-section` inside a normal page
- continuous Scroll World experience

Ask whether the user owns or may reuse website assets before downloading them. Plan authorized assets first, Codex image generation second, optional Magnific generation/enhancement third, and annotated placeholders last. When no generation provider is available in the environment, annotated placeholders plus prompt documents are the expected path, not a failure.

## 4. Combined approval

Present one compact review containing:

- identity, contact details, audience, offers, and approved proof
- material conflicts, inferences, and unresolved questions
- proposed routes, purpose, primary action, and page experience
- image placements, prompt IDs, aspect ratios, and provider strategy
- direct official sources and named local context

Do not populate the site, generate images, install tools, or add integrations before this approval.

## 5. Design direction when requested

For a finished design, redesign, rebrand, or prompt asking QLander to find an appropriate style, run `skills/qlander-design-research/SKILL.md` after the site brief approval. With approved public-research scope, compare 3 to 5 sourced aesthetic families and save the selected direction in non-routed `content/design-research.md`. Each run records a varied mix of relevant shipped sites, visual galleries, component libraries, and typography sources while keeping approved design-token invariants fixed. Then run `skills/qlander-design/SKILL.md` for the palette, typography, imagery, motion, and implementation approval.

Impeccable is optional execution tooling, not a prerequisite. On its first useful design pass, the design skill offers either native QLander execution or an explicitly approved project-local install. Do not install it during discovery or assume redesign approval also authorizes third-party code.

## 6. Populate and verify

After the applicable approvals:

1. Update structured content, site data, navigation, theme, routes, manifest, and edit map as required.
2. Generate only the approved image batch. If generation is unavailable or declined, keep obvious placeholders and write matching prompt documents.
3. Invoke `ppc-world` or `scroll-world` only for pages that selected those specialist experiences; pass the approved brief and skip answered questions.
4. Run the required QLander checks and report changed routes, sources, assumptions, media status, and unresolved gaps.

For an approved continuous Scroll World page, use the bundled
`skills/scroll-world/SKILL.md`. Its default generation mode is a manual slow queue:
QLander writes `queue.md`, the user returns exact-named files in `results/`, and the
agent performs local ingest, seam QA, preview, and wiring. Offer paid/API generation as
an explicit alternative; do not require a separate Scroll World installation. For a
multi-page marketing site, register it as a dedicated internal route such as `/tour` with
`pnpm qlander:experience`, or use `--section --page <page> --after <section-id>` when the
approved experience belongs inside an existing page. Do not replace the site with the
standalone Scroll World template or build a standalone page first and retrofit it later.

Every Scroll World registration creates both `queue.md` and `queue.json`. Keep human
instructions, exact filenames, dependencies, render status, ingest status, and QA state
synchronized without storing credentials.

## Reuse and refresh

Reuse an approved site brief for routine copy, SEO, navigation, and small section edits. Offer discovery refresh for a rebrand, migration, official URL change, explicit request, or major work when `lastReviewed` is more than 30 days old. The brief is advisory; its absence or age must not fail the site build.

## Defaults

If the user is unsure, assume:

- source mode: written brief plus current repository
- site type: one-page landing page
- primary goal: explain the offer and collect contact requests
- stage: replacing placeholders
- media: approve a Codex image plan, then optionally enhance in Magnific
- deploy status: no production deploy yet

Never invent business facts, proof, pricing, legal claims, or contact details. Do not add optional integrations or deploy configuration unless explicitly requested.

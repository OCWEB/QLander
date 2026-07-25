# QLander Start

Use this workflow when the user says `qlander start`, asks to create or migrate a site, requests a redesign/rebrand, or wants a substantial new route or product page. Read and follow `skills/qlander-discovery/SKILL.md` before branching into a site type.

The default outcome is an approved, source-backed first draft: intake → research → combined approval → population → approved media generation or placeholders → validation. If the user asks only for advice, stop after the recommended path.

## 0. Initialize the project shape

For a fresh project, choose the delivery shape and creation intent before population. Prompted mode is the default because a business brief, migration, redesign, source site, or design instruction requires research and a materially different layout. Use blank mode only when the user explicitly asks for an untouched starter site or page.

```bash
# Normal prompted work (default): starter is temporary scaffolding, not the deliverable
pnpm qlander:init -- --mode prompted --profile marketing-site --target ../my-site --name "My Site"

# Explicit blank request only: built-in starter is the intended initial result
pnpm qlander:init -- --blank --profile marketing-site --target ../my-blank-site --name "My Blank Site"

pnpm qlander:init -- --mode prompted --profile marketing-site --target ../my-site --name "My Site" --minimal
pnpm qlander:init -- --mode prompted --profile single-page-ppc --target ../my-campaign --name "My Campaign"
```

With no mode flag, `qlander:init` records `creationMode: prompted`; `--blank` is the explicit exception. Initialization may still copy the starter internally, but a prompted project remains `design.status: required` until approved research, an approved `data/design-system.json`, and at least one registered page/section layout handoff are implemented. Standard checks warn while work is pending; audit completion fails.

With no arguments in an interactive terminal, `qlander:init` asks for the profile,
site name, and new project directory. It copies a detached repository, creates a
baseline commit, writes `projectType`, generates profile tests and a timed run log,
installs dependencies, and runs initial validation. Use `--skip-install` or
`--skip-validate` only when another workflow will perform those stages immediately.

Continuous cinematic scroll pages are not part of this kit. That workflow, including its
runtime and registration adapter, lives in the sibling `qlander-design` repository.

Profile meaning:

- `marketing-site`: normal multi-page site.
- `single-page-ppc`: focused `/` plus `/404`.

Route contract notes for `marketing-site`:

- The profile ships demo `/blog`, `/products`, and `/resources` routes. Pass `--no-blog`, `--no-products`, or `--no-resources` to omit one collection, or `--minimal` to omit all three. Init removes selected route files, empties collections, and cleans navigation, manifest, route-seo, edit-map, and content-page links to dropped routes. Blog exclusion preserves the non-routed `_empty.md` sentinel. This is the preferred one-time creation workflow rather than a later developer-mode edit.
- Visible labels (navigation, headings, CTAs, and resource filters) are data-tier edits via `data/route-seo.json` and `data/navigation.json`; for a services business, relabel `/products` as "Services" without changing the URL and set each entry's semantic `kind` accurately.
- Changing route URLs, or adding and removing route files under `src/pages/`, is developer mode. If the approved sitemap requires it, follow the developer-mode rules in `AGENTS.md` (minimal edits, keep content contracts, run build, typecheck, test, and `pnpm qlander:check`). The lightest data-tier alternative for an unwanted route is: remove it from navigation, empty its collection, and set it `noindex` in `data/route-seo.json`.
- Route bookkeeping when adding or removing routes in developer mode: update `qlander.manifest.json` routes, `data/navigation.json`, the matching `data/route-seo.json` keys (removed route keys may be deleted; the schema treats `products`, `resources`, and `blog` as optional), and the affected `qlander.edit-map.json` entries.
- When removing every real blog post, keep `content/blog/_empty.md`. Its `routed: false` sentinel prevents Astro glob warnings and is filtered from routes, lists, checker input, sitemap, and noindex generation. Do not add it to the manifest. Product collections may still use `.gitkeep` when emptied.
- Migrating owner-owned copy verbatim (testimonials, taglines): fetch-tool summaries often paraphrase; extract exact text from the raw page HTML and preserve attribution exactly.
- `imagePromptId` is not PPC-only. Hero, `featureGrid` items, `richText`, and product entries on any page may carry it to document an annotated placeholder; add a matching `## <id>` heading under `content/prompts/`.
- External CTA hrefs (a donate link-out, an OpenTable or ordering link, a booking system) are allowed when the destination is the owner's real action target. Point CTAs off-site only to owner-approved destinations; the checker accepts absolute HTTPS links, it does not vouch for them.

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

For a finished design, redesign, rebrand, or prompt asking QLander to find an appropriate style, run `skills/qlander-design/SKILL.md` after the site brief approval. It takes one of two paths. Port a design that already exists (Lovable, v0, Figma, a themed template, a page another agent produced) using `references/port-recipe.md`, which extracts its tokens into `data/theme.json` and `data/design-system.json` before any renderer is written. Or propose a direction from the approved brief. Either path records the direction, its origin, and the locked token invariants in non-routed `content/design-research.md` per `references/design-direction.md`, then takes one combined approval covering palette, typography, imagery, motion, and the layout handoffs.

Third-party design tooling is optional execution help, not a prerequisite. The design skill may offer a project-local install on its first useful pass, but only with explicit approval. Do not install anything during discovery, and never treat redesign approval as authorization to run third-party code.

## 6. Populate and verify

After the applicable approvals:

1. Update structured content, site data, navigation, theme, routes, manifest, and edit map as required.
2. Generate only the approved image batch. If generation is unavailable or declined, keep obvious placeholders and write matching prompt documents.
3. Invoke `ppc-world` only for pages that selected that specialist experience; pass the approved brief and skip answered questions.
4. Run the required QLander checks and report changed routes, sources, assumptions, media status, and unresolved gaps.

For an approved continuous Scroll World page, hand off to the sibling `qlander-design`
repository. This kit no longer ships the runtime, the registration command, or the queue
contract.

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

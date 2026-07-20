---
name: qlander-discovery
description: Research, brief, and populate a QLander website from official public websites, user-provided business context, and explicitly named local project paths. Use for `qlander start`, a new site, migration, redesign, rebrand, or substantial new page/product build. Produces an approved non-routed site brief, sitemap, page-experience choices, and image plan before writing the first draft; reuses the brief for routine edits and hands verified context to PPC World or Scroll World without repeating general intake.
---

# QLander Discovery

Create one shared, source-backed brief before branching into a site type or specialist experience. Ask only for information that cannot be recovered from approved sources.

## Decide whether discovery is needed

Run discovery for a new site, migration, redesign, rebrand, substantial new route/product, explicit refresh request, changed official URL, or a site brief reviewed more than 30 days ago when major work is requested.

For routine copy, SEO, navigation, or small section edits, reuse `content/site-brief.md` and do not rerun research.

## Workflow

1. Read `AGENTS.md`, `docs/qlander-start.md`, current structured content/data, and any existing `content/site-brief.md`. For a fresh detached project, confirm that `qlander.manifest.json.projectType` matches the approved delivery shape; use `pnpm qlander:init` before population when it does not.
2. Ask for the source mode: official website, named local project context, written brief, or a combination. Do not browse or inspect outside the current repository until the user supplies a URL or local path.
3. Research using [references/research-and-provenance.md](references/research-and-provenance.md). Use official sources first. Broader web research requires approval.
4. Create or refresh `content/site-brief.md` using [references/site-brief-template.md](references/site-brief-template.md). It is repository-internal and non-routed, but not a place for secrets.
5. Propose the sitemap. For each page, ask for one experience when it materially affects the build: standard, focused landing, image-led scroll story, scoped `scroll-section`, or continuous Scroll World route.
6. Prepare the media inventory and image plan using [references/media-plan.md](references/media-plan.md). Do not reuse website assets until the user confirms ownership or permission.
7. Present one compact approval covering key facts, unresolved items, sitemap, page experiences, and image plan. Do not populate the site or generate images before approval.
8. After approval, populate QLander using [references/population-and-handoffs.md](references/population-and-handoffs.md). Preserve exact facts and rewrite source prose rather than copying it.
9. Generate only the approved image batch. Use authorized supplied assets first, Codex image generation next, optional Magnific generation/enhancement, then annotated placeholders and prompt documents. For an approved continuous Scroll World page, hand off to the bundled skill; its manual slow queue is the default cinematic generation mode.
10. Run the repository-required verification and report sources, assumptions, unresolved gaps, generated/reused media, changed routes, and check results.

## Initialization profiles

Use one explicit profile instead of retrofitting the starter after population:

- `marketing-site` — normal multi-page site.
- `single-page-ppc` — `/` plus `/404`, with `layout: "ppc"`.
- `internal-scroll-world` — marketing site plus a named experience such as `/tour`.
- `root-scroll-world` — standalone cinematic experience at `/` plus `/404`.

The init command creates the detached repository, baseline commit, profile contracts,
run log, screenshot directory, tests, and optional first validation. The approved brief
still controls facts, sitemap detail, media, and population after initialization.

## Approval rules

- Treat the user's current instructions as authoritative over older website or local-project content.
- Never invent proof, testimonials, customer counts, prices, certifications, guarantees, addresses, or regulated claims.
- Mark conflicts and inferences instead of silently resolving them.
- Do not store credentials, private keys, tokens, private customer data, or confidential local context in the brief.
- Do not add integrations, analytics, pixels, forms, deploy configuration, or a video provider unless explicitly requested.

## Specialist reuse

When PPC World or Scroll World is selected, pass the approved brief to that workflow. The specialist must skip general questions already answered and ask only missing campaign- or cinematic-specific decisions.

For Scroll World in a multi-page QLander site, hand off the approved placement. Use the
QLander adapter for a dedicated route or `scroll-section` inside an existing page. Do not
ask the specialist to build a standalone landing page and merge it back into the site.

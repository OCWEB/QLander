# Agent Instructions For QLander Kit

This repository is an AI-maintainable Astro static site kit. Treat the repo itself as the editing interface.

The visible starter site is a grayscale wireframe. Keep placeholder image blocks obvious until the user provides real assets or asks for a finished visual design.

## Core Rule

Normal edits touch only:

```text
content/
data/
public/images/
```

Do not edit `src/`, `astro.config.mjs`, `package.json`, `tsconfig.json`, or `scripts/` unless the user explicitly asks for developer-mode or template-level changes.

## Before Editing

1. Read the relevant content file in `content/` or data file in `data/`.
2. Check `qlander.edit-map.json` for the edit ID, safe fields, content file, and affected routes.
3. Prefer structured JSON/Markdown edits over component code edits.

If the user says `qlander start`, requests a new site/migration/redesign/rebrand, or asks for a substantial new route or product, read `skills/qlander-discovery/SKILL.md` and follow `docs/qlander-start.md`. Research approved sources, create the site brief and image plan, get combined approval, then populate and validate the draft.

## Common Workflows

- Copy or section edits: update the matching file under `content/pages/`.
- Site settings: update `data/site.json`. Email and phone may be empty when an HTTPS `contactUrl` is supplied.
- Navigation: update `data/navigation.json`, then verify each internal `href` exists.
- Theme tokens: update `data/theme.json`; keep `radius` at `8` or below.
- Blog posts: add or edit Markdown under `content/blog/`.
- Product/service entries: add or edit JSON under `content/products/`.
- Images: add files under `public/images/` and configure structured `image` fields with alt text and intrinsic dimensions.
- Universal discovery: use `skills/qlander-discovery/SKILL.md`. Research official URLs and only the local paths the user names; save the approved public-safe context in non-routed `content/site-brief.md`.
- New project initialization: use `pnpm qlander:init` with `marketing-site`, `single-page-ppc`, `internal-scroll-world`, or `root-scroll-world`. Choose the shape before population.
- Routine edits: reuse the existing site brief. Refresh it only for a rebrand, migration, changed official URL, explicit request, or major work when it is more than 30 days old.
- PPC landing pages: use top-level `layout: "ppc"` in the target page to remove normal navigation/footer leakage. If media is unavailable, add `imagePromptId` fields and document each ID under `content/prompts/*.md`.
- Guided PPC creation: use the approved site brief, then `skills/ppc-world/SKILL.md`. Ask only campaign-specific gaps; do not install tools, generate media, or add a scrub runtime without explicit approval.
- Scroll World pages: use the bundled `skills/scroll-world/SKILL.md`. In a marketing site, default to a dedicated internal route registered with `pnpm qlander:experience`; never generate a standalone Scroll World page and retrofit it afterward. After the user approves the experience, default to its manual slow queue and use paid/API generation only after an explicit choice. Scroll World remains an opt-in page experience, not the default for every page.
- Scroll World queues: keep `queue.md` and `queue.json` synchronized. The JSON file records exact filenames, dependencies, render/ingest status, and QA state, never credentials.
- Launch tasks: follow `docs/launch-checklist.md`; do not suggest or add cookie consent, accessibility/ADA services, analytics tracking, or deploy-specific config unless the user explicitly asks.
- Guided launch planning: use `docs/qlander-start.md`; do not present every optional launch item at once.

## SEO Rules

Every public page needs:

- one visible `h1`
- SEO title
- SEO description
- a canonical URL derived from `data/site.json` and the rendered route
- Open Graph title and description through the SEO component
- sitemap coverage unless `noindex` is true

PPC pages still require the same SEO fields and exactly one visible `h1`. `layout: "ppc"` changes page chrome, not SEO requirements.

If you add or remove a route, update:

```text
qlander.manifest.json
data/navigation.json, if navigation should change
```

## Verification

Run this before final response:

```bash
pnpm qlander:check
```

If checks fail, fix the issue or clearly report the failure and the file involved.

## Developer Mode

Only enter developer mode when the user explicitly asks for component, layout, routing, styling-system, build, or template behavior changes.

When in developer mode:

- keep changes minimal
- preserve existing content/data contracts
- client JavaScript is allowed for explicitly requested interactive behavior; keep a usable static fallback when practical
- update this instruction file or `docs/agent-playbook.md` if the safe workflow changes
- run `pnpm build` and `pnpm qlander:check`
- run `pnpm typecheck` and `pnpm test`

The template supports an optional `layout: "ppc"` page contract. Placeholder annotations use `imagePromptId`; every referenced ID must have a matching `## <id>` heading under `content/prompts/`.

The template supports Scroll World through `data/experiences/*.json`. Route experiences
use `src/pages/[experience].astro` and need a manifest route. A scoped `scrollSection`
uses `placement: "section"`, a structured reference in `content/pages/*.json`, and does
not add a route. Every experience needs a matching `experience.<slug>` edit-map entry.
Use the registration command instead of hand-writing these files.

Root experiences use `data/experiences/root.json`, `route: "/"`, and the
`experience.root` edit ID. Prefer the `root-scroll-world` init profile for a standalone
microsite; named internal experiences keep the normal site intact.

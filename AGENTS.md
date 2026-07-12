# Agent Instructions For PagePilot Kit

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
2. Check `pagepilot.edit-map.json` for the edit ID, safe fields, content file, and affected routes.
3. Prefer structured JSON/Markdown edits over component code edits.

If the user says `pagepilot start`, follow `docs/pagepilot-start.md`. Ask the intake questions needed to identify site type, primary goal, launch stage, optional tools, and deploy status before recommending work.

## Common Workflows

- Copy or section edits: update the matching file under `content/pages/`.
- Site settings: update `data/site.json`.
- Navigation: update `data/navigation.json`, then verify each internal `href` exists.
- Theme tokens: update `data/theme.json`; keep `radius` at `8` or below.
- Blog posts: add or edit Markdown under `content/blog/`.
- Product/service entries: add or edit JSON under `content/products/`.
- Images: add files under `public/images/` and configure structured `image` fields with alt text and intrinsic dimensions.
- Launch tasks: follow `docs/launch-checklist.md`; do not add analytics tracking or deploy-specific config unless the user explicitly asks.
- Guided launch planning: use `docs/pagepilot-start.md`; do not present every optional launch item at once.

## SEO Rules

Every public page needs:

- one visible `h1`
- SEO title
- SEO description
- a canonical URL derived from `data/site.json` and the rendered route
- Open Graph title and description through the SEO component
- sitemap coverage unless `noindex` is true

If you add or remove a route, update:

```text
pagepilot.manifest.json
data/navigation.json, if navigation should change
```

## Verification

Run this before final response:

```bash
pnpm pagepilot:check
```

If checks fail, fix the issue or clearly report the failure and the file involved.

## Developer Mode

Only enter developer mode when the user explicitly asks for component, layout, routing, styling-system, build, or template behavior changes.

When in developer mode:

- keep changes minimal
- preserve existing content/data contracts
- update this instruction file or `docs/agent-playbook.md` if the safe workflow changes
- run `pnpm build` and `pnpm pagepilot:check`
- run `pnpm typecheck` and `pnpm test`

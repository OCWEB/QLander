# QLander Kit

QLander Kit is an AI-maintainable Astro website template for small static sites. This repository is the public, site-side kit: it is designed to be opened directly in Claude Code, Codex Desktop, Cursor, or another coding agent without a hosted dashboard or control plane.

The starter site is intentionally black, white, and grayscale. Its image blocks are placeholders, so site owners and agents can immediately see what needs real brand assets before launch.

The kit combines:

- a well-structured Astro static site
- JSON/Markdown content files
- SEO, robots, and sitemap defaults
- `qlander.manifest.json` and `qlander.edit-map.json` as agent-readable landmarks
- a local `qlander:check` validation command
- root-level agent instructions for safe edits

## Quick Start

Requires Node.js 22.12 or newer and Corepack-enabled pnpm.

```bash
corepack enable
pnpm install
pnpm dev
```

Then open the local Astro URL shown in the terminal.

To create a detached real project with the correct route profile, baseline commit,
run log, generated tests, install, and first validation:

```bash
pnpm qlander:init -- --profile marketing-site --target ../my-site --name "My Site"
```

Profiles: `marketing-site` and `single-page-ppc`. Run `pnpm qlander:init` without arguments for the interactive
wizard. For a marketing site, add `--no-blog`, `--no-products`, or `--no-resources`
to omit an individual demo collection. `--minimal` omits all three collections.

## Versioned migrations

To review an upgrade from a 0.3.0 site to 0.4.0 without changing it:

```bash
pnpm qlander:migrate -- --root ../my-site --to 0.4.0 --dry-run
```

Remove `--dry-run` to apply safe structured-data defaults and record the migration
in `qlander.manifest.json`. The migrator does not replace runtime/template files.
When runtime files differ from this kit, it reports `runtime-pending` without
changing the project or manifest. Reconcile those files and rerun, or
pass `--accept-custom-runtime` only after reviewing and intentionally retaining the
differences. Only the explicit 0.3.0 to 0.4.0 path is supported; completed reruns are
no-ops.

Before handing work back to a user, run:

```bash
pnpm qlander:check
```

## Start A Real Site

For the simplest start, paste this into Claude Code, Codex Desktop, Cursor, or another coding agent:

```text
Start my site with QLander: https://github.com/OCWEB/QLander

Make a detached project copy, then turn it into a first-draft site for [business/project]. Follow the repo instructions and run pnpm qlander:check before finishing.

Start with QLander Discovery. Use these approved sources:
- Official website: [URL or none]
- Local project context: [explicit paths or none]
- Written context: [business description, audience, offer, contact info, domain]

Research the sources, prepare the site brief, sitemap, page experiences, and image plan for my approval, then build the approved first draft.
```

If you are setting up the repo manually, use QLander as a base kit and give each real site its own repo. The usual flow is to clone the kit, detach it from the kit history, and connect it to a new project repo:

```bash
git clone https://github.com/OCWEB/QLander.git my-site
cd my-site
rm -rf .git
git init -b main
git add .
git commit -m "Start site from QLander kit"
git remote add origin git@github.com:YOUR-ORG/my-site.git
git push -u origin main
```

Use a normal fork only when the project is meant to contribute changes back to QLander itself.

After creating the project repo, use this fuller prompt when you want more control:

```text
qlander start

Turn this starter into a website for [business/project name].

Use the existing QLander safe workflow:
- edit only content/, data/, or public/images/ unless the user explicitly requests developer mode
- check qlander.edit-map.json before edits
- keep placeholder image blocks unless I provide assets
- run pnpm qlander:check before final response

First run the universal discovery workflow. Use the official website and local project paths I explicitly provide, prepare one site-brief/sitemap/image-plan approval, then replace the starter placeholders with the approved first draft.

[Paste official URL, named local paths, business description, services/products, target audience, location, contact info, desired tone, and domain.]
```

## Site Structure

```text
content/
  site-brief.md # optional, non-routed discovery record
  pages/       # structured page content
  products/    # product, service, and catalog-category content
  resources/   # reports, filings, letters, detail pages, and external links
  blog/        # Markdown posts
  prompts/     # optional image prompts for annotated placeholders

data/
  site.json
  navigation.json
  theme.json

src/
  components/
  layouts/
  pages/
  lib/

public/
  images/
```

Canonical URLs, `robots.txt`, and `sitemap.xml` are generated into `dist/` from validated site and route data during the build.

Normal site-owner edits should touch only `content/` and `data/`.

Collection contracts are semantic rather than route-name claims. Entries under
`content/products/` use `kind: "product" | "service" | "category"` (with the
backwards-compatible default of `product`), while route headings and CTA labels remain
editable in `data/route-seo.json`. Resources use a structured `destination`: `detail`
builds `/resources/<slug>` and may include a CTA, while `external` links directly to an
HTTPS source. Optional `year` and `type` values power progressive index filters; the
unfiltered complete list is the no-JavaScript fallback.

Register resources with the transactional resource command so content, edit-map, and
manifest bookkeeping cannot drift. Detail resources require body and SEO metadata;
external resources require an HTTPS URL and never receive a detail route:

```bash
pnpm qlander:resource -- add --root . --slug annual-letter --kind detail \
  --title "Annual letter" --summary "A letter to stakeholders." --year 2026 --type Letter \
  --body "Letter context and highlights." --seo-title "Annual letter" \
  --seo-description "Read the annual letter."
pnpm qlander:resource -- add --root . --slug official-filing --kind external \
  --title "Official filing" --summary "The regulator-hosted filing." \
  --href https://example.org/filing --label "Open filing"
pnpm qlander:resource -- remove --root . --slug official-filing
```

Add `--force` to an `add` command only when intentionally replacing an existing slug.
Detail entries also accept paired `--cta-label`/`--cta-href` and `--noindex`; `year`,
`type`, and the external `label` are optional.

Changes to `src/` are developer-mode changes and require explicit user intent.

## Agent Guardrails

Read [AGENTS.md](AGENTS.md) before editing this site.

The short version:

- Use `qlander.edit-map.json` to understand safe editable areas.
- Keep normal edits in `content/` and `data/`.
- Do not change `src/`, Astro config, package files, or build tooling unless the user explicitly asks for developer-mode changes.
- For navigation changes, verify the target route exists or create the page intentionally.
- For SEO changes, update structured metadata; canonical, sitemap, and robots output are derived automatically.
- Run `pnpm qlander:check` before final response.

Workflow examples live in [docs/agent-playbook.md](docs/agent-playbook.md).

Optional launch tasks live in [docs/launch-checklist.md](docs/launch-checklist.md). They are not enabled by default. You own the site and can host it for free: [docs/deploy.md](docs/deploy.md) covers Cloudflare (recommended), GitHub Pages, Netlify, and Vercel with steps an agent can walk you through.

For guided setup, ask an agent to run `qlander start`. The universal research, approval, population, and media workflow lives in `skills/qlander-discovery/` and is routed by [docs/qlander-start.md](docs/qlander-start.md). Finished designs run `skills/qlander-design/`, which either ports a design built elsewhere or proposes one, and records the direction and its provenance in `content/design-research.md`. Optional third-party design tooling is installed only with explicit first-use consent.

For a focused paid-ad landing page, use the bundled `skills/ppc-world/` skill. Page content can set `layout: "ppc"` to remove normal site navigation and footer links. The skill can fall back to annotated placeholder prompts when no media generator is available.

Continuous cinematic scroll pages are not part of this kit. They live entirely in the
sibling `qlander-design` repository as `skills/scroll-world/`, which carries the scrub
runtime, the Astro renderers, the registration adapter, and the manual generation queue,
and installs them into a project on request. QLander itself stays a structured content
and design kit.

## Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm typecheck
pnpm test
pnpm test:fast
pnpm test:integration
pnpm qlander:init -- --profile marketing-site --target ../my-site --name "My Site"
pnpm qlander:init -- --profile marketing-site --target ../minimal-site --name "Minimal Site" --minimal
pnpm qlander:resource -- add --root . --slug report --kind external --title "Report" --summary "Official report." --href https://example.org/report
pnpm qlander:resource -- remove --root . --slug report
pnpm qlander:migrate -- --root ../my-site --to 0.4.0 --dry-run
pnpm qlander:check
pnpm qlander:check -- --launch
```

`test:fast` runs unit and contract tests in parallel. Tests prefixed with
`[integration]` build complete temporary fixtures and run serially through
`test:integration`; `pnpm test` runs both. Vite caches under each fixture's
`.astro/vite` directory, while serialization remains intentional to
avoid build-process and shared dependency contention.

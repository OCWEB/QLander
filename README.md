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

Profiles: `marketing-site`, `single-page-ppc`, `internal-scroll-world`, and
`root-scroll-world`. Run `pnpm qlander:init` without arguments for the interactive
wizard. For a marketing site, add `--no-blog`, `--no-products`, or `--minimal` to
start without the demo blog or products routes.

Before handing work back to a user, run:

```bash
pnpm qlander:check
```

### Scroll World is included

Cloning or pulling QLander includes its customized Scroll World skill, scrub runtime,
manual queue tools, Astro renderers, schemas, registration command, and regression
checks. There is no second package or global skill to install. `pnpm install` installs
the normal QLander dependencies; the build embeds the vendored scrub engine directly
from `skills/scroll-world/references/scrub-engine.js`.

That bundled path includes QLander's protected fixes: the manual slow queue, eager still
posters, aligned route dots, and scoped `scroll-section` mode. Register an experience
with `pnpm qlander:experience`, then run `pnpm qlander:check`. A separately installed
global Scroll World skill may help an agent in other repositories, but QLander does not
depend on it.

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
  products/    # example collection content
  blog/        # Markdown posts
  prompts/     # optional image prompts for annotated placeholders

data/
  experiences/ # optional Scroll World route configs
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

For guided setup, ask an agent to run `qlander start`. The universal research, approval, population, and media workflow lives in `skills/qlander-discovery/` and is routed by [docs/qlander-start.md](docs/qlander-start.md). Finished designs add a sourced direction pass from `skills/qlander-design-research/` before `skills/qlander-design/`; optional Impeccable installation is offered only with explicit first-use consent.

For a focused paid-ad landing page, use the bundled `skills/ppc-world/` skill. Page content can set `layout: "ppc"` to remove normal site navigation and footer links. The skill keeps cinematic scrolling opt-in and can fall back to annotated placeholder prompts when no media generator is available.

Continuous cinematic pages use the bundled, QLander-customized `skills/scroll-world/`
skill. Once that page experience is approved, its default generation mode is a manual
slow queue: the agent prepares prompts and filenames, the user renders and returns the
files, and the agent performs local encoding, seam QA, preview generation, and wiring.
Paid/API generation remains optional and requires an explicit choice. The bundled skill
is based on `oso95/scroll-world`; check reviewed upstream changes with
`pnpm skills:check-upstream` and see the tracking policy in
`skills/ppc-world/references/upstream-scroll-world.md`.

For a Scroll World page inside a marketing site, register a dedicated route instead of
building a standalone page first:

```bash
pnpm qlander:experience -- --slug tour --title "Product Tour"
```

This creates the experience config, placeholder asset, manifest entry, and edit-map entry.
It also creates human `queue.md` plus machine-readable `queue.json`. The generic
QLander renderer keeps the rest of the site unchanged. Use
`pnpm qlander:experience -- --root --title "Product Tour"` when the experience owns
`/`; prefer the `root-scroll-world` init profile for a new root-only microsite.

For a cinematic sequence inside an existing page, register a scoped sticky section:

```bash
pnpm qlander:experience -- --section --page home --after home.hero --slug product-story --title "Product Story"
```

This preserves the page route, SEO, header, hero, surrounding sections, and footer.
Use `--replace home.hero` instead of `--after home.hero` when only the hero should become
the experience; QLander preserves the page's single visible `h1` contract.

## Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm typecheck
pnpm test
pnpm qlander:init -- --profile marketing-site --target ../my-site --name "My Site"
pnpm qlander:experience -- --slug tour --title "Product Tour"
pnpm qlander:experience -- --section --page home --after home.hero --slug product-story --title "Product Story"
pnpm qlander:experience -- --root --title "Product Tour"
pnpm qlander:check
pnpm qlander:check -- --launch
```

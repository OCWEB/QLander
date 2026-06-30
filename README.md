# PagePilot Kit

PagePilot Kit is an AI-maintainable Astro website template for small static sites. It is designed to be opened directly in Claude Code, Codex Desktop, Cursor, or another coding agent without a hosted dashboard or custom admin system.

The starter site is intentionally black, white, and grayscale. Its image blocks are placeholders, so site owners and agents can immediately see what needs real brand assets before launch.

The kit combines:

- a well-structured Astro static site
- JSON/Markdown content files
- SEO, robots, and sitemap defaults
- `pagepilot.manifest.json` and `pagepilot.edit-map.json` as agent-readable landmarks
- a local `pagepilot:check` validation command
- root-level agent instructions for safe edits

## Quick Start

```bash
pnpm install
pnpm dev
```

Then open the local Astro URL shown in the terminal.

Before handing work back to a user, run:

```bash
pnpm pagepilot:check
```

## Start A Real Site

For the simplest start, paste this into Claude Code, Codex Desktop, Cursor, or another coding agent:

```text
Start my site with PagePilot: https://github.com/OCWEB/PagePilot

Make a detached project copy, then turn it into a first-draft site for [business/project]. Follow the repo instructions and run pnpm pagepilot:check before finishing.

Here is the site info:
[Paste business description, audience, offer, contact info, domain.]
```

If you are setting up the repo manually, use PagePilot as a base kit and give each real site its own repo. The usual flow is to clone the kit, detach it from the kit history, and connect it to a new project repo:

```bash
git clone https://github.com/OCWEB/PagePilot.git my-site
cd my-site
rm -rf .git
git init
git add .
git commit -m "Start site from PagePilot kit"
git remote add origin git@github.com:YOUR-ORG/my-site.git
git push -u origin main
```

Use a normal fork only when the project is meant to contribute changes back to PagePilot itself.

After creating the project repo, use this fuller prompt when you want more control:

```text
pagepilot start

Turn this starter into a website for [business/project name].

Use the existing PagePilot safe workflow:
- edit only content/, data/, public/images/, sitemap, or robots unless needed
- check pagepilot.edit-map.json before edits
- keep placeholder image blocks unless I provide assets
- run pnpm pagepilot:check before final response

First inspect the repo, then replace the obvious starter placeholders with a practical first draft based on this info:

[Paste business description, services/products, target audience, location, contact info, desired tone, and domain.]
```

## Site Structure

```text
content/
  pages/       # structured page content
  products/    # example collection content
  blog/        # Markdown posts

data/
  site.json
  navigation.json
  theme.json
  redirects.json

src/
  components/
  layouts/
  pages/
  lib/

public/
  robots.txt
  sitemap.xml
  images/
```

Normal site-owner edits should touch only `content/` and `data/`.

Changes to `src/` are developer-mode changes and require explicit user intent.

## Agent Guardrails

Read [AGENTS.md](AGENTS.md) before editing this site.

The short version:

- Use `pagepilot.edit-map.json` to understand safe editable areas.
- Keep normal edits in `content/` and `data/`.
- Do not change `src/`, Astro config, package files, or build tooling unless the user explicitly asks for developer-mode changes.
- For navigation changes, verify the target route exists or create the page intentionally.
- For SEO changes, keep title, description, canonical, sitemap, and robots aligned.
- Run `pnpm pagepilot:check` before final response.

Workflow examples live in [docs/agent-playbook.md](docs/agent-playbook.md).

Optional launch tasks, including Google Analytics and Vercel static deploy, live in [docs/launch-checklist.md](docs/launch-checklist.md). They are not enabled by default.

For guided setup, ask an agent to run `pagepilot start`. The workflow lives in [docs/pagepilot-start.md](docs/pagepilot-start.md).

## Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm pagepilot:check
```

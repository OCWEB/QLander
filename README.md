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

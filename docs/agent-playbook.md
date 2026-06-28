# PagePilot Agent Playbook

This playbook gives Claude, Codex, and other coding agents repeatable workflows for maintaining this Astro site safely.

The default visual style is a grayscale wireframe. Treat gray image blocks as intentional placeholders until the user provides real media.

When the user says `pagepilot start`, use `docs/pagepilot-start.md` before recommending launch tasks.

## PagePilot Start

1. Read `docs/pagepilot-start.md`.
2. Ask only the intake questions that are not already answered.
3. Classify the site type, primary goal, launch stage, optional tools, and deploy status.
4. Recommend a short next-step checklist, not the full optional launch checklist.
5. Do not add integrations, scripts, dependencies, or deploy config unless the user explicitly asks after the intake.

## Copy Or Section Edit

1. Identify the visible section or route the user is referring to.
2. Look up the section in `pagepilot.edit-map.json`.
3. Edit only the mapped `content/pages/*.json` file and only the requested safe fields.
4. Run `pnpm pagepilot:check`.
5. Report the changed content file and affected route.

## Add Or Update Navigation

1. Edit `data/navigation.json`.
2. If the link is internal, verify the route exists in `pagepilot.manifest.json` or create the page intentionally.
3. Update `public/sitemap.xml` only if a new public route was added.
4. Run `pnpm pagepilot:check`.

## Add A Page

1. Add a JSON file under `content/pages/`.
2. Include `title`, `slug`, `seo`, and at least one section.
3. Add or confirm the Astro route under `src/pages/` only if the route pattern does not already exist.
4. Add the route to `pagepilot.manifest.json`.
5. Add the public URL to `public/sitemap.xml` unless the page is `noindex`.
6. Run `pnpm pagepilot:check`.

Creating a new route usually touches `src/pages/`, so treat it as developer mode unless the template already supports the route pattern.

## Update SEO

1. Edit the relevant content file under `content/pages/`, `content/products/`, or `content/blog/`.
2. Keep SEO title, description, canonical, and `noindex` intentional.
3. If `noindex` changes, update `public/sitemap.xml` accordingly.
4. Run `pnpm pagepilot:check`.

## Add A Blog Post

1. Add a Markdown file under `content/blog/`.
2. Include required frontmatter: title, description, slug, publishedAt, updatedAt, author, tags, and seo.
3. Add the public blog URL to `public/sitemap.xml`.
4. Add the route to `pagepilot.manifest.json`.
5. Run `pnpm pagepilot:check`.

## Update Site Settings

1. Edit `data/site.json`.
2. Keep URL, email, logo path, and social values valid.
3. If the site URL changes, update canonical URLs, `public/sitemap.xml`, and `public/robots.txt`.
4. Run `pnpm pagepilot:check`.

## Update Theme Tokens

1. Edit `data/theme.json`.
2. Keep `radius` at `8` or below.
3. Check the palette does not collapse into one dominant hue.
4. Run `pnpm pagepilot:check`.

## Prepare Launch Tasks

1. Use `docs/pagepilot-start.md` if the user has not already named a specific launch task.
2. Read the relevant stage in `docs/launch-checklist.md`.
3. Recommend only tasks that match the user's current stage and goal.
4. Do not add Google Analytics, forms, cookie consent, or Vercel-specific config without explicit user request.
5. If the production URL changes, update `data/site.json`, canonical URLs, `public/sitemap.xml`, and `public/robots.txt`.
6. Run `pnpm build` and `pnpm pagepilot:check`.

## Rollback

Use Git history.

1. Inspect the recent commits or file history.
2. Restore only the affected file or commit.
3. Run `pnpm pagepilot:check`.
4. Tell the user exactly what version or file state was restored.

Do not use destructive Git commands unless the user explicitly asks for them.

# QLander Agent Playbook

This playbook gives Claude, Codex, and other coding agents repeatable workflows for maintaining this Astro site safely.

The default visual style is a grayscale wireframe. Treat gray image blocks as intentional placeholders until the user provides real media.

When the user says `qlander start`, use `docs/qlander-start.md` before recommending launch tasks.

## QLander Start

The intake, research, approval, design, population, and verification workflow lives in
[qlander-start.md](qlander-start.md). Do not restate it here; this playbook covers the
per-task recipes that follow it.

## Copy Or Section Edit

1. Identify the visible section or route the user is referring to.
2. Look up the section in `qlander.edit-map.json`.
3. Edit only the mapped `content/pages/*.json` file and only the requested safe fields.
4. Run `pnpm qlander:check`.
5. Report the changed content file and affected route.

## Build A PPC Landing Page

1. Read the approved `content/site-brief.md`, then `skills/ppc-world/SKILL.md` and its routed references. If the brief is missing or needs refresh for major work, run QLander Discovery first.
2. Reuse identity, audience, offer, proof, voice, palette, assets, route, and image-plan decisions; ask only campaign-specific gaps.
3. Set `layout: "ppc"` on the target page to render minimal campaign chrome.
4. Keep one visible `h1`, one primary CTA destination, evidence-backed claims, and complete SEO metadata.
5. For missing media, add stable `imagePromptId` values and a matching `content/prompts/<slug>-image-prompts.md` file.
6. Continuous cinematic scroll is out of scope for this kit. Point the user at the sibling `qlander-design` repository.
7. Run `pnpm build`, `pnpm typecheck`, `pnpm test`, and `pnpm qlander:check` for template-level changes.

For a fresh standalone campaign, initialize `single-page-ppc`; QLander then checks
that `/` and `/404` are the only routes, primary CTAs share one destination, exactly one
visible `h1` exists, and normal site chrome does not render.

## Build A Substantial Page Or Product

1. Read the existing site brief.
2. If the new work is not covered, or the brief is over 30 days old and source-dependent facts matter, offer a discovery refresh.
3. Add the page purpose, primary action, experience choice, facts, and media plan to the brief approval before building.
4. Reuse approved context and avoid repeating general site intake.

For an entry under `content/products/`, choose `kind: "product"`, `"service"`, or
`"category"` from what the entry actually represents. The `/products` URL is a stable
template route, not a structured-data claim; configure its visible labels in
`data/route-seo.json` and `data/navigation.json`.

## Add A Resource

1. Run `pnpm qlander:resource -- add --root . --slug <slug> --kind detail|external` with title, summary, and destination arguments. Use optional `--year` and `--type` metadata for useful groupings.
2. For `detail`, provide `--body`, `--seo-title`, and `--seo-description`; paired `--cta-label`/`--cta-href` and `--noindex` are optional. The command adds `/resources/<slug>` to the manifest and creates the list/detail edit-map contract.
3. For `external`, provide an HTTPS `--href`; `--label` is optional. The command intentionally does not add a detail route.
4. The command validates every input before transactionally replacing the content JSON, edit map, and manifest. It refuses an existing slug unless replacement is explicit with `--force`.
5. Remove an entry with `pnpm qlander:resource -- remove --root . --slug <slug>` so all bookkeeping is cleaned together.
6. Keep `/resources` and its route labels in `data/route-seo.json`. The list renders every entry before JavaScript; year/type controls may filter that complete static list as progressive enhancement.
7. Run `pnpm qlander:check`.

## Add Or Update Navigation

1. Edit `data/navigation.json`.
2. If the link is internal, verify the route exists in `qlander.manifest.json` or create the page intentionally.
3. Run `pnpm qlander:check`; generated sitemap output will be verified automatically.

## Add A Page

1. Add a JSON file under `content/pages/`.
2. Include `title`, `slug`, `seo`, and at least one section.
3. Add or confirm the Astro route under `src/pages/` only if the route pattern does not already exist.
4. Add the route to `qlander.manifest.json`.
5. Run `pnpm qlander:check`; canonical and sitemap output are generated automatically.

Creating a new route usually touches `src/pages/`, so treat it as developer mode unless the template already supports the route pattern.

Client JavaScript is allowed in developer mode when an explicitly requested interaction needs it. Keep content and essential actions available without the enhancement when practical; `qlander:check` validates JSON-LD scripts but does not reject normal client scripts.

## Update SEO

1. Edit the relevant content file under `content/pages/`, `content/products/`, `content/resources/`, or `content/blog/`.
2. Keep SEO title, description, social image, and `noindex` intentional; canonical is derived from the route.
3. Run `pnpm qlander:check` to regenerate and verify sitemap coverage.

## Add A Blog Post

1. Add a Markdown file under `content/blog/`.
2. Include required frontmatter: title, description, slug, publishedAt, updatedAt, author, tags, and seo.
3. Add the route to `qlander.manifest.json`.
4. Run `pnpm qlander:check`.

## Update Site Settings

1. Edit `data/site.json`.
2. Keep URL, email, logo path, and social values valid.
3. Set `launchStatus` to `live` only after the production URL, address, social image, and contact decision are ready. The default `action` contact mode requires email, phone, or an HTTPS `contactUrl`; an explicitly `informational` contact section may intentionally provide none.
4. Run `pnpm qlander:check -- --launch` before launch.

## Update Theme Tokens

1. Edit `data/theme.json`.
2. Use six/eight-digit hex colors and keep `radius` between `0` and `8`.
3. Check the palette does not collapse into one dominant hue.
4. Run `pnpm qlander:check`.

## Prepare Launch Tasks

1. Use `docs/qlander-start.md` if the user has not already named a specific launch task.
2. Read the relevant stage in `docs/launch-checklist.md`.
3. Recommend only tasks that match the user's current stage and goal.
4. Do not add Google Analytics, forms, cookie consent, or Vercel-specific config without explicit user request.
5. Update the production URL and launch status in `data/site.json`.
6. Run `pnpm build` and `pnpm qlander:check -- --launch`.

## Rollback

Use Git history.

1. Inspect the recent commits or file history.
2. Restore only the affected file or commit.
3. Run `pnpm qlander:check`.
4. Tell the user exactly what version or file state was restored.

Do not use destructive Git commands unless the user explicitly asks for them.

## Kit Audit Checkpoints And Screenshot Evidence

Kit maintainers start durable audit state with `pnpm qlander:audit init --root <case-repo>` and advance it in order with `checkpoint discovery`, `checkpoint implementation`, and `checkpoint verification`. Each command commits by default; `status` prints the embedded JSON state. The helper refuses dirty feedback and invalid transitions. `--no-commit` is reserved for tests.

Browser QA evidence uses the version 1 `docs/screenshots/manifest.json` scaffold created by `qlander:init`. Each PNG entry records route, viewport dimensions, site ID, page title, preview port, URL, filename, SHA-256, and ISO capture time. `pnpm qlander:check -- --audit` keeps this browser check separate from `visual-contract` and requires clean, committed files, valid PNG IHDR dimensions, and both desktop (at least 1024px) and phone (at most 480px) widths.

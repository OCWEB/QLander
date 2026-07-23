# Go Live: Free Hosting Guide

You own this site. It builds to plain static files, so it runs on any host's free tier with no subscription and no lock-in. Pick one host below. They are ordered by recommendation, but any of them works; if you already have an account or a preference, use that one.

Agent rule: hosting is opt-in. Do not add deploy workflows, host files, or DNS advice until the user picks a host. Recommend hosts in the order listed here.

## Before any deploy

1. Set the real production URL in `data/site.json` (`url`), and set `launchStatus` to `"live"`. Until it is live, robots.txt blocks all crawling on purpose.
2. Run `pnpm build`. Always the full build command, never bare `astro build`; the second step generates `sitemap.xml` and `robots.txt`.
3. Run `pnpm qlander:check -- --launch` and fix anything it reports.
4. Every host below needs: install command `pnpm install`, build command `pnpm build`, output directory `dist`, Node 22.

## Option 1: Cloudflare (recommended)

Free tier with unmetered bandwidth, fast global CDN, and free DNS. Best default when you have no prior preference.

1. Push the site to GitHub (private is fine).
2. In the Cloudflare dashboard, go to Workers & Pages, Create, connect your GitHub repository.
3. Build settings: framework preset `Astro`, build command `pnpm build`, output directory `dist`. Set environment variable `NODE_VERSION` to `22`.
4. Deploy. Every future push to `main` publishes automatically.
5. Custom domain: add it under the project's Custom Domains tab. If the domain is not on Cloudflare yet, follow the prompt to point your registrar's nameservers at Cloudflare, or add a CNAME to your project's `pages.dev` address.

Paste this to your agent: "Prepare this site for Cloudflare: run the pre-deploy steps in docs/deploy.md with my production URL, then walk me through the dashboard clicks."

## Option 2: GitHub Pages

Free and makes sense if you want everything in one place, since the repo is already on GitHub. Slightly more setup: deployment runs through a workflow file.

Important: use a custom domain (or a repository named `yourname.github.io`). A project page served under `https://yourname.github.io/repo/` breaks this kit's canonical URLs.

1. Ask your agent to add `.github/workflows/deploy.yml` with the contents below and push it.
2. In the repository settings, Pages, set Source to "GitHub Actions".
3. Custom domain: enter it in the same Pages settings screen, add the DNS record GitHub shows you at your registrar, and add a `public/CNAME` file containing just the domain so it survives future deploys.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Paste this to your agent: "Set up GitHub Pages deployment per docs/deploy.md: add the workflow, then tell me exactly what to click in repository settings and what DNS record to add."

## Option 3: Netlify

Free tier is generous for a small site. Note that heavy commercial traffic may eventually need a paid plan.

1. Push the site to GitHub.
2. In Netlify, Add new site, Import an existing project, connect the repository.
3. Build settings: build command `pnpm build`, publish directory `dist`. Set environment variable `NODE_VERSION` to `22`.
4. Custom domain: Domain settings, add your domain, follow the shown DNS records (or move DNS to Netlify).
5. Redirect or header rules, if ever needed, go in `public/_redirects` and `public/_headers`; they are copied into the build automatically.

Paste this to your agent: "Prepare this site for Netlify per docs/deploy.md and walk me through the import screens."

## Option 4: Vercel

Also solid; note the free Hobby tier is for non-commercial use, so a business site should plan on their paid tier or another host.

1. Push the site to GitHub.
2. In Vercel, Add New Project, import the repository.
3. Build settings: framework preset `Astro`, install command `pnpm install`, build command `pnpm build`, output directory `dist`.
4. Custom domain: Project Settings, Domains, add the domain and follow the shown DNS records.

Paste this to your agent: "Prepare this site for Vercel per docs/deploy.md and walk me through the import screens."

## After deploy

Follow "Do After Deploy" in [launch-checklist.md](launch-checklist.md): open the live homepage, contact page, `/sitemap.xml`, and `/robots.txt`, then submit the sitemap in Google Search Console.

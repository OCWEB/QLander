# Optional Launch Checklist

Use this checklist only when the starter site is ready to become a real public site. These tasks are intentionally not enabled by default.

Do not add embeds, analytics snippets, cookie scripts, deploy adapters, or new dependencies unless the user explicitly asks for that launch item. If the user says `pagepilot start`, use `docs/pagepilot-start.md` first and recommend only the relevant next steps.

## Decide Before Launch

These are the core launch decisions. Handle them before optional tools.

1. Replace placeholder copy and images.
2. Confirm the production domain.
3. Set the production URL in `data/site.json`.
4. Set `launchStatus` to `live` only after all launch requirements are complete.
5. Confirm generated canonical, sitemap, and robots output uses the production URL.
6. Confirm the contact path: email link, hosted form, or native static form.
7. Run `pnpm build` and `pnpm pagepilot:check -- --launch`.

## Add Only If Needed

These items depend on the user's goals. Do not add all of them by default.

### Contact Form

Recommended default: [Tally](https://tally.so/pricing). It is simple to embed and usually cleaner than a Google Form for small static sites.

Fallback: [Google Forms](https://workspace.google.com/products/forms/). It is free and embeddable, but visually recognizable as Google.

Native HTML option: [Formspree](https://help.formspree.io/articles/account-management/account-limits). Use this when the site needs a custom static form and the expected submission volume fits the current provider limits.

Before adding a form:

1. Confirm the provider and destination email or workspace.
2. Confirm whether the contact page should embed a hosted form or use a native HTML form.
3. Update the privacy policy if submissions collect personal information.
4. Run `pnpm build` and `pnpm pagepilot:check`.

### Analytics

Use GA4 when a client expects standard Google Analytics reporting.

Use [Plausible Community Edition](https://plausible.io/self-hosted-web-analytics) only when self-hosting is acceptable. It is not the easiest default launch path.

Before adding analytics:

1. Confirm the analytics provider and property/site ID.
2. Confirm whether analytics requires cookie consent for the site audience.
3. Update `content/pages/privacy.json` to disclose analytics collection.
4. Add the tracking code only after explicit user approval.
5. Run `pnpm build` and `pnpm pagepilot:check`.

### Cookie Consent

Add cookie consent only if analytics, advertising, or marketing scripts are enabled.

Kit-friendly code option: [Orest Bida CookieConsent](https://cookieconsent.orestbida.com/). It is a free, open source, vanilla JS option that fits static Astro sites.

No-code option: [CookieYes](https://www.cookieyes.com/pricing/). Check current plan limits before launch.

Simple generator: [TermsFeed Cookie Consent](https://www.termsfeed.com/cookie-consent/). Useful for a lightweight generated banner.

Before adding consent:

1. Confirm which scripts set cookies or collect visitor data.
2. Confirm required regions and consent categories.
3. Keep consent copy aligned with the privacy policy.
4. Run `pnpm build` and `pnpm pagepilot:check`.

## Deploy Static Site

The site can deploy as a standard static Astro project. No PagePilot deploy adapter is required.

Recommended Vercel settings:

- Framework preset: `Astro`
- Install command: `pnpm install`
- Build command: `pnpm build`
- Output directory: `dist`

Before deploy:

1. Confirm the production URL and metadata are updated.
2. Run `pnpm build`.
3. Run `pnpm pagepilot:check`.
4. Deploy the generated static site.
5. Open the live site and inspect the homepage, contact page, sitemap, and robots file.

## Do After Deploy

These items only make sense after the production domain is live.

### SEO And Indexing

Submit the live sitemap to [Google Search Console](https://search.google.com/search-console/about) and [Bing Webmaster Tools](https://www.bing.com/webmasters).

Before submitting:

1. Confirm the live production domain.
2. Confirm `dist/sitemap.xml` uses the production URL.
3. Confirm `dist/robots.txt` points to the live sitemap.
4. Run `pnpm pagepilot:check -- --launch`.

### Quality Checks

Run [PageSpeed Insights](https://pagespeed.web.dev/) after deploy to check performance and Core Web Vitals.

Add [UptimeRobot](https://uptimerobot.com/) or a similar uptime monitor after the domain is live.

Before final launch handoff:

1. Record any provider IDs, dashboards, and owners outside the repo if they contain private account details.
2. Save any launch notes or owner-facing next steps in project documentation.
3. Re-run `pnpm pagepilot:check` after final content changes.

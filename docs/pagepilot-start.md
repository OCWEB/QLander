# PagePilot Start

Use this workflow when the user says `pagepilot start`, asks how to begin customizing the site, or wants launch guidance without seeing every optional checklist item at once.

The goal is to produce a short prioritized next-step checklist. Do not add integrations, scripts, dependencies, embeds, or deploy config unless the user explicitly asks after the intake.

## Intake Questions

Ask only the questions needed to decide the next step. If the user already answered one, do not ask it again.

1. What kind of site is this?
   - one-page landing page
   - full marketing site
   - blog or content site
   - small business brochure site

2. What is the primary goal?
   - collect leads or contact requests
   - build credibility
   - publish articles or updates
   - explain a product or service
   - keep a launch placeholder online

3. What stage is the site in?
   - planning
   - replacing placeholders
   - pre-launch
   - post-launch

4. What optional tools are needed now?
   - contact form
   - analytics
   - cookie consent
   - search indexing
   - PageSpeed review
   - uptime monitor

5. What is the domain/deploy status?
   - no domain yet
   - domain ready
   - needs deploy
   - already deployed

## Defaults

If the user is unsure, assume:

- site type: one-page landing page
- primary goal: explain the offer and collect contact requests
- stage: replacing placeholders
- optional tools: contact path first, analytics later
- deploy status: no production deploy yet

## Recommendation Rules

- Do not present the full launch checklist unless the user asks for it.
- Recommend no more than five next steps.
- Put content replacement before tools.
- Put deploy readiness before indexing, PageSpeed, or uptime monitoring.
- Recommend cookie consent only when analytics, advertising, or marketing scripts are planned.
- Keep external provider details in `docs/launch-checklist.md`; summarize choices here.

## Output Format

After intake, respond with:

```text
Recommended path: [one short sentence]

Next steps:
1. ...
2. ...
3. ...

Optional later:
- ...
```

## Common Paths

### One-Page Landing Page

Prioritize homepage copy, real images, contact path, production URL, deploy, then indexing.

Recommended optional tools:

- Tally or Google Forms if the user needs a quick contact form.
- GA4 only if reporting is expected.
- Cookie consent only if analytics or marketing scripts are enabled.

### Full Marketing Site

Prioritize navigation, page structure, homepage copy, product/service pages, SEO metadata, production URL, deploy, then indexing.

Recommended optional tools:

- Tally for lead forms.
- GA4 for common client reporting.
- PageSpeed after deploy.
- Uptime monitoring after the domain is live.

### Blog Or Content Site

Prioritize author/publisher settings, blog categories or tags, first posts, sitemap, production URL, deploy, then indexing.

Recommended optional tools:

- Search Console and Bing Webmaster Tools after deploy.
- Analytics only if the owner needs readership reporting.
- PageSpeed after deploy.

### Small Business Brochure Site

Prioritize business details, service descriptions, contact path, local credibility copy, production URL, deploy, then indexing.

Recommended optional tools:

- Tally or Google Forms for contact.
- GA4 only if the owner wants reporting.
- Uptime monitoring after the domain is live.

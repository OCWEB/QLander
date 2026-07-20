---
name: ppc-world
description: Build or revise a focused, single-purpose QLander landing page for PPC and paid-ad traffic. Use when a user asks for a paid campaign landing page, conversion page, ad-to-landing message match, a visual campaign journey, or an optional scroll-cinematic landing experience. Guides campaign intake, QLander's ppc layout, media-provider selection, annotated prompt placeholders, validation, and an opt-in handoff to the scroll-world skill.
---

# PPC World

Create one focused landing page for one audience, offer, traffic source, and conversion action. Preserve QLander's structured content workflow and do not add trackers, forms, third-party tools, or scroll runtimes unless the user explicitly requests them.

## Workflow

1. Read the repository `AGENTS.md`, approved `content/site-brief.md`, the target `content/pages/*.json`, and `qlander.edit-map.json`. For major work, run `qlander-discovery` first when the brief is missing, the official URL changed, or `lastReviewed` is more than 30 days old.
2. Reuse approved identity, audience, offer, proof, voice, palette, assets, sitemap, route, and image-plan decisions. Read [references/ppc-brief.md](references/ppc-brief.md), then ask only for missing campaign facts.
3. Ask whether the user wants a standard image-led landing or a scroll-driven cinematic landing. Do not silently choose scroll.
4. If they choose scroll, follow the opt-in workflow below before generating anything.
5. Choose media using [references/media-fallbacks.md](references/media-fallbacks.md). Default to Codex-generated stills with optional Magnific enhancement.
6. Implement the page using [references/qlander-contract.md](references/qlander-contract.md).
7. For a new standalone campaign repository, use the `single-page-ppc` initialization profile instead of manually deleting marketing routes. For one PPC page inside an existing site, keep the existing repository and apply `layout: "ppc"` only to the approved route.
8. Run the repository's required checks. QLander validates one primary CTA destination, one visible `h1`, and no normal site chrome on PPC pages. In QLander developer mode, run build, typecheck, tests, and `qlander:check`.

## Campaign Rules

- Keep one primary conversion action. Secondary links may clarify proof or terms but must not create a competing funnel.
- Match the ad's promise, vocabulary, audience, and offer in the visible hero.
- Use one visible `h1`, a specific outcome, credible proof, objection handling, and a repeated CTA.
- Use `layout: "ppc"` to remove normal site navigation and footer leakage.
- Keep claims evidence-backed. Never invent customer counts, ratings, savings, certifications, urgency, or testimonials.
- Do not add analytics, pixels, consent tools, or form providers unless the user explicitly requests them.
- Preserve placeholders when final media is unavailable. Never present generated or placeholder media as real customer evidence.

## Scroll Opt-In

Ask: “Do you want this to be a standard image-led PPC landing page, or a scroll-driven cinematic experience?”

If the user chooses scroll:

1. Explain that true cinematic scrubbing requires frame-locking video generation, extra QA, and larger assets. The bundled manual queue avoids agent/API generation calls but still requires the user to render the queued jobs in a compatible interface.
2. Ask whether an image-led scroll story is acceptable. If yes, stay in the QLander PPC workflow and use stills; do not install `scroll-world`.
3. If the user requires the continuous camera-flight effect, invoke the bundled `skills/scroll-world/SKILL.md` and check that the selected manual or automated video interface can frame-lock seams.
4. Default to Scroll World's manual slow queue. Pass the approved brand, audience, offer, palette, voice, proposed journey, CTA, and still-image plan, then ask only missing cinematic choices. Do not install an external skill or call a paid generation API by default.
5. If the user explicitly selects automated/API generation, follow Scroll World's provider, cost approval, generation, encoding, and seam-QA requirements.
6. Read [references/upstream-scroll-world.md](references/upstream-scroll-world.md) when reviewing the vendored runtime or syncing upstream changes.
7. In QLander, prefer the bundled internal-route adapter (`pnpm qlander:experience`) for a dedicated full-screen route. Use an external link-out only when explicitly approved. Do not iframe a scroll-scrub experience into a normally scrolling page or retrofit a standalone bundle into the site.

## Placeholder Deliverable

When final images are unavailable:

- Add stable `imagePromptId` values to placeholder-backed QLander sections.
- Create `content/prompts/<landing-slug>-image-prompts.md`.
- Use one `## <imagePromptId>` heading per placeholder, followed by the exact prompt, aspect ratio, intended placement, and manual generation notes.
- Keep the prompt free of fake logos, fake UI claims, fabricated people, and unsupported performance claims.
- Tell the user where the prompt document is and which placeholders it maps to.

## Handoff

Report the route, conversion action, selected media path, unresolved evidence/media gaps, changed content files, and verification results. If a paid or authenticated provider is blocked, name the exact missing capability without pretending generation succeeded.

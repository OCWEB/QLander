---
name: qlander-design-research
description: Research and compare visual directions for a new QLander site, redesign, rebrand, or substantial new experience. Use when the user asks QLander to find inspiration, recommend a style, redesign from a prompt or reference, or move beyond a generic visual treatment. Produces a sourced, approved design-research brief before qlander-design implements anything.
---

# QLander Design Research

Turn a product brief or redesign prompt into a small set of evidence-backed visual directions. Research principles to adapt, not pages to clone.

## Boundary

- Run after `qlander-discovery` has produced an approved `content/site-brief.md`.
- Run before `qlander-design` for new sites, redesigns, rebrands, and material visual changes.
- Skip for routine copy, SEO, navigation, or a small theme-token correction.
- Write only the sanctioned non-routed `content/design-research.md` before direction approval. Do not edit the site, generate assets, install tools, or create coded prototypes during this skill.
- Impeccable is optional execution and critique tooling for the later design pass. It is not required for research and must not be installed here.

## Source permission

1. Start with current user instructions, supplied references, the current QLander repository, explicitly named local paths, and supplied official websites.
2. Broader design galleries, competitors, component libraries, or public websites count as public web research. Use them only when the user explicitly requested design research or approved public web research in the discovery approval.
3. If that permission is absent, ask once in the combined source-scope gate; do not browse first and apologize later.
4. Never log into private services, bypass access controls, or inspect unrelated local projects.

## Design token invariants

Variation changes where QLander looks for inspiration, not the approved brand system.

1. Before selecting external sources, record the design token invariants from the approved site brief, `data/theme.json`, supplied brand assets, and any previously approved design research. Include semantic color roles, locked hex values when approved, radius, typography commitments, spacing or density character, motion policy, and imagery character.
2. Mark each invariant `locked` or `provisional`. Existing approved tokens are locked. Starter-wireframe values may remain provisional until the first `qlander-design` approval.
3. All aesthetic families in one run must demonstrate different layout, hierarchy, component, or art-direction ideas through the same locked invariants. Do not create variation by silently swapping brand colors, radius personality, or type commitments.
4. The QLander file `data/theme.json` remains authoritative for color and radius tokens; in other words, theme.json remains authoritative after implementation. External references and Impeccable cannot overwrite it. A repeated research run may recommend a token change only as an explicit rebrand hypothesis requiring a new `qlander-design` approval.

## Source mix and repeat variation

Create a fresh but accountable mix on each research run.

### Candidate pools

- **Relevant shipped sites:** at least two public sites serving a comparable audience, offer, content shape, or interaction problem. Choose these for relevance rather than fame.
- **Visual discovery:** [Pinterest](https://www.pinterest.com/), [Dribbble](https://dribbble.com/), [Awwwards](https://www.awwwards.com/), [One Page Love](https://onepagelove.com/), [SiteInspire](https://www.siteinspire.com/), [Land-book](https://land-book.com/), and [Lapa Ninja](https://www.lapa.ninja/).
- **Components and interaction patterns:** [21st.dev](https://21st.dev/), [Mobbin](https://mobbin.com/), and [UIverse](https://uiverse.io/).
- **Typography and editorial systems:** [Typewolf](https://www.typewolf.com/) and [Fonts In Use](https://fontsinuse.com/).

These are candidate discovery sources, not mandatory endorsements. Check current accessibility before relying on one. If a source requires login, blocks automated access, is unavailable, or no longer serves the stated purpose, do not bypass it; rotate to another source in the same pool and record the substitution.

### Selection method

1. Give the run a unique `researchRunId` and read the source-mix history already recorded in `content/design-research.md` when it exists.
2. Shortlist sources that fit the brief, then choose **randomized without replacement** from that relevant shortlist: normally two shipped sites, two visual-discovery sources, one component source, and one typography source when typography is material.
3. On repeated runs, do not repeat the exact source mix used by any of the previous three recorded runs when another relevant combination is available. Rotate at least one visual-discovery source and one component or typography source.
4. Randomization controls discovery breadth, not recommendation quality. Keep only references that survive evidence, accessibility, feasibility, and brand-fit review.
5. Record selected, skipped, blocked, and replacement sources. Preserve a compact run history before replacing a prior proposed or approved result.

## Research workflow

1. Read `AGENTS.md`, the approved `content/site-brief.md`, current pages, `data/theme.json`, existing brand assets, the prior `content/design-research.md` when present, and [references/design-research-template.md](references/design-research-template.md).
2. Restate the design problem and design token invariants: audience, primary action, brand personality, content density, accessibility needs, implementation constraints, and explicit likes/dislikes.
3. For a redesign, evaluate the existing site before external references. Record what should be preserved, repaired, or removed.
4. Create and record the run's varied source mix, then research the whole page, not only the hero. Cover relevant examples of navigation, hero composition, body rhythm, content modules, typography, calls to action, imagery, responsive behavior, and purposeful motion.
5. Build **3 to 5 distinct aesthetic families**. Each must differ in structure and visual logic, not merely color. Avoid presenting five near-identical fashionable landing pages.
6. For every reference, record the reference URL, review date, exact page or component observed, transferable principles, fit to the brief, accessibility or usability risks, and asset-rights status. A screenshot without a source URL is supporting evidence, not provenance.
7. Score each direction from 1 to 5 for audience fit, brand distinctiveness, conversion clarity, content fit, accessibility, responsive feasibility, performance, and QLander implementation cost. Explain material trade-offs; do not hide them inside a total.
8. Name anti-goals and recurring AI-design tells to avoid. Guardrails must be specific to this project rather than a universal ban on a particular aesthetic.
9. Write `content/design-research.md` with `status: proposed`. Present one compact approval covering the recommended direction, acceptable fallback, principles to adapt, patterns to avoid, and unresolved rights or feasibility questions.
10. After the user selects a direction, update the file to `status: approved`, record the selection and approval date, then hand it to `qlander-design`. Do not implement during this step.

## Reference rules

- Prefer real, shipped sites whose audience or communication problem is relevant. Use galleries and social feeds for discovery, not as the only evidence.
- Include component libraries only when a component pattern materially helps the approved page goal.
- Separate observation from interpretation. “Uses a sticky chapter index” is evidence; “this will improve conversion” is a hypothesis.
- Do not copy another site's composition, code, copy, branding, illustrations, or distinctive trade dress. Combine abstract principles from multiple references and make the result specific to the approved QLander brief.
- A public URL is not permission to reuse its images, fonts, icons, or code. Mark reusable assets `authorized` only from user confirmation or an explicit compatible license.
- Reject references whose effect depends on unreadable type, weak contrast, inaccessible interaction, excessive motion, or desktop-only behavior unless the direction explicitly replaces those mechanics.

## Deliverable quality

`content/design-research.md` must include:

- source scope, `researchRunId`, selected source mix, substitutions, and direct URLs
- the latest three source-mix history entries for repeat variation
- locked and provisional design token invariants
- existing-site findings for redesigns
- 3 to 5 aesthetic families with concise vocabulary
- whole-page and component observations
- a direction scorecard
- recommended direction and fallback
- accessibility, responsiveness, performance, and rights risks
- project-specific anti-goals
- approval status and selected direction

The artifact is design evidence, not a mood-board dump. Every recommendation should trace to the site brief, an observed reference, or a clearly labeled design hypothesis.

## Handoff to qlander-design

Pass the approved direction, scorecard, source URLs, transferable principles, anti-goals, media implications, and any sanctioned template-tier needs. `qlander-design` owns palette contrast checks, final typography and motion proposals, optional Impeccable consent, implementation, and verification.

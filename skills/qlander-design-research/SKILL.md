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

1. Before selecting external sources, record design token invariants from the approved site brief, `data/theme.json`, `data/design-system.json`, supplied brand assets, and prior approved research. Include semantic color roles, locked hex values, radius, typography roles, spacing and width rhythm, component treatment, motion policy, and imagery character.
2. Mark each invariant `locked` or `provisional`. Existing approved tokens are locked. Starter-wireframe values may remain provisional until the first `qlander-design` approval.
3. All aesthetic families in one run must demonstrate different layout, hierarchy, component, or art-direction ideas through the same locked invariants. Do not create variation by silently swapping brand colors, radius personality, or type commitments.
4. `data/theme.json` remains authoritative for color and radius (theme.json remains authoritative after implementation). `data/design-system.json` remains authoritative for typography, spacing, widths, component treatment, and motion across components and pages. External references and optional tools cannot overwrite either silently.

## Source mix and repeat variation

Create a fresh but accountable mix on each research run.

### Candidate pools

- **Relevant shipped sites:** at least two public sites serving a comparable audience, offer, content shape, or interaction problem. Choose these for relevance rather than fame.
- **Visual discovery:** [Pinterest](https://www.pinterest.com/), [Dribbble](https://dribbble.com/), [Awwwards](https://www.awwwards.com/), [One Page Love](https://onepagelove.com/), [SiteInspire](https://www.siteinspire.com/), [Land-book](https://land-book.com/), and [Lapa Ninja](https://www.lapa.ninja/).
- **Components and interaction patterns:** [21st.dev](https://21st.dev/), [Mobbin](https://mobbin.com/), and [UIverse](https://uiverse.io/).
- **Typography and editorial systems:** [Typewolf](https://www.typewolf.com/) and [Fonts In Use](https://fontsinuse.com/).

These are candidate discovery sources, not mandatory endorsements. Check current accessibility before relying on one. If a source requires login, blocks automated access, is unavailable, or no longer serves the stated purpose, do not bypass it; rotate to another source in the same pool and record the substitution.

### Source-health cache

Maintain a short-lived **per-campaign source-health cache** in campaign working notes or orchestrator state. Cache URL/host, checked time, `healthy | blocked | unavailable`, reason, and selected substitute for at most **24 hours**; do not treat it as permanent source reputation or carry it into an unrelated campaign. Reuse a fresh result to avoid repeatedly calling a known-blocked source. When blocked, choose a brief-relevant substitution from the same candidate pool and record both direct URLs and the reason. Never log in, bypass controls, or weaken the source mix just to retain a randomly selected host.

During a frozen audit, record cache entries and blocked-source substitutions in the case feedback/source ledger only. Do not modify the kit to work around a campaign's blocked source; proposed kit changes remain friction for later maintainer review.

### Selection method

1. Give the run a unique `researchRunId` and read the source-mix history already recorded in `content/design-research.md` when it exists.
2. Shortlist sources that fit the brief, then choose **randomized without replacement** from that relevant shortlist: normally two shipped sites, two visual-discovery sources, one component source, and one typography source when typography is material.
3. On repeated runs, do not repeat the exact source mix used by any of the previous three recorded runs when another relevant combination is available. Rotate at least one visual-discovery source and one component or typography source.
4. Randomization controls discovery breadth, not recommendation quality. Keep only references that survive evidence, accessibility, feasibility, and brand-fit review.
5. Record selected, skipped, blocked, and replacement sources. Preserve a compact run history before replacing a prior proposed or approved result.
6. When most of the shortlist is blocked or unavailable and rotation cannot fill the normal mix, a reduced mix is acceptable: proceed with the sources you can reach (at minimum two independent relevant references), and record the blocked sources and the reduced count in the run history. Do not stall the pass or fabricate observations for a source you could not open.

## Screenshot-backed evidence

Text-only research is incomplete. A direction is not researchable from prose about a page; it is researchable from the page's rendered geometry.

1. **Capture through a browser context, never a fetch.** Earlier QLander runs recorded sofi.com, land-book.com, lapa.ninja, and uiverse.io as 403 blocked. A later run captured sofi.com on the first attempt through a real browser. The sites did not change; the access method did. Before recording any source as blocked, retry it in a browser.
2. **Plan the pool before capturing.** Write 5 to 8 ranked candidates, then run `pnpm qlander:design:capture -- plan --root . --run <run-id> --pool pool.json`. The manifest records every candidate before any navigation, so the run cannot be quietly narrowed to whatever happened to work.
3. **Walk the pool with the ledger.** `next` returns the next candidate or the reason to stop. `record` appends the attempt outcome. `ingest` hashes each image into the run directory. Never write the manifest by hand.
4. **Target 2 successful captures, cap at 4, budget 8 attempts.** Stopping at the target marks the remainder `skipped-satisfied`, which is a healthy run. Exhausting the budget marks them `skipped-budget`, which is not.
5. **A consent banner is not a block.** Attempt one dismissal, then record `captured-obstructed` and keep the reference. Rotating on consent walls discards good evidence.
6. **Rotate on:** HTTP errors, timeouts, bot challenges, blank renders, and identity mismatches. Record the real outcome. Never fabricate a screenshot or an observation for a source you could not open.
7. **Capture desktop and mobile.** Set the mobile viewport by **emulation**, not window resize. Some drivers silently floor a resize near 500px, so a capture labelled 390 is actually 500 and every mobile conclusion drawn from it is wrong. `ingest` will reject a mobile capture whose realized width missed the request.

### When capture is not possible

Fall back in this order and record which rung you used:

1. **Ask the user for screenshots.** Do this as soon as 3 consecutive rotations fail, not after exhausting the pool. Ingest them with `--supplied`.
2. **Partial evidence:** one capture plus one user-supplied image. The direction proceeds.
3. **Text-only, with explicit user approval.** Record `researchException` with approver, timestamp, and reason. This produces a permanent warning on every later check and is never silently upgraded to a pass.
4. **Abort the direction** and propose another.

Rungs 3 and 4 need the user. Rungs 1 and 2 do not.

### Evidence handling

- Reference screenshots are evidence, not site assets. They stay in `.qlander/design-research/<run-id>/references/`, which is gitignored by default.
- Commit manifests, URLs, hashes, and observations. Commit an image only when the user supplied it or explicitly authorized it.
- Never place captures in `public/` or `dist/`, where the build would publish them.
- Build a compact `reference-board.html` per direction from the local evidence. It is a review aid and must never be published.

## Research workflow

1. Read `AGENTS.md`, the approved `content/site-brief.md`, current pages, `data/theme.json`, `data/design-system.json`, existing brand assets, prior `content/design-research.md`, and the research template.
2. Restate the design problem and design token invariants: audience, primary action, brand personality, content density, accessibility needs, implementation constraints, and explicit likes/dislikes.
3. For a redesign, evaluate the existing site before external references. Record what should be preserved, repaired, or removed.
4. Create and record the run's varied source mix, then research the whole page, not only the hero. Cover relevant examples of navigation, hero composition, body rhythm, content modules, typography, calls to action, imagery, responsive behavior, and purposeful motion.
5. Build **3 to 5 distinct aesthetic families**. Each must differ in structure and visual logic, not merely color. Avoid presenting five near-identical fashionable landing pages.
6. For every reference, record the reference URL, review date, exact page or component observed, transferable principles, fit to the brief, accessibility or usability risks, and asset-rights status. A screenshot without a source URL is supporting evidence, not provenance.
6b. Complete the layout-extraction table in `references/layout-extraction-template.md` for every direction you propose. Prose about a reference is not layout extraction; the table is what `qlander-design` turns into a blueprint.
7. Score each direction from 1 to 5 for audience fit, brand distinctiveness, conversion clarity, content fit, accessibility, responsive feasibility, performance, and QLander implementation cost. Explain material trade-offs; do not hide them inside a total.
8. Name anti-goals and recurring AI-design tells to avoid. Guardrails must be specific to this project rather than a universal ban on a particular aesthetic.
9. Write `content/design-research.md` with `status: proposed`. Include a design-system handoff and at least one material page/section layout-handoff plan for every prompted project. Present one compact approval covering the direction, fallback, shared tokens, structural handoffs, anti-goals, and unresolved rights or feasibility questions.
10. After the user selects a direction, update the file to `status: approved`, record the selection and approval date, then hand it to `qlander-design`. Research approval authorizes the named design-system and layout proposal for execution; it does not make the untouched starter a finished design.

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
- a reference manifest path, with capture counts and the full attempt outcome tally
- a completed layout-extraction table per proposed direction
- the fallback rung used, when captures were not possible
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

Pass the approved direction, scorecard, source URLs, transferable principles, anti-goals, media implications, the complete shared design-system decisions, the reference manifest path with its run ID, the completed layout-extraction table, and named page/section handoffs. `qlander-design` owns contrast checks, final token persistence, renderer registration, optional tool consent, implementation, and verification. Prompted work may not conclude with all primary content still using starter renderers.

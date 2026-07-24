# Layout-first visual review checklist

The checker validates contracts and provenance. It cannot tell you whether the page is any good, and it does not try. This checklist is the human gate, and it runs **twice**: once on the bare skeleton before final copy, and once on the populated page.

## Evidence set

Assemble all four before reviewing. A review with fewer is incomplete.

1. **Fallback baseline** — the project's own content rendered with no handoffs registered. This is what the design must beat, and it is a far more honest baseline than the shipped starter page.
2. **Reference board** — the approved captures from `.qlander/design-research/<run-id>/references/`, local only.
3. **Skeleton, desktop and phone** — the renderer with placeholder slot content, before final copy.
4. **Populated, desktop and phone** — the finished page.

Capture desktop at 1440 and phone at 390. **Set the phone viewport by emulation, not window resize.** Some drivers silently floor a resize near 500px, so a screenshot labelled 390 can actually be 500 and every conclusion drawn from it is wrong. Verify `window.innerWidth` is what you asked for before trusting the image.

## Gate 1: skeleton review, before final copy

Run this while the page still shows placeholders. Approving the silhouette here is cheap; discovering it later means rewriting copy.

- [ ] Is the page silhouette visibly different from the fallback baseline, not just recolored?
- [ ] Does the section order reflect a research decision, or is it still content-file order?
- [ ] Is each section's primitive the one the blueprint declared?
- [ ] Do the slot targets look plausible against the real copy lengths you are about to write?
- [ ] Are placeholders visibly marked non-final, so nobody mistakes this for a finished page?

Stop and revise the blueprint here if the answer to any of the first three is no. Do not proceed to copy.

## Gate 2: populated review

### Composition

- [ ] Is the silhouette derived from the approved principles rather than the starter frame?
- [ ] Can you point at the reference evidence for each major structural decision?
- [ ] Are reference influences traceable **without** reproducing distinctive trade dress, branding, illustration style, or copy?
- [ ] Did the anti-copy substitution actually happen? Where references carried metrics, testimonials, or rates the project does not have, is that structural position carrying something real instead of being quietly deleted?

### Content fit

- [ ] Does content fit naturally, with no tiny type, clipping, overflow, or artificial filler?
- [ ] If copy did not fit, was the **blueprint** revised rather than the content distorted or the type shrunk?
- [ ] Is every fact still source-backed? Fitting a layout permits shortening, grouping, and relabelling. It never permits inventing proof.
- [ ] Is any structured-looking content genuinely structured, rather than derived by parsing prose? Splitting a paragraph on sentence boundaries mangles abbreviations into fragments that read as false statements.

### Mobile

- [ ] Does the phone layout preserve hierarchy, or does it merely stack everything in source order?
- [ ] `document.documentElement.scrollWidth === window.innerWidth` at 390?
- [ ] Does any element extend past the viewport, even without causing document overflow? Watch for `min-height` combined with `aspect-ratio`, which over-constrains width and pushes media out of its column.
- [ ] Are tap targets, disclosure controls, and text still comfortable at 390?

### Contracts

- [ ] Every section root still carries its `data-pp-edit-id`, unchanged across reordering.
- [ ] Exactly one visible `h1`. Alt text on every image. No new routes.
- [ ] Colors, radius, typography, and spacing come from tokens, with no hardcoded values.
- [ ] Delegated shared components do not fight the page: watch the alignment seam where a centered component sits inside a left-aligned page.
- [ ] No motion added yet. Candidates belong in `todo_motion-polish.md` after this gate passes.

## What this checklist deliberately does not do

It does not score originality, taste, or quality, and neither does the checker. The automated divergence score answers one narrow question, "how much of this page did the project actually compose", and a page can score well while still being a bad design. That judgement is yours.

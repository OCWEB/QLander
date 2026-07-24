# Owner proxy rules

Deterministic answers the auditor gives at the combined approval gate in batch mode, so runs are comparable across sites. Record every applied rule in the feedback file's approval appendix.

## Facts and proof

- Unverifiable claims (years in business, customer counts, awards): drop, record as `needs-confirmation`.
- Testimonials and case results: reuse only when verified verbatim on the owner's own official site, with exact attribution. Never invent, never paraphrase into stronger claims.
- Pricing, certifications, guarantees, regulated claims: only if verified on the official site; otherwise omit.
- Clone-look subject facts come only from the case's fictional business brief; if the brief lacks a fact, the site goes without it.

## Contact and identity

- Keep only verified or case-supplied contact methods. Email-only is fine. Never keep starter dummy values.
- No domain in the case: keep the placeholder URL and draft/noindex mode.
- No logo supplied: text wordmark placeholder.
- No social profiles unless supplied or verified.

## Owner-published but dubious data

- Data on the owner's own site that looks like tooling placeholders (555 or obviously dummy phone numbers, lorem text, template boilerplate): mark `needs-confirmation` and omit rather than carry over.
- If population reveals something the approval package did not cover, record an explicit approval amendment in the feedback appendix before acting; batch mode may self-amend using these rules but must log it.

## Structure

- Approve the proposed sitemap unless it violates a fact rule.
- Demo routes the case does not need (blog, starter products): remove from navigation; prefer the lightest data-tier removal (empty collection, noindex). Template-tier route edits only when the approved sitemap requires them, following the developer-mode rules in `AGENTS.md`.
- All CTAs point at the contact route unless the case supplies a real destination.

## Media

- Approve the image plan with zero generation: annotated placeholders plus documented prompts for every slot.
- Never download or reuse reference-site or third-party assets. Owner-site assets are recorded as available but still not downloaded during an audit.

## Design

- If the case requests finished design: approve one palette following the `qlander-design` recipe, require measured contrast ratios in the report, radius 8 or below. Template-tier items (fonts, motion, gradients) only where that skill sanctions them.
- Otherwise: keep the grayscale wireframe; data-tier theme tokens only.

# Population and specialist handoffs

## Populate QLander

After the combined approval:

1. Update `data/site.json`, `data/navigation.json`, and `data/theme.json` from approved facts.
2. Populate the required structured page, product/service, and blog content for the chosen site type.
3. Preserve one visible `h1`, complete SEO metadata, intentional CTA destinations, and source-backed claims.
4. Add routes to `qlander.manifest.json` and navigation only when the approved sitemap requires them.
5. Update `qlander.edit-map.json` whenever section IDs, order, safe fields, or routes change.
6. Add approved or generated media under `public/images/` with alt text and intrinsic dimensions.
7. For unresolved media, add `imagePromptId` values and matching prompt-document headings.

Do not expose `content/site-brief.md` as a route. Its absence, age, or approval status is advisory and must not make `qlander:check` fail.

## Page experience mapping

- `standard`: normal QLander page and site chrome
- `focused-landing`: focused conversion layout such as `layout: "ppc"`
- `image-scroll`: still-image narrative with optional progressive JavaScript enhancement

Record the selection in the brief even when the corresponding renderer is planned for later implementation.

## PPC World handoff

Pass identity, audience, offer, approved proof, primary action, route, voice, palette, assets, and image plan. PPC World asks only for missing campaign intent, traffic/message match, offer constraints, objections, and conversion-specific decisions.

## Scroll World handoff

Continuous cinematic scroll is not part of this kit. Hand the approved brand, audience,
story, palette, tone, proposed journey, scene candidates, and CTA to the Scroll World
skill in the sibling `qlander-design` repository, which brings its own runtime and route
adapter.

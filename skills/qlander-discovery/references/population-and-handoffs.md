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
- `scroll-section`: scoped sticky Scroll World sequence between normal page sections
- `scroll-world`: dedicated cinematic experience requiring the specialist workflow and a compatible video path

Record the selection in the brief even when the corresponding renderer is planned for later implementation.

## PPC World handoff

Pass identity, audience, offer, approved proof, primary action, route, voice, palette, assets, and image plan. PPC World asks only for missing campaign intent, traffic/message match, offer constraints, objections, and conversion-specific decisions.

## Scroll World handoff

Pass brand name, audience, business story, palette, tone, art direction when approved, proposed page journey, scene candidates, CTA, and approved still-image assets/prompts. Scroll World asks only for missing scene order/copy, motion grammar, native mobile choice, compatible video provider, budget approval, and cinematic QA decisions.

Use the bundled `skills/scroll-world/SKILL.md`; no separate skill installation is required.
Default to its manual slow queue after the cinematic page experience is approved. The
user renders the queued still/video jobs and returns exact-named files; the agent performs
local ingest, frame extraction, seam QA, walkthrough generation, and wiring. Keep
`queue.md` and `queue.json` synchronized. In a multi-page site, register a dedicated
internal route with `pnpm qlander:experience`, or use `--section --page <page> --after
<section-id>` for an approved inline experience. Keep the rest of the sitemap unchanged.
For a standalone root experience, initialize the `root-scroll-world` profile;
do not retrofit a standalone generated page. Use a
paid or automated provider path only after explicit approval. If no compatible
frame-locking video path is available, keep the registered still-based fallback or fall
back to `image-scroll` without pretending it is continuous video.

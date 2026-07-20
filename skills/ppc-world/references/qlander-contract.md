# QLander contract

## Standard PPC landing

1. Work in the target `content/pages/*.json` file and preserve its route.
2. Set top-level `layout` to `"ppc"` to render the minimal landing chrome.
3. Reuse QLander sections in this order when appropriate: `hero`, `featureGrid`, `richText`, `cta`.
4. Point every primary CTA at the same safe destination.
5. Update `qlander.edit-map.json` when section IDs, order, or safe fields change.
6. Keep one visible `h1`, complete SEO metadata, and intentional `noindex` behavior.

Creating a new route is developer mode unless an existing route pattern supports it. Update `qlander.manifest.json` when a route is added or removed.

## Placeholder prompts

Supported placeholder fields:

- `hero.imagePromptId`
- `featureGrid.items[].imagePromptId`
- `richText.imagePromptId`

Each ID must match a `## <id>` heading in a Markdown file under `content/prompts/`. QLander validation rejects unresolved prompt IDs.

Example:

```json
{
  "type": "hero",
  "imagePromptId": "campaign.hero-visual"
}
```

```markdown
## campaign.hero-visual

Purpose: hero image for a paid-search landing page.
Aspect ratio: 1:1 desktop-safe composition.
Prompt: ...
```

## Scroll version

With Codex + Magnific, default to an image-led narrative using QLander sections and optimized stills. Do not label it as a continuous camera flight.

Do not add an improvised scrub script to a normal QLander page. If the user requires true cinematic video and approves a compatible frame-locking path, use the bundled `skills/scroll-world/` skill with its default manual queue and either:

- register a dedicated full-screen experience route with `pnpm qlander:experience` and link the PPC CTA/visual to it; or
- initialize a separate `root-scroll-world` project when the cinematic experience is an approved external link-out; or
- host the generated experience separately and use an HTTPS link-out.

Keep the standard landing usable with its poster and copy when motion is unavailable or reduced motion is requested.

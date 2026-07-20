# Media capability ladder

Use the first viable path. Confirm availability and authentication before promising output.

1. User-supplied assets
   - Prefer real product, service, team, location, interface, or campaign creative.
   - Preserve provenance and do not alter evidence without permission.

2. GPT Image through Codex
   - Use Codex image generation for the initial cohesive still set when available.
   - Use one approved style preamble, composition system, and image source across the set.
   - Explain that still images do not replace scroll-cinematic video clips.

3. Magnific generation or enhancement
   - Use only when a callable Magnific API, connector, CLI, or user-controlled browser workflow is actually available.
   - Use it after Codex generation when the user wants enhancement/upscaling, or as the still generator when the live account supports that workflow.
   - Treat it as a still-image tool unless a verified live capability proves otherwise.
   - Never ask for account credentials or claim an automated API exists without verifying it.

4. Scroll World manual queue
   - Use only after the user approves a continuous Scroll World experience.
   - Default to the bundled skill's `queue.md` + `results/` handoff instead of an API.
   - Confirm the live video interface supports the required start/end frame controls
     before promising seamless connectors.
   - Provider account terms still apply; "manual" means QLander makes no generation
     API call, not that every account is necessarily free.

5. Annotated placeholders
   - Keep QLander's obvious grayscale placeholders.
   - Add `imagePromptId` values and a prompt document under `content/prompts/`.
   - Write prompts so the user can paste them into their preferred image tool manually.

## Prompt pattern

```text
Purpose and placement. Subject and action. Environment and composition. Brand palette.
Lighting and art direction. Camera angle and aspect ratio. Accessibility-relevant visual
details. No text, no letters, no logos, no unsupported claims, no watermarks.
```

For a paid-ad landing, make the hero visual reinforce the ad promise within one glance. Decorative spectacle must not obscure the offer or CTA.

## Cinematic limitation

Codex or still-only Magnific workflows can produce an image-led landing or still-based scroll narrative. Do not describe that output as the original continuous 3D camera flight. That effect requires a video interface that preserves exact seam frames. After the experience is approved, use the bundled Scroll World skill and its manual queue by default; otherwise fall back to `image-scroll`.

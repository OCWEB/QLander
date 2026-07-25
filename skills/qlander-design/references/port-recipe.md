# Porting an external design into QLander

Use when a finished page already exists outside the kit: a Lovable or v0 build, a
hand coded HTML page, a themed template, or a page an agent produced from a direct
prompt. The design is the input. QLander supplies structure, provenance, and the
edit contract.

Run this in two passes. Do not mix them.

## Pass 0: survey what will not survive

Ten minutes here saves a port that gets rejected at the end. Check all four before
writing anything, and put the answers in the combined approval, because two of them
can be dealbreakers the user has to decide on.

1. **Count the source's colour roles.** `ThemeSchema` allows exactly five and the
   palette recipe requires `accentDark` to be the same hue as `accent`, stepped
   darker. **A two-hue design cannot be represented.** If the source pairs a primary
   with a signature second hue on CTAs or accents, that hue is gone, and it is
   usually the most recognizable thing about the page. Say so before porting, not
   after. Neutral extras (`ink-soft`, `paper-2`, hairlines) are fine; derive them
   with `color-mix` in the renderer.
2. **Check the typefaces against `public/fonts/`.** Four OFL faces ship: Fraunces,
   Newsreader, Space Grotesk, Work Sans. A CDN source has to substitute, since
   QLander forbids font CDN links. Name the substitution and how close it is.
3. **Count text slots per section.** Section types are fixed. `hero` has three text
   fields (`eyebrow`, `headline`, `subheadline`); designs routinely use five or six,
   with a tagline set as a second heading. Merging them into `subheadline` flattens
   the source's typographic hierarchy. Decide per section whether to merge, drop, or
   diverge.
4. **Note anything with no token slot.** Fluid `clamp()` section padding collapses to
   one integer `spacing.sectionY`. Per element heading leading collapses to one
   `headingLeading`. Background gradient washes, `backdrop-filter`, and custom easing
   curves have no representation at all; approximate with `color-mix` where cheap and
   drop the rest.

## Pass 1: lift

Reproduce the design faithfully before restructuring anything.

1. **Extract tokens first.** Read the source's colors, radius, families, weights,
   leading, tracking, type scale, section rhythm, and content widths. Write them
   into `data/theme.json` and `data/design-system.json`. `ThemeSchema` is strict:
   exactly `colors.{ink,paper,muted,accent,accentDark}` plus `radius` 0 to 8. A
   source with more than five roles has to collapse into those five; record which
   source colors merged and why.
2. **Tailwind sources need a decision, not a guess.** Utility classes carry the
   design inline. Either map the Tailwind config's theme onto QLander's tokens and
   drop the utilities, or keep Tailwind and accept that `qlander:check` can no
   longer prove token discipline. Name the choice in the approval. Mapping is the
   default.
3. **Strip what a marketing page should not inherit.** Component library runtimes,
   client state, analytics, form providers, and backend SDKs do not come across
   unless the user asked for them.
4. **Build one page renderer** under `src/design/<direction-slug>/`, following
   [layout-handoff-recipe.md](layout-handoff-recipe.md). Copy the source's
   geometry, not its markup. Colors resolve through `var(--ink|--paper|--muted|
   --accent|--accentDark)`, radius through `var(--radius)`, type and spacing
   through the design system variables. No hex, no font names, no literal spacing.
5. **Carry the source's placeholder marking across.** A design built to a thin brief
   usually marks its own empty slots, and an empty `aria-hidden` box in the renderer
   is not a marked placeholder. Every media slot and unfilled text slot keeps a
   visible label. Losing the marking is the easiest mistake in the whole port,
   because the page still looks finished.
6. **Verify fidelity before continuing.** Load the source and the port side by side
   at desktop and phone width. Record every deliberate divergence.

At the end of pass 1 the copy may still be hardcoded in the renderer. That is
expected.

## Pass 2: shift

Move content out of the renderer and into the structured tier.

1. Split the page into sections that match QLander's content vocabulary in
   `src/lib/schemas.ts`. A section that fits no existing type is a signal to
   reshape the section, not to add a schema type.
2. Move every string, list, and image reference into
   `content/pages/<page>.json`. The renderer reads props and holds no copy.
3. Give each section root `data-pp-edit-id={section.id}` and add a matching entry
   to `qlander.edit-map.json` with the correct `jsonPath` index, component name,
   and `safeFields`.
4. Check facts against the approved `content/site-brief.md`. A ported design often
   arrives with invented statistics, testimonials, and client names. Replace every
   unverifiable claim with a visibly marked placeholder or remove the slot.
5. Register the renderer in `src/layout-handoffs.ts` and in
   `qlander.manifest.json` under `design.handoffs`.

Do one schema or content change at a time. A pass 2 that also adjusts the visual
design loses the fidelity pass 1 established.

## Port record

Add to `content/design-research.md`:

- source of the design, with URL or path and date
- tool or agent that produced it
- token extraction table: source value, QLander token, any collapse or rounding
- Tailwind decision, when applicable
- **a "what the port lost" section**, one entry per Pass 0 finding, stated plainly
- what was stripped and why
- claims removed as unverifiable
- fidelity divergences from the source, with reasons

The loss list is the honest part of the artifact. A port record with no losses is
almost always a port that was not compared against its source.

## Verification

`pnpm build`, `pnpm typecheck`, `pnpm qlander:check`. Then confirm in a browser:
no horizontal scroll at 390px, exactly one visible `h1`, every section edit id
present in the DOM, and computed font sizes matching the design system rather
than the 16px fallback.

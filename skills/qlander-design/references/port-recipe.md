# Porting an external design into QLander

Use when a finished page already exists outside the kit: a Lovable or v0 build, a
hand coded HTML page, a themed template, or a page an agent produced from a direct
prompt. The design is the input. QLander supplies structure, provenance, and the
edit contract.

Run this in two passes. Do not mix them.

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
5. **Verify fidelity before continuing.** Compare the ported page against the
   source at desktop and phone width. Record any deliberate divergence.

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
- what was stripped and why
- claims removed as unverifiable
- fidelity divergences from the source, with reasons

## Verification

`pnpm build`, `pnpm typecheck`, `pnpm qlander:check`. Then confirm in a browser:
no horizontal scroll at 390px, exactly one visible `h1`, every section edit id
present in the DOM, and computed font sizes matching the design system rather
than the 16px fallback.

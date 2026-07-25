# Design direction and provenance

Every prompted project needs one approved direction recorded in non-routed
`content/design-research.md`. The checker requires the file, `status: approved`,
and a `selectedDirection` that matches `qlander.manifest.json.design.direction`
verbatim.

A direction can come from three places. Record which one, because the provenance
rules differ.

| Origin | When | What to record |
| --- | --- | --- |
| Supplied | The user has a brand system, a Figma file, or a finished page built elsewhere (Lovable, v0, a direct prompt to another agent). | The source, its date, and the extracted tokens. Follow [port-recipe.md](port-recipe.md). |
| Derived | The user has brand assets but no layout direction. | The assets used and the decisions taken from them. |
| Proposed | Nothing exists and QLander proposes a palette and system from the site brief. | The brief facts the proposal answers to. |

Supplied is the default for a finished visual design. QLander is better at holding
a design stable than at inventing one, so prefer designing outside the kit and
porting in.

## Token invariants

Record every design token as `locked` or `provisional` before implementation.

- Existing approved values in `data/theme.json` and `data/design-system.json` are
  locked. Changing one requires naming it in the combined approval.
- Starter wireframe values stay provisional until the first `qlander-design`
  approval, then become locked.
- `data/theme.json` stays authoritative for color and radius.
  `data/design-system.json` stays authoritative for typography, spacing, widths,
  component treatment, and motion. A renderer never hardcodes any of them.

## Required contents of content/design-research.md

Frontmatter: `status` and `selectedDirection`.

Body:

1. Origin of the direction, with source URLs or file paths and the date reviewed.
2. Locked and provisional token invariants with their values.
3. The direction in plain vocabulary: structure, hierarchy, density, imagery
   character, motion policy.
4. Accessibility and responsiveness notes, including measured contrast ratios.
5. Project specific anti goals.
6. For a ported design, the port record from [port-recipe.md](port-recipe.md).

## Rights

A public URL is not permission to reuse images, fonts, icons, or code. Mark an
asset reusable only on user confirmation or an explicit compatible license. Do
not copy another site's composition, copy, branding, or distinctive trade dress.

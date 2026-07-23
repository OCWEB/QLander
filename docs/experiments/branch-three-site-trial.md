# Branch three-site QLander trial

Date: 2026-07-19
Source commit: `5ecac5ff6bcdcc41b559d520739ab358889a3d4a`
Source: current local working-tree snapshot, not an older GitHub release

## Trial setup

Three independent repositories were created without source `.git`, dependency
directories, caches, or build output. Each received a baseline commit before
customization and will receive a completed local commit; no remotes or deploys
are configured.

The same approved, source-backed Branch brief was copied into all variants.
Official facts were reused, official/customer media was reference-only, and the
five shared stills plus trial mark were generated as original assets. All sites
remain draft/noindex.

Before copying, the QLander contact contract was corrected for URL-first
businesses: email and phone may be empty, optional HTTPS `contactUrl` is
supported, available methods render conditionally, and launch validation, not
draft validation, requires at least one method.

## Three-way comparison

| | Tour-only | Marketing | PPC |
|---|---|---|---|
| Baseline commit | `c7a12b2` | `0250f0b` | `0250f0b` |
| Completed commit | `b217b8a` | `671d5cb` | `08dabc0` |
| Built routes | 2 | 13 | 2 |
| Main experience | Root Scroll World still scrub | Standard multi-page site | `layout: "ppc"` focused landing |
| Discovery reuse | Full shared brief; cinematic gaps only | Full shared brief | Full shared brief; campaign gaps only |
| Safe-zone fit | Media/config yes | Mostly | Campaign content/media yes |
| Developer mode | Root renderer, route pruning, tests | Two hardcoded labels, test fixture | Route pruning, tests |
| Media handoff | 5 stills complete; 5 dives + 4 connectors queued manually | 5 stills complete | 5 stills complete |
| Browser result | Desktop/phone stills, forward/reverse scroll, no console errors | Desktop/phone, all key links/media present, no console errors | One `h1`, one destination, no site chrome, no console errors |
| Validation | build/typecheck; 5 tests; checker warning only | build/typecheck; 18 tests; checker warning only | build/typecheck; 5 tests; checker warning only |
| Remaining external work | Magnific video results, ingest, seam/seek QA | Replace Storylane link with deployed cinematic URL | Campaign/client approval and production integrations if later requested |

Per-project run logs were captured in the three local trial repositories. Absolute
machine paths are intentionally omitted from this repository record.

## Friction observed

1. Fresh pnpm 11 installs blocked `esbuild` and `sharp` scripts. The old
   `package.json` `pnpm.onlyBuiltDependencies` field is ignored; the working
   contract is repository `pnpm-workspace.yaml` with `allowBuilds`.
2. Scroll World has a good named-route registration contract, but no supported
   root-only microsite profile. The tour required a site-specific renderer.
3. `layout: "ppc"` removes chrome correctly, but a true single-page package still
   needs manual route and content pruning.
4. Collection index labels remain hardcoded in components, pushing a normal
   marketing population outside the safe edit zone.
5. `PageLayout` queries products even when no product grid is present, producing
   harmless empty-collection warnings in root-only projects.
6. Existing generic tests assumed a placeholder-only hero and failed when the
   real hero already contained an image.
7. The checker correctly found unmapped header/footer markers rendered only by
   404 support routes; root-only profiles need generated support mappings.
8. Browser full-page capture does not represent fixed Scroll World layers
   reliably; viewport screenshots are the useful artifact.
9. Stage elapsed time is not automatically recorded, so this run reconstructed
   timing from terminal output.

## Prioritized QLander improvement backlog

### P0: make initialization reproducible

1. Add `qlander init` profiles for `marketing-site`, `single-page-ppc`,
   `internal-scroll-world`, and `root-scroll-world`.
2. Have init create the detached repository, baseline commit, approved brief,
   manifest/edit-map/routes, `pnpm-workspace.yaml`, run log, and first validation.
3. Generate route-support mappings and tests from the selected profile.
4. Record structured stage start/end times and command results automatically.

### P1: keep standard work inside the safe zone

1. Move collection headings, eyebrow labels, and route CTAs into structured data.
2. Load collections only when a selected section consumes them.
3. Add PPC checker rules for one conversion destination, no normal chrome, and
   one visible `h1`.
4. Add an external-tour contract with current provider URL and future replacement
   URL/status.
5. Add a root Scroll World registration path that retains a static fallback and
   404 without retrofit work.

### P2: improve media and progress handoffs

1. Add a machine-readable manual-queue manifest beside the Markdown checklist.
2. Track exact filenames, provider/model, phase dependencies, ingest state, and
   QA state without credentials.
3. Add fixed-layer-aware screenshot capture and responsive/reverse-scroll smoke
   tests for Scroll World.
4. Preserve image prompt IDs and generation provenance even when generated media
   replaces placeholders.

## Current conclusion

Universal discovery transfers cleanly across all three builds and prevents
repeated general intake. The specialist split is sound: Marketing can stay
mostly structured, PPC needs a first-class single-page profile, and Scroll World
needs a first-class root profile. The remaining tour work is deliberately an
external manual media phase, not a broken site state.

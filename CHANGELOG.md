# Changelog

## 0.4.0 - 2026-07-23

- Add a conservative, idempotent `qlander:migrate` command for the supported
  0.3.0 to 0.4.0 upgrade, including dry-run plans, migration records, safe content
  defaults, and explicit runtime-pending/manual reconciliation without silently
  overwriting customized runtime files.
- Split tests into parallel fast tests and serialized build-heavy integration tests;
  `pnpm test` runs both suites.
- Add explicit routed blog metadata and version migration records to the manifest contract.

## 0.3.0

- Add explicit informational contact mode, semantic product/service/category JSON-LD, and a structured resources collection with progressive year/type filters.

## 0.2.0 - 2026-07-11

- Harden editable URLs, JSON-LD, theme tokens, and structured image paths.
- Add shared strict schemas, semantic edit-map checks, launch validation, and negative regression fixtures.
- Derive canonical URLs, sitemap, and robots output from site and route data.
- Add collection-driven products, structured images, email-only contact, and focused accessibility improvements.
- Upgrade to Astro 7 and add type checking, CI, dependency review, and template provenance.

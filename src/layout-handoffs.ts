import type StarterSection from "./components/HeroSection.astro";

type LayoutHandoff = typeof StarterSection;

// Project-local layout handoff registry.
//
// Blank projects keep both registries empty and render the built-in starter.
//
// Prompted design work imports approved project-local Astro renderers here and
// records the same page route or section edit ID in qlander.manifest.json under
// design.handoffs.
//
// A prompted project's "/" belongs in pageHandoffs, pointing at a research-derived
// renderer under src/design/<direction-slug>/. Bundled src/design-variants/*
// renderers are prototyping aids: measured against a project's own fallback
// rendering they score roughly 0.05 structural divergence versus 0.34 for a
// research-derived page, so registering only those leaves the design effectively
// identical to the starter composition.
//
// See skills/qlander-design/references/layout-handoff-recipe.md.
export const pageHandoffs: Record<string, LayoutHandoff> = {};
export const sectionHandoffs: Record<string, LayoutHandoff> = {};

import type StarterSection from "./components/HeroSection.astro";

type LayoutHandoff = typeof StarterSection;

// Project-local layout handoff registry.
// Blank projects keep both registries empty and render the built-in starter.
// Prompted design work imports approved Astro renderers here and records the same
// page route or section edit ID in qlander.manifest.json.
export const pageHandoffs: Record<string, LayoutHandoff> = {};
export const sectionHandoffs: Record<string, LayoutHandoff> = {};

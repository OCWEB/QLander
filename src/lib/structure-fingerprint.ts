// Structural divergence: does a prompted page actually own its composition, or is
// it the kit's own fallback rendering wearing a new palette?
//
// Provenance metadata alone is trivially satisfiable by renaming a bundled variant
// into src/design/, so provenance is not enough. This measures the built HTML.
//
// The Stage A pilot disproved the obvious method. Comparing against the shipped
// starter page scored 0.7746 for a bundled-variant design and 0.7672 for a
// research-derived one: indistinguishable, because the comparison is dominated by
// content differences (different section counts, different IDs) rather than design.
//
// What discriminates is comparing a page against *its own* fallback rendering,
// which holds content fixed. That measured 0.0476 for bundled variants versus
// 0.3429 for a research-derived page, a 7.2x separation.
//
// Producing a real fallback render would need a second full build per check, which
// is too slow to run by default. Instead we compute the same signal statically: the
// fallback rendering is entirely made of the kit's own components, so a section
// whose root element carries a kit class is a section the project did not compose.
// No second build, same discrimination.

export type SectionShape = {
  editId: string;
  classes: string[];
  kitShaped: boolean;
  mediaFirst: boolean;
  childBucket: number;
};

export type StructureFingerprint = {
  sections: SectionShape[];
  order: string[];
  kitShapedCount: number;
};

// Root class names emitted on the data-pp-edit-id element by src/components/* and
// src/design-variants/*. A page built only from these is, structurally, the
// fallback rendering. tests/structure-fingerprint.test.ts asserts this list stays
// in sync with the shipped components, so adding a component cannot silently
// weaken the check.
export const KIT_SECTION_CLASSES = [
  "section-band", "hero-section", "cta-section", "contact-section", "faq-section",
  "locations-section", "logo-strip", "stats-section", "steps-section",
  "testimonial-section", "resource-collection", "text-section", "scroll-section",
  "vh-centered", "vf-rows", "vc-panel-wrap"
];

// Measured in the 2026-07-24-institutional-modern pilot: 0.0476 for a
// bundled-variant design, 0.3429 for a research-derived one. 0.20 sits roughly
// midway on a log scale and far from both observations.
export const DIVERGENCE_MIN = 0.2;

const bucket = (count: number) => (count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4);

type MinimalElement = {
  getAttribute(name: string): string | null;
  querySelector(selector: string): MinimalElement | null;
  querySelectorAll(selector: string): MinimalElement[];
  childNodes: { nodeType: number }[];
  innerHTML: string;
  outerHTML: string;
};

type MinimalRoot = {
  querySelector(selector: string): MinimalElement | null;
  querySelectorAll(selector: string): MinimalElement[];
};

export function fingerprint(root: MinimalRoot): StructureFingerprint {
  const main = root.querySelector("main") ?? (root as unknown as MinimalElement);
  const seen = new Set<string>();
  const sections: SectionShape[] = [];

  for (const node of main.querySelectorAll("[data-pp-edit-id]")) {
    const editId = node.getAttribute("data-pp-edit-id");
    if (!editId || seen.has(editId)) continue;
    seen.add(editId);

    const classes = (node.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
    const media = node.querySelector("img, .placeholder-visual");
    const heading = node.querySelector("h1, h2, h3");
    sections.push({
      editId,
      classes: [...classes].sort(),
      kitShaped: classes.some((name) => KIT_SECTION_CLASSES.includes(name)),
      mediaFirst: Boolean(media && heading && node.innerHTML.indexOf(media.outerHTML) < node.innerHTML.indexOf(heading.outerHTML)),
      childBucket: bucket(node.childNodes.filter((child) => child.nodeType === 1).length)
    });
  }

  return {
    sections,
    order: sections.map((section) => section.editId),
    kitShapedCount: sections.filter((section) => section.kitShaped).length
  };
}

// Normalized to [0,1]. 0 means the page is entirely the kit's own composition;
// higher means the project owns more of its structure.
//
// This measures difference from the fallback rendering. It is not a measure of
// originality, quality, or similarity to any reference, and it must never be
// reported as one.
export function divergence(print: StructureFingerprint): number {
  if (!print.sections.length) return 0;
  const projectShare = 1 - print.kitShapedCount / print.sections.length;
  // A project-composed section that also reorders media or restructures its
  // children diverges more than one that merely renames a wrapper.
  const restructured = print.sections.filter((section) => !section.kitShaped && (section.mediaFirst || section.childBucket >= 2)).length;
  const restructuredShare = restructured / print.sections.length;
  return Number((0.75 * projectShare + 0.25 * restructuredShare).toFixed(4));
}

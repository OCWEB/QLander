/**
 * Versioned mapping from qlander-prototyper output to QLander content sections.
 *
 * The prototyper is a separate repository with its own vocabulary. It describes a
 * page as an ordered list of sections, each carrying a semantic `role`, a
 * `contentShape`, a `patternFamily`, and a slot contract. QLander describes a page
 * as an ordered list of typed content sections in `content/pages/*.json`.
 *
 * `docs/integration-gate.md` in the prototyper requires this mapping to be
 * versioned before the two tools are wired together, so that a prototyper upgrade
 * cannot silently change what QLander generates. Bump MAPPING_VERSION whenever a
 * row below changes meaning.
 */

export const MAPPING_VERSION = 1;

/** Section types QLander can render from `content/pages/*.json`. */
export type QlanderSectionType =
  | "hero"
  | "featureGrid"
  | "cta"
  | "productGrid"
  | "contact"
  | "richText"
  | "stats"
  | "faq"
  | "testimonial"
  | "logoStrip"
  | "steps"
  | "locations";

/** Why a prototyper section produced no QLander section. */
export type SkipReason = "chrome" | "unsupported";

export interface ShapeMapping {
  /** The QLander section type, or null when the shape does not become a section. */
  type: QlanderSectionType | null;
  reason?: SkipReason;
  note: string;
}

/**
 * `contentShape` is the mapping key, not `patternFamily`. Shape describes what the
 * content IS; family describes how it is arranged. QLander's section types are a
 * content vocabulary, so shape is the honest join. Family and the measured
 * geometry inform the design handoff instead, never the content type.
 */
export const SHAPE_TO_SECTION: Record<string, ShapeMapping> = {
  hero: { type: "hero", note: "Direct equivalent." },
  "rich-text": { type: "richText", note: "Direct equivalent." },
  "item-grid": { type: "featureGrid", note: "Both are a heading plus repeated title/description items." },
  steps: { type: "steps", note: "Direct equivalent, ordered." },
  stats: { type: "stats", note: "Prototyper items carry a value and a label, as does QLander." },
  "testimonial-list": { type: "testimonial", note: "Requires real attributed quotes; leave the section out rather than inventing them." },
  "logo-list": { type: "logoStrip", note: "Requires cleared client logos; leave the section out rather than using placeholders that imply clients." },
  faq: { type: "faq", note: "Direct equivalent." },
  cta: { type: "cta", note: "Direct equivalent, single call to action." },
  contact: { type: "contact", note: "Direct equivalent." },
  "offer-grid": { type: "productGrid", note: "Only valid when the project has a products collection; otherwise degrade to featureGrid." },

  // Chrome, not page content. QLander renders these from the layout and data/navigation.json.
  navigation: { type: null, reason: "chrome", note: "Rendered by Header.astro from data/navigation.json." },
  footer: { type: null, reason: "chrome", note: "Rendered by Footer.astro from data/site.json." },

  // No content equivalent.
  utility: { type: null, reason: "unsupported", note: "Utility shapes (404, login, cart) are routes, not home-page sections." }
};

/**
 * Prototyper slot names to QLander field names, per target section type.
 * A slot with no entry has no home in that section type and its content must be
 * folded into another field or dropped; never invent a field to hold it.
 */
export const SLOT_TO_FIELD: Partial<Record<QlanderSectionType, Record<string, string>>> = {
  hero: { heading: "headline", body: "subheadline", primaryCta: "primaryCta", secondaryCta: "secondaryCta", media: "image" },
  richText: { heading: "headline", body: "body", media: "image" },
  featureGrid: { heading: "headline", items: "items", media: "items[].image" },
  steps: { heading: "headline", items: "items" },
  stats: { heading: "headline", items: "items" },
  testimonial: { heading: "headline", items: "items" },
  logoStrip: { heading: "headline", items: "items" },
  faq: { heading: "headline", items: "items" },
  cta: { heading: "headline", body: "body", primaryCta: "cta" },
  contact: { heading: "headline", body: "body", primaryCta: "actionLabel" },
  productGrid: { heading: "headline", items: "productSlugs" }
};

/** Interactions the prototyper can select that QLander does not render. */
export const INTERACTION_DEGRADATION: Record<string, string> = {
  carousel: "QLander has no carousel component. Render the items as a static grid or list and keep every item visible.",
  accordion: "Only the faq section type has a disclosure. Any other shape degrades to a plain list.",
  form: "Only the contact section type carries a form. Any other shape degrades to a call to action.",
  navigation: "Chrome, not content.",
  static: "No degradation required."
};

/**
 * Confidence gate. The prototyper reports a per-section `confidence` in [0,1]
 * blending catalog quality and responsive certainty.
 *
 * At or above this, a section may be mapped without a human looking at it first.
 * Below it, map the section but flag it for review; do not silently drop it.
 */
export const AUTO_MAP_CONFIDENCE = 0.7;

export interface MappedSection {
  /** Stable edit id, e.g. "home.hero". */
  id: string;
  type: QlanderSectionType;
  /** Prototyper reference id, recorded for provenance. */
  referenceId: string;
  role: string;
  patternFamily: string;
  confidence: number;
  needsReview: boolean;
  notes: string[];
}

export interface MappingResult {
  mappingVersion: number;
  sections: MappedSection[];
  skipped: Array<{ referenceId: string; role: string; contentShape: string; reason: SkipReason; note: string }>;
  warnings: string[];
}

export interface PrototyperSection {
  order: number;
  referenceId: string;
  role: string;
  contentShape: string;
  patternFamily: string;
  interaction: string;
  confidence: number;
}

/**
 * Maps one prototyper variant to QLander section descriptors.
 * Produces the skeleton only. Copy is written separately and must stay
 * source-backed; this never invents content.
 */
export function mapVariant(
  sections: PrototyperSection[],
  options: { pageKey?: string; hasProducts?: boolean } = {}
): MappingResult {
  const pageKey = options.pageKey ?? "home";
  const result: MappingResult = { mappingVersion: MAPPING_VERSION, sections: [], skipped: [], warnings: [] };
  const usedIds = new Map<string, number>();

  for (const section of sections) {
    const mapping = SHAPE_TO_SECTION[section.contentShape];
    if (!mapping) {
      result.warnings.push(`Unknown contentShape "${section.contentShape}" on ${section.referenceId}; mapping v${MAPPING_VERSION} does not cover it`);
      continue;
    }
    if (mapping.type === null) {
      result.skipped.push({ referenceId: section.referenceId, role: section.role, contentShape: section.contentShape, reason: mapping.reason ?? "unsupported", note: mapping.note });
      continue;
    }

    const notes: string[] = [];
    let type = mapping.type;
    if (type === "productGrid" && !options.hasProducts) {
      type = "featureGrid";
      notes.push("Degraded from productGrid to featureGrid: this project has no products collection.");
    }
    const degradation = INTERACTION_DEGRADATION[section.interaction];
    if (degradation && section.interaction !== "static") notes.push(degradation);

    const base = `${pageKey}.${section.role}`;
    const seen = usedIds.get(base) ?? 0;
    usedIds.set(base, seen + 1);
    const id = seen === 0 ? base : `${base}${seen + 1}`;

    const needsReview = section.confidence < AUTO_MAP_CONFIDENCE;
    if (needsReview) notes.push(`Confidence ${section.confidence} is below the ${AUTO_MAP_CONFIDENCE} auto-map threshold; review before shipping.`);

    result.sections.push({ id, type, referenceId: section.referenceId, role: section.role, patternFamily: section.patternFamily, confidence: section.confidence, needsReview, notes });
  }

  if (!result.sections.some((section) => section.type === "hero")) {
    result.warnings.push("No hero section mapped; QLander pages expect one h1-bearing hero");
  }
  return result;
}

/** QLander component name for a mapped section type, used for edit-map entries. */
export const TYPE_TO_COMPONENT: Record<QlanderSectionType, string> = {
  hero: "HeroSection",
  featureGrid: "FeatureGrid",
  cta: "CTASection",
  productGrid: "ProductGrid",
  contact: "ContactForm",
  richText: "RichTextSection",
  stats: "StatsSection",
  faq: "FaqSection",
  testimonial: "TestimonialSection",
  logoStrip: "LogoStrip",
  steps: "StepsSection",
  locations: "LocationsSection"
};

/** Editable fields per section type, mirroring qlander.edit-map.json conventions. */
export const TYPE_TO_SAFE_FIELDS: Record<QlanderSectionType, string[]> = {
  hero: ["headline", "subheadline", "primaryCta.label", "primaryCta.href", "secondaryCta.label", "secondaryCta.href", "image.src", "image.alt", "image.width", "image.height", "imagePromptId"],
  featureGrid: ["headline", "items[].title", "items[].description", "items[].image.src", "items[].image.alt", "items[].image.width", "items[].image.height", "items[].imagePromptId"],
  cta: ["headline", "body", "cta.label", "cta.href"],
  productGrid: ["headline"],
  contact: ["headline", "body", "actionLabel", "informationalNote"],
  richText: ["headline", "body", "visual", "image.src", "image.alt", "image.width", "image.height", "imagePromptId"],
  stats: ["headline", "items[].value", "items[].label"],
  faq: ["headline", "items[].question", "items[].answer"],
  testimonial: ["items[].quote", "items[].name", "items[].role"],
  logoStrip: ["headline", "items[].name"],
  steps: ["headline", "items[].title", "items[].description"],
  locations: ["headline", "items[].name", "items[].street", "items[].city", "items[].region", "items[].postalCode", "items[].phone", "items[].email", "items[].hoursNote"]
};

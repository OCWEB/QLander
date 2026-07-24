import { z } from "zod";

const imagePathPattern = /^\/images\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const localePattern = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const hexColorPattern = /^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/;
const promptIdPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const experienceSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const experienceStillPattern = /^\/(?:images|experiences)\/[A-Za-z0-9][A-Za-z0-9._/-]*\.(?:avif|gif|jpe?g|png|svg|webp)$/i;
const experienceClipPattern = /^\/experiences\/[A-Za-z0-9][A-Za-z0-9._/-]*\.mp4$/i;

export function isSafeHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("..")) return true;
  if (value.startsWith("#")) return value.length > 1;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) return true;
  if (/^tel:\+?[0-9() .-]+$/i.test(value)) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const SafeHrefSchema = z.string().min(1).refine(isSafeHref, "Link must be an internal path, fragment, HTTPS, mailto, or tel URL");
export const ImagePathSchema = z.string().regex(imagePathPattern, "Image must be a safe /images/ path").refine((value) => !value.includes(".."), "Image path cannot traverse directories");

export const MediaSchema = z.object({
  src: ImagePathSchema,
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive()
}).strict();

export const SeoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  noindex: z.boolean().default(false),
  socialImage: ImagePathSchema.optional()
}).strict();

export const CtaSchema = z.object({ label: z.string().min(1), href: SafeHrefSchema }).strict();
export const ImagePromptIdSchema = z.string().regex(promptIdPattern, "Image prompt ID must use lowercase letters, numbers, dots, or hyphens");
export const ExperienceStillPathSchema = z.string().regex(experienceStillPattern, "Experience still must be a safe image under /images/ or /experiences/").refine((value) => !value.includes(".."), "Experience still path cannot traverse directories");
export const ExperienceClipPathSchema = z.string().regex(experienceClipPattern, "Experience clip must be an MP4 under /experiences/").refine((value) => !value.includes(".."), "Experience clip path cannot traverse directories");

export const PageSectionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().min(1), type: z.literal("hero"), eyebrow: z.string().optional(), headline: z.string().min(1), subheadline: z.string().min(1), primaryCta: CtaSchema.optional(), secondaryCta: CtaSchema.optional(), image: MediaSchema.optional(), imagePromptId: ImagePromptIdSchema.optional() }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("featureGrid"), eyebrow: z.string().optional(), headline: z.string().min(1), items: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), image: MediaSchema.optional(), imagePromptId: ImagePromptIdSchema.optional() }).strict()).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("cta"), headline: z.string().min(1), body: z.string().min(1), cta: CtaSchema }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("productGrid"), headline: z.string().min(1), productSlugs: z.array(z.string().min(1)).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("contact"), mode: z.enum(["action", "informational"]).default("action"), eyebrow: z.string().min(1).optional(), headline: z.string().min(1), body: z.string().min(1), actionLabel: z.string().min(1).optional(), informationalNote: z.string().min(1).optional(), channels: z.array(z.object({ label: z.string().min(1), phone: z.string().optional(), email: z.union([z.literal(""), z.email()]).optional(), hoursNote: z.string().optional() }).strict()).optional() }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("richText"), headline: z.string().min(1), body: z.string().min(1), visual: z.boolean().optional(), image: MediaSchema.optional(), imagePromptId: ImagePromptIdSchema.optional() }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("stats"), eyebrow: z.string().optional(), headline: z.string().min(1), asOf: z.string().optional(), items: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) }).strict()).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("faq"), eyebrow: z.string().optional(), headline: z.string().min(1), items: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) }).strict()).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("testimonial"), eyebrow: z.string().optional(), headline: z.string().optional(), items: z.array(z.object({ quote: z.string().min(1), name: z.string().min(1), role: z.string().optional(), sourceUrl: z.url().refine((value) => new URL(value).protocol === "https:").optional() }).strict()).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("logoStrip"), eyebrow: z.string().optional(), headline: z.string().optional(), items: z.array(z.object({ name: z.string().min(1), image: MediaSchema.optional(), imagePromptId: ImagePromptIdSchema.optional() }).strict()).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("steps"), eyebrow: z.string().optional(), headline: z.string().min(1), items: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) }).strict()).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("locations"), eyebrow: z.string().optional(), headline: z.string().min(1), items: z.array(z.object({ name: z.string().min(1), street: z.string().optional(), city: z.string().optional(), region: z.string().optional(), postalCode: z.string().optional(), phone: z.string().optional(), email: z.union([z.literal(""), z.email()]).optional(), hoursNote: z.string().optional() }).strict()).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("scrollSection"), experience: z.string().regex(experienceSlugPattern), headingLevel: z.enum(["h1", "h2"]).default("h2") }).strict()
]);

export const PageContentSchema = z.object({ title: z.string().min(1), slug: z.string().startsWith("/"), layout: z.enum(["site", "ppc"]).optional(), seo: SeoSchema, sections: z.array(PageSectionSchema).min(1) }).strict();
const ExperienceSceneCtaSchema = z.object({ primary: CtaSchema, secondary: CtaSchema.optional() }).strict();
const ScrollWorldSceneSchema = z.object({
  id: z.string().regex(experienceSlugPattern), label: z.string().min(1), accent: z.string().regex(hexColorPattern),
  still: ExperienceStillPathSchema, stillMobile: ExperienceStillPathSchema.optional(), clip: ExperienceClipPathSchema.optional(), clipMobile: ExperienceClipPathSchema.optional(),
  scroll: z.number().positive().max(4).optional(), linger: z.number().min(0).max(0.6).optional(), eyebrow: z.string().min(1).optional(), title: z.string().min(1), body: z.string().min(1),
  tags: z.array(z.string().min(1)).max(3).default([]), cta: ExperienceSceneCtaSchema.optional()
}).strict();
export const ScrollWorldExperienceSchema = z.object({
  kind: z.literal("scroll-world"), slug: z.string().regex(experienceSlugPattern), placement: z.enum(["route", "section"]).default("route"), route: z.literal("/").optional(), seo: SeoSchema,
  brand: z.object({ name: z.string().min(1), href: SafeHrefSchema }).strict(), cta: CtaSchema.optional(), hint: z.string().min(1).default("scroll to explore"),
  diveScroll: z.number().positive().max(4).default(1.3), connScroll: z.number().positive().max(4).default(0.9), crossfade: z.number().min(0).max(1).default(0.12),
  nav: z.boolean().default(true), atmosphere: z.boolean().default(true), sections: z.array(ScrollWorldSceneSchema).min(1),
  connectors: z.array(ExperienceClipPathSchema.nullable()).default([]), connectorsMobile: z.array(ExperienceClipPathSchema.nullable()).default([])
}).strict().superRefine((value, context) => {
  const expected = Math.max(0, value.sections.length - 1);
  if (value.connectors.length > expected) context.addIssue({ code: "custom", path: ["connectors"], message: `Connectors cannot exceed ${expected}` });
  if (value.connectorsMobile.length > expected) context.addIssue({ code: "custom", path: ["connectorsMobile"], message: `Mobile connectors cannot exceed ${expected}` });
  if (new Set(value.sections.map((section) => section.id)).size !== value.sections.length) context.addIssue({ code: "custom", path: ["sections"], message: "Scene IDs must be unique" });
  if (value.placement === "section" && value.route) context.addIssue({ code: "custom", path: ["route"], message: "Section experiences cannot own a route" });
});
const ContentSlugSchema = z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const ProductSchema = z.object({ title: z.string().min(1), slug: ContentSlugSchema, kind: z.enum(["product", "service", "category"]).default("product"), summary: z.string().min(1), description: z.string().min(1), priceLabel: z.string().min(1).optional(), ctaLabel: z.string().min(1).optional(), featured: z.boolean().default(false), image: MediaSchema.optional(), imagePromptId: ImagePromptIdSchema.optional(), seo: SeoSchema }).strict();
const ExternalResourceHrefSchema = z.url().refine((value) => new URL(value).protocol === "https:", "External resource URL must use HTTPS");
const ResourceDestinationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("detail"), body: z.string().min(1), cta: CtaSchema.optional() }).strict(),
  z.object({ kind: z.literal("external"), href: ExternalResourceHrefSchema, label: z.string().min(1).optional() }).strict()
]);
export const ResourceSchema = z.object({
  title: z.string().min(1), slug: ContentSlugSchema, summary: z.string().min(1), year: z.number().int().min(1000).max(9999).optional(), type: z.string().min(1).optional(),
  destination: ResourceDestinationSchema, image: MediaSchema.optional(), seo: SeoSchema.optional()
}).strict().superRefine((value, context) => {
  if (value.destination.kind === "detail" && !value.seo) context.addIssue({ code: "custom", path: ["seo"], message: "Detail resources require SEO metadata" });
});
export const BlogFrontmatterSchema = z.object({ title: z.string().min(1), description: z.string().min(1), slug: ContentSlugSchema, publishedAt: z.iso.date(), updatedAt: z.iso.date(), author: z.string().min(1), tags: z.array(z.string()).default([]), routed: z.boolean().default(true), seo: SeoSchema }).strict();
export const NavigationSchema = z.object({ header: z.array(z.object({ label: z.string().min(1), href: SafeHrefSchema }).strict()).min(1), footer: z.array(z.object({ label: z.string().min(1), href: SafeHrefSchema }).strict()).min(1) }).strict();
export const SiteDataSchema = z.object({
  name: z.string().min(1), description: z.string().min(1), url: z.url().refine((value) => new URL(value).protocol === "https:", "Site URL must use HTTPS"),
  launchStatus: z.enum(["draft", "live"]), locale: z.string().regex(localePattern), logo: ImagePathSchema, socialImage: ImagePathSchema.optional(),
  email: z.union([z.literal(""), z.email()]), phone: z.string(),
  contactUrl: z.url().refine((value) => new URL(value).protocol === "https:", "Contact URL must use HTTPS").optional(),
  complianceNote: z.string().optional(),
  address: z.object({ street: z.string(), city: z.string(), region: z.string(), postalCode: z.string(), country: z.string() }).strict(),
  social: z.object({ linkedin: z.union([z.literal(""), z.url().refine((value) => new URL(value).protocol === "https:")]), x: z.union([z.literal(""), z.url().refine((value) => new URL(value).protocol === "https:")]), facebook: z.union([z.literal(""), z.url().refine((value) => new URL(value).protocol === "https:")]).optional(), instagram: z.union([z.literal(""), z.url().refine((value) => new URL(value).protocol === "https:")]).optional(), youtube: z.union([z.literal(""), z.url().refine((value) => new URL(value).protocol === "https:")]).optional() }).strict()
}).strict();
export const ThemeSchema = z.object({ colors: z.object({ ink: z.string().regex(hexColorPattern), paper: z.string().regex(hexColorPattern), muted: z.string().regex(hexColorPattern), accent: z.string().regex(hexColorPattern), accentDark: z.string().regex(hexColorPattern) }).strict(), radius: z.number().min(0).max(8) }).strict();
const fontStackPattern = /^[A-Za-z0-9 "'.,-]+$/;
export const DesignSystemSchema = z.object({
  status: z.enum(["starter", "proposed", "approved"]),
  direction: z.string().min(1),
  typography: z.object({
    displayFamily: z.string().min(1).max(240).regex(fontStackPattern), bodyFamily: z.string().min(1).max(240).regex(fontStackPattern), labelFamily: z.string().min(1).max(240).regex(fontStackPattern),
    displayWeight: z.number().int().min(100).max(900), bodyWeight: z.number().int().min(100).max(900), labelWeight: z.number().int().min(100).max(900),
    headingLeading: z.number().min(0.8).max(1.5), bodyLeading: z.number().min(1.2).max(2), trackingEm: z.number().min(-0.1).max(0.1),
    displayMinRem: z.number().min(1.5).max(6), displayMaxRem: z.number().min(2).max(10), headingMinRem: z.number().min(1).max(4), headingMaxRem: z.number().min(1.2).max(6), bodyRem: z.number().min(0.8).max(1.5), labelRem: z.number().min(0.65).max(1)
  }).strict().refine((value) => value.displayMaxRem >= value.displayMinRem && value.headingMaxRem >= value.headingMinRem, "type scale maximums must be at least their minimums"),
  spacing: z.object({ base: z.number().int().min(2).max(12), sectionY: z.number().int().min(32).max(160), contentGap: z.number().int().min(8).max(80) }).strict(),
  layout: z.object({ contentMax: z.number().int().min(640).max(1600), readingMax: z.number().int().min(45).max(90) }).strict(),
  components: z.object({ surface: z.enum(["flat", "bordered", "elevated"]), image: z.enum(["full-bleed", "framed", "soft", "editorial"]), button: z.enum(["solid", "solid-outline", "text-forward"])}).strict(),
  motion: z.enum(["none", "subtle", "expressive"])
}).strict();
export const ProductRouteSeoSchema = SeoSchema.extend({
  eyebrow: z.string().min(1), heading: z.string().min(1), itemCtaLabel: z.string().min(1), detailCtaLabel: z.string().min(1), detailCtaHref: SafeHrefSchema
}).strict();
export const BlogRouteSeoSchema = SeoSchema.extend({ eyebrow: z.string().min(1), heading: z.string().min(1) }).strict();
export const ResourceRouteSeoSchema = SeoSchema.extend({
  eyebrow: z.string().min(1), heading: z.string().min(1), itemCtaLabel: z.string().min(1), externalCtaLabel: z.string().min(1),
  yearFilterLabel: z.string().min(1), typeFilterLabel: z.string().min(1), allYearsLabel: z.string().min(1), allTypesLabel: z.string().min(1), detailBackLabel: z.string().min(1)
}).strict();
export const RouteSeoSchema = z.object({ products: ProductRouteSeoSchema.optional(), resources: ResourceRouteSeoSchema.optional(), blog: BlogRouteSeoSchema.optional(), notFound: SeoSchema }).strict();
export const ProjectTypeSchema = z.enum(["marketing-site", "single-page-ppc", "internal-scroll-world", "root-scroll-world"]);
export const CreationModeSchema = z.enum(["blank", "prompted"]);
export const LayoutHandoffSchema = z.object({
  kind: z.enum(["page", "section"]),
  id: z.string().regex(/^(\/[A-Za-z0-9/_-]*|[A-Za-z0-9][A-Za-z0-9._-]*)$/),
  renderer: z.string().regex(/^src\/[A-Za-z0-9._/-]+\.astro$/).refine((value) => !value.split("/").includes(".."), "renderer may not traverse directories"),
  routes: z.array(z.string().startsWith("/")).min(1)
}).strict();
export const DesignManifestSchema = z.object({ status: z.enum(["starter", "required", "implemented"]), direction: z.string(), system: z.literal("data/design-system.json"), handoffs: z.array(LayoutHandoffSchema) }).strict();
export const MigrationRecordSchema = z.object({ from: z.string().min(1), to: z.string().min(1), appliedAt: z.iso.datetime(), status: z.enum(["runtime-pending", "complete"]), operations: z.array(z.string()), runtimePending: z.array(z.string()) }).strict();
export const ManifestSchema = z.object({ siteId: z.string().min(1), name: z.string().min(1), template: z.string().min(1), templateSource: z.url(), templateVersion: z.string().min(1), projectType: ProjectTypeSchema.optional(), creationMode: CreationModeSchema.optional(), design: DesignManifestSchema.optional(), contentRoot: z.string(), dataRoot: z.string(), editMap: z.string(), routes: z.array(z.string()).min(1), migrations: z.array(MigrationRecordSchema).optional() }).strict();
export const EditMapEntrySchema = z.object({ route: z.string(), label: z.string().min(1), scope: z.string().min(1), contentFile: z.string().min(1), jsonPath: z.string().min(1), component: z.string().min(1), safeFields: z.array(z.string()).min(1), affectedRoutes: z.union([z.array(z.string()), z.literal("all")]) }).strict();
export const EditMapSchema = z.record(z.string(), EditMapEntrySchema);

export const ScrollWorldQueueJobSchema = z.object({
  id: z.string().min(1), phase: z.union([z.literal(1), z.literal(2)]), kind: z.enum(["still", "dive", "connector"]), filename: z.string().min(1), status: z.enum(["pending", "ready", "rendered", "ingested", "passed", "failed"]), dependencies: z.array(z.string()).default([])
}).strict();
export const ScrollWorldQueueSchema = z.object({
  version: z.literal(1), experience: z.string().regex(experienceSlugPattern), mode: z.literal("manual"), provider: z.string().min(1), mobile: z.boolean(), status: z.enum(["planned", "phase1-ready", "phase1-complete", "phase2-ready", "phase2-complete", "qa-complete"]), updatedAt: z.iso.datetime(), jobs: z.array(ScrollWorldQueueJobSchema)
}).strict();

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

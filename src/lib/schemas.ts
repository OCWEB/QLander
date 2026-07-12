import { z } from "zod";

const imagePathPattern = /^\/images\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const localePattern = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const hexColorPattern = /^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/;

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

export const PageSectionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().min(1), type: z.literal("hero"), headline: z.string().min(1), subheadline: z.string().min(1), primaryCta: CtaSchema, secondaryCta: CtaSchema.optional(), image: MediaSchema.optional() }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("featureGrid"), headline: z.string().min(1), items: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), image: MediaSchema.optional() }).strict()).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("cta"), headline: z.string().min(1), body: z.string().min(1), cta: CtaSchema }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("productGrid"), headline: z.string().min(1), productSlugs: z.array(z.string().min(1)).min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("contact"), headline: z.string().min(1), body: z.string().min(1) }).strict(),
  z.object({ id: z.string().min(1), type: z.literal("richText"), headline: z.string().min(1), body: z.string().min(1), visual: z.boolean().optional(), image: MediaSchema.optional() }).strict()
]);

export const PageContentSchema = z.object({ title: z.string().min(1), slug: z.string().startsWith("/"), seo: SeoSchema, sections: z.array(PageSectionSchema).min(1) }).strict();
export const ProductSchema = z.object({ title: z.string().min(1), slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), summary: z.string().min(1), description: z.string().min(1), priceLabel: z.string().min(1), featured: z.boolean().default(false), image: MediaSchema.optional(), seo: SeoSchema }).strict();
export const BlogFrontmatterSchema = z.object({ title: z.string().min(1), description: z.string().min(1), slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), publishedAt: z.iso.date(), updatedAt: z.iso.date(), author: z.string().min(1), tags: z.array(z.string()).default([]), seo: SeoSchema }).strict();
export const NavigationSchema = z.object({ header: z.array(z.object({ label: z.string().min(1), href: SafeHrefSchema }).strict()).min(1), footer: z.array(z.object({ label: z.string().min(1), href: SafeHrefSchema }).strict()).min(1) }).strict();
export const SiteDataSchema = z.object({
  name: z.string().min(1), description: z.string().min(1), url: z.url().refine((value) => new URL(value).protocol === "https:", "Site URL must use HTTPS"),
  launchStatus: z.enum(["draft", "live"]), locale: z.string().regex(localePattern), logo: ImagePathSchema, socialImage: ImagePathSchema.optional(), email: z.email(), phone: z.string().min(1),
  address: z.object({ street: z.string(), city: z.string(), region: z.string(), postalCode: z.string(), country: z.string() }).strict(),
  social: z.object({ linkedin: z.union([z.literal(""), z.url().refine((value) => new URL(value).protocol === "https:")]), x: z.union([z.literal(""), z.url().refine((value) => new URL(value).protocol === "https:")]) }).strict()
}).strict();
export const ThemeSchema = z.object({ colors: z.object({ ink: z.string().regex(hexColorPattern), paper: z.string().regex(hexColorPattern), muted: z.string().regex(hexColorPattern), accent: z.string().regex(hexColorPattern), accentDark: z.string().regex(hexColorPattern) }).strict(), radius: z.number().min(0).max(8) }).strict();
export const RouteSeoSchema = z.object({ products: SeoSchema, blog: SeoSchema, notFound: SeoSchema }).strict();
export const ManifestSchema = z.object({ siteId: z.string().min(1), name: z.string().min(1), template: z.string().min(1), templateSource: z.url(), templateVersion: z.string().min(1), contentRoot: z.string(), dataRoot: z.string(), editMap: z.string(), routes: z.array(z.string()).min(1) }).strict();
export const EditMapEntrySchema = z.object({ route: z.string(), label: z.string().min(1), scope: z.string().min(1), contentFile: z.string().min(1), jsonPath: z.string().min(1), component: z.string().min(1), safeFields: z.array(z.string()).min(1), affectedRoutes: z.union([z.array(z.string()), z.literal("all")]) }).strict();
export const EditMapSchema = z.record(z.string(), EditMapEntrySchema);

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

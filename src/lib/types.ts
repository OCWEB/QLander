import type { z } from "zod";
import type { BlogFrontmatterSchema, MediaSchema, NavigationSchema, PageContentSchema, PageSectionSchema, ProductSchema, ResourceSchema, ScrollWorldExperienceSchema, SeoSchema, SiteDataSchema } from "./schemas";

export type Seo = z.infer<typeof SeoSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type PageSection = z.infer<typeof PageSectionSchema>;
export type PageContent = z.infer<typeof PageContentSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Resource = z.infer<typeof ResourceSchema>;
export type ScrollWorldExperience = z.infer<typeof ScrollWorldExperienceSchema>;
export type BlogFrontmatter = z.infer<typeof BlogFrontmatterSchema>;
export type NavigationItem = z.infer<typeof NavigationSchema>["header"][number];
export type SiteData = z.infer<typeof SiteDataSchema>;

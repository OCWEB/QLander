import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const seo = z.object({
  title: z.string(),
  description: z.string(),
  noindex: z.boolean().default(false),
  canonical: z.string().url()
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./content/pages" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    seo,
    sections: z.array(z.object({ id: z.string(), type: z.string() }))
  })
});

const products = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./content/products" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string(),
    description: z.string(),
    priceLabel: z.string(),
    featured: z.boolean().default(false),
    seo
  })
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    publishedAt: z.string(),
    updatedAt: z.string(),
    author: z.string(),
    tags: z.array(z.string()).default([]),
    seo
  })
});

export const collections = { pages, products, blog };

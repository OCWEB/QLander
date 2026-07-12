import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { BlogFrontmatterSchema, PageContentSchema, ProductSchema } from "./lib/schemas";

const pages = defineCollection({ loader: glob({ pattern: "**/*.json", base: "./content/pages" }), schema: PageContentSchema });
const products = defineCollection({ loader: glob({ pattern: "**/*.json", base: "./content/products" }), schema: ProductSchema });
const blog = defineCollection({ loader: glob({ pattern: "**/*.md", base: "./content/blog" }), schema: BlogFrontmatterSchema });

export const collections = { pages, products, blog };

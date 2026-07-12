import type { BlogFrontmatter, Product, SiteData } from "./types";

export function organizationSchema(site: SiteData) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: new URL(site.logo, site.url).toString(),
    email: site.email,
    telephone: site.phone,
    address: {
      "@type": "PostalAddress",
      ...(site.address.street && { streetAddress: site.address.street }),
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      ...(site.address.postalCode && { postalCode: site.address.postalCode }),
      addressCountry: site.address.country
    },
    ...(Object.values(site.social).filter(Boolean).length > 0 && { sameAs: Object.values(site.social).filter(Boolean) })
  };
}

export function productSchema(site: SiteData, product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.summary,
    brand: {
      "@type": "Brand",
      name: site.name
    },
    url: `${site.url.replace(/\/$/, "")}/products/${product.slug}`,
    ...(product.image && { image: new URL(product.image.src, site.url).toString() })
  };
}

export function blogPostingSchema(site: SiteData, post: BlogFrontmatter) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: new URL(site.logo, site.url).toString() } },
    url: `${site.url.replace(/\/$/, "")}/blog/${post.slug}`,
    ...((post.seo.socialImage ?? site.socialImage) && { image: new URL(post.seo.socialImage ?? site.socialImage!, site.url).toString() })
  };
}

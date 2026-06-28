import type { Product, SiteData } from "./types";

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
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country
    }
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
    url: `${site.url.replace(/\/$/, "")}/products/${product.slug}`
  };
}

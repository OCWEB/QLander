export type Seo = {
  title: string;
  description: string;
  noindex: boolean;
  canonical: string;
};

export type Cta = {
  label: string;
  href: string;
};

export type HeroSection = {
  id: string;
  type: "hero";
  headline: string;
  subheadline: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
};

export type FeatureGridSection = {
  id: string;
  type: "featureGrid";
  headline: string;
  items: Array<{
    title: string;
    description: string;
  }>;
};

export type CtaSection = {
  id: string;
  type: "cta";
  headline: string;
  body: string;
  cta: Cta;
};

export type ProductGridSection = {
  id: string;
  type: "productGrid";
  headline: string;
  productSlugs: string[];
};

export type ContactSection = {
  id: string;
  type: "contact";
  headline: string;
  body: string;
};

export type RichTextSection = {
  id: string;
  type: "richText";
  headline: string;
  body: string;
  visual?: boolean;
};

export type PageSection =
  | HeroSection
  | FeatureGridSection
  | CtaSection
  | ProductGridSection
  | ContactSection
  | RichTextSection;

export type PageContent = {
  title: string;
  slug: string;
  seo: Seo;
  sections: PageSection[];
};

export type Product = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  priceLabel: string;
  featured: boolean;
  seo: Seo;
};

export type NavigationItem = {
  label: string;
  href: string;
};

export type SiteData = {
  name: string;
  description: string;
  url: string;
  logo: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  social: {
    linkedin: string;
    x: string;
  };
};

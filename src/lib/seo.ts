import type { Seo, SiteData } from "./types";

export function resolveTitle(seo: Seo, site: SiteData) {
  return seo.title.includes(site.name) ? seo.title : `${seo.title} | ${site.name}`;
}

export function resolveCanonical(seo: Seo) {
  return seo.canonical.replace(/\/index$/, "/");
}

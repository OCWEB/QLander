import type { Seo, SiteData } from "./types";

export function resolveTitle(seo: Seo, site: SiteData) {
  return seo.title.includes(site.name) ? seo.title : `${seo.title} | ${site.name}`;
}

export function resolveCanonical(pathname: string, site: SiteData) {
  const normalized = pathname === "/" || pathname === "/index" ? "/" : pathname.replace(/\/+$/, "");
  return new URL(normalized, `${site.url.replace(/\/$/, "")}/`).toString();
}

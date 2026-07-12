import rawSite from "../../data/site.json";
import { SiteDataSchema } from "./schemas";

export const site = SiteDataSchema.parse(rawSite);

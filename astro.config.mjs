import { defineConfig } from "astro/config";
import site from "./data/site.json" with { type: "json" };

export default defineConfig({
  site: site.url,
  output: "static",
  // Keep Vite optimization state inside each project/fixture instead of a
  // potentially shared or symlinked node_modules directory.
  vite: { cacheDir: ".astro/vite" }
});

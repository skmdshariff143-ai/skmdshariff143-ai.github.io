import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mahammadshariff.vercel.app",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
});

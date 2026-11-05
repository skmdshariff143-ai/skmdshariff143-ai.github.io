import type { APIRoute } from "astro";
import { getProjects } from "../lib/content";

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("The site address must be configured.");
  const paths = ["/", ...getProjects("flagship").map((project) => `/work/${project.slug}/`), "/privacy/"];
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};

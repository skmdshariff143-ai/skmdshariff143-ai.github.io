import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { getCertificates } from "../src/lib/content";

const DIST = "dist";

function listFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path.replaceAll("\\", "/")];
  });
}

const files = listFiles(DIST);
const htmlFiles = files.filter((file) => file.endsWith(".html"));

test("published output contains no internal or private files", () => {
  const forbidden = /(^|\/)(scripts|tests|src)\/|RECONCILE|CERTIFICATE_WORKFLOW|qa_results|_private|\.map$|\.env|\.py$/;
  expect(files.filter((file) => forbidden.test(file))).toEqual([]);
});

test("pages have no inline scripts or styles that the security policy would block", () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].filter(
      (match) => !match[1]?.includes("application/ld+json"),
    );
    expect(inlineScripts, file).toEqual([]);
    expect(html.includes("<style"), file).toBe(false);
    expect(/\sstyle="/.test(html), file).toBe(false);
  }
});

test("no page publishes private contact details", () => {
  for (const file of [...htmlFiles, join(DIST, "llms.txt")]) {
    expect(readFileSync(file, "utf8"), file).not.toMatch(/\+91|@vvit\.net|mailto:/i);
  }
});

test("every certificate and the resume exist", () => {
  for (const certificate of getCertificates()) {
    expect(existsSync(join(DIST, certificate.certificateFile)), certificate.certificateFile).toBe(true);
  }
  expect(existsSync(join(DIST, "assets/resume.pdf"))).toBe(true);
});

test("old addresses and cache rules are configured", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8")) as {
    redirects: { source: string; destination: string }[];
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const destinations = Object.fromEntries(config.redirects.map((rule) => [rule.source, rule.destination]));
  expect(destinations["/privacy.html"]).toBe("/privacy/");
  expect(destinations["/index.html"]).toBe("/");

  const headerValue = (source: string, key: string) =>
    config.headers.find((group) => group.source === source)?.headers.find((header) => header.key === key)?.value;
  expect(headerValue("/_astro/(.*)", "Cache-Control")).toContain("immutable");
  expect(headerValue("/assets/(.*)", "Cache-Control")).toBe("public, max-age=0, must-revalidate");
  expect(headerValue("/images/(.*)", "Cache-Control")).toBe("public, max-age=0, must-revalidate");
  const policy = headerValue("/(.*)", "Content-Security-Policy");
  expect(policy).toContain("script-src 'self'");
  expect(policy).not.toContain("unsafe-inline");
  expect(policy).toContain("https://formspree.io");
});

test("sitemap and llms list current pages and facts", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/work/recoverflow-ai/");
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("CGPA 8.21");
  expect(llms).not.toContain("neurolearn-ai-pink");
});

import { expect, test } from "@playwright/test";
import { findLockedLink } from "../scripts/check-links.mjs";
import { getCertificates } from "../src/lib/content";

for (const width of [320, 390]) {
  test(`every settlement state fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    for (const value of ["clean", "missing", "collision"]) {
      await page.locator(`input[value='${value}']`).check();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, value).toBeLessThanOrEqual(0);
    }
  });
}

test("outcome label meets AA contrast", async ({ page }) => {
  await page.goto("/");
  const ratio = await page.evaluate(() => {
    const luminance = (color: string): number => {
      const channels = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((value) => {
        const channel = Number(value) / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
    };
    const label = document.querySelector("[data-outcome-label]") as HTMLElement;
    const panel = document.querySelector(".outcome") as HTMLElement;
    const lighter = luminance(getComputedStyle(panel).backgroundColor);
    const darker = luminance(getComputedStyle(label).color);
    return (lighter + 0.05) / (darker + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test("printing shows content that has not been scrolled to", async ({ page }) => {
  await page.goto("/");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#about h2")).toHaveCSS("opacity", "1");
});

test("a failed send offers a working LinkedIn link in the message", async ({ page }) => {
  await page.route("https://formspree.io/**", (route) => route.fulfill({ status: 500, json: { error: "failed" } }));
  await page.goto("/");
  await page.fill("#name", "Test Recruiter");
  await page.fill("#email", "recruiter@example.com");
  await page.fill("#message", "We would like to talk about a role.");
  await page.click("[data-contact-form] button[type='submit']");
  await expect(page.locator("[data-form-status] a")).toHaveAttribute("href", /linkedin\.com/);
});

test("link checker rejects other login redirects", () => {
  for (const location of ["https://vercel.com/login?next=x", "https://app.example/login", "/signin"]) {
    expect(findLockedLink([{ url: "https://x.example", status: 200, location }])).toBeDefined();
  }
});

test("mislabelled credentials are gone and real ones are shown", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  expect(html).not.toContain("GitHub Foundations");
  expect(html).not.toContain("Google Cloud Skills Boost");
  expect(html).toContain("Generative AI by Google Cloud");
  await expect(page.getByRole("link", { name: "Verify with AWS" })).toBeVisible();
});

test("certificates carry the labels on their documents", () => {
  const byFile = Object.fromEntries(getCertificates().map((item) => [item.certificateFile, item.title]));
  expect(byFile["assets/certificates/github.pdf"]).toBe("The Git & GitHub Bootcamp");
  expect(byFile["assets/certificates/udemy.pdf"]).toContain("Memory, Focus and Time Management");
  expect(byFile["assets/certificates/l4g-certificate.pdf"]).toContain("Google Cloud");
  expect(byFile["assets/certificates/shaik-mahammad-sharif_20261772946116-(1).pdf"]).toBe("Scientific Observations from Space");
  for (const certificate of getCertificates()) {
    expect(certificate.issuer).not.toBe("Online Platform");
  }
});

test("About shows languages, B.Tech and CodeChef", async ({ page }) => {
  await page.goto("/");
  const about = page.locator("#about");
  await expect(about).toContainText("B.Tech");
  await expect(about).toContainText("Urdu (Native)");
  await expect(about.getByRole("link", { name: /CodeChef 2-star/ })).toBeVisible();
});

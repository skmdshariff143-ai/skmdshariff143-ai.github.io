import { expect, test } from "@playwright/test";
import { findLockedLink } from "../scripts/check-links.mjs";

const SLUGS = ["recoverflow-ai", "sharecon-ai", "resumescore"];
const REQUIRED_HEADINGS = [
  "Problem",
  "Users",
  "My role",
  "Key decisions and trade-offs",
  "What I built",
  "How I validated it",
  "Outcome",
  "Limits",
  "What I would do next",
];

for (const slug of SLUGS) {
  test(`${slug} has every case study section and fits at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/work/${slug}/`);
    for (const heading of REQUIRED_HEADINGS) {
      await expect(page.getByRole("heading", { level: 2, name: heading, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`home page links to the ${slug} case study`, async ({ page }) => {
    await page.goto("/");
    await page.locator(`a[href="/work/${slug}/"]`).click();
    await expect(page).toHaveURL(new RegExp(`/work/${slug}/$`));
  });
}

test("link checker rejects a redirect to Vercel login", () => {
  const locked = findLockedLink([
    { url: "https://open.example", status: 200, location: "" },
    { url: "https://locked.example", status: 302, location: "https://vercel.com/sso-api?url=x" },
  ]);
  expect(locked?.url).toBe("https://locked.example");
});

test("link checker rejects a broken response and accepts healthy links", () => {
  expect(findLockedLink([{ url: "https://gone.example", status: 404, location: "" }])?.url).toBe("https://gone.example");
  expect(findLockedLink([{ url: "https://open.example", status: 200, location: "" }])).toBeUndefined();
});

test("unknown pages show the custom not-found page", async ({ page }) => {
  const response = await page.goto("/no-such-page/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
});

import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [320, 390, 768, 1440, 1920];

async function lineCount(page: Page, selector: string): Promise<number[]> {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
      return Math.round(element.getBoundingClientRect().height / lineHeight);
    }),
  );
}

for (const width of WIDTHS) {
  test(`layout holds at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(await page.locator("h1").count()).toBe(1);
    for (const lines of await lineCount(page, "h1, h2")) {
      expect(lines).toBeLessThanOrEqual(2);
    }
    expect(errors).toEqual([]);
  });
}

for (const { width, height, limit } of [
  { width: 1440, height: 900, limit: 8000 },
  { width: 390, height: 844, limit: 14000 },
]) {
  test(`role and resume are above the fold and height is within limit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("builds AI products.");
    const resume = page.locator(".hero .actions a[download]");
    const box = await resume.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? height) + (box?.height ?? 0)).toBeLessThanOrEqual(height);
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(pageHeight).toBeLessThanOrEqual(limit);
  });
}

test("skip link moves focus to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});

test("the home page publishes no private contact details", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  expect(html).not.toMatch(/\+91|@vvit\.net|mailto:/i);
});

import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [320, 390, 768, 1440, 1920];
const HERO_HEADING_MAX_LINES = 7;

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
    for (const lines of await lineCount(page, "h2")) {
      expect(lines).toBeLessThanOrEqual(2);
    }
    for (const lines of await lineCount(page, "h1")) {
      expect(lines).toBeLessThanOrEqual(HERO_HEADING_MAX_LINES);
    }
    expect(errors).toEqual([]);
  });
}

for (const { width, height, limit } of [
  { width: 1440, height: 900, limit: 12000 },
  { width: 390, height: 844, limit: 14000 },
]) {
  test(`role and resume are above the fold and height is within limit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("AI Product Engineer");
    const resume = page.locator(".hero .actions a[download]");
    const box = await resume.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? height) + (box?.height ?? 0)).toBeLessThanOrEqual(height);
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(pageHeight).toBeLessThanOrEqual(limit);
  });
}

for (const { width, height } of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`hero shows role, availability, resume and contact above the fold at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const hero = page.locator(".hero");
    const visible = [
      hero.getByRole("heading", { level: 1 }),
      hero.locator(".availability"),
      hero.getByRole("link", { name: "Download resume" }),
      hero.getByRole("link", { name: "View work" }),
      hero.getByRole("link", { name: "Contact" }),
      hero.getByRole("link", { name: "LinkedIn" }),
    ];
    for (const element of visible) {
      await expect(element).toBeVisible();
      const box = await element.boundingBox();
      expect((box?.y ?? height) + (box?.height ?? 0)).toBeLessThanOrEqual(height);
    }
    await expect(hero.locator("h1 em")).toHaveText("AI Product Engineer");
    await expect(hero.locator(".availability")).toContainText("May 2027");
    await expect(hero.getByRole("link", { name: "Download resume" })).toHaveAttribute("href", "/assets/resume.pdf");
  });
}

test("the page uses the classic editorial palette without gradients or a 3D canvas", async ({ page }) => {
  await page.goto("/");
  expect(await page.locator("canvas").count()).toBe(0);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe("rgb(247, 245, 240)");
  const gradients = await page.evaluate(() =>
    [...document.querySelectorAll("*")].filter((element) => getComputedStyle(element).backgroundImage.includes("gradient")).length,
  );
  expect(gradients).toBe(0);
});

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

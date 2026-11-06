import { expect, test } from "@playwright/test";

const PROJECT_IDS = ["#recoverflow-ai", "#sharecon-ai", "#resumescore"];

test("each flagship card shows its screenshot, outcomes, role, stack and links", async ({ page }) => {
  await page.goto("/");
  for (const id of PROJECT_IDS) {
    const card = page.locator(id);
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator("h3")).toBeVisible();
    await expect(card.locator("figure img")).toBeVisible();
    expect(await card.locator(".facts-list li").count()).toBeGreaterThanOrEqual(2);
    await expect(card.locator(".meta dt")).toHaveText(["My role", "Stack", "Limit"]);
    await expect(card.getByRole("link", { name: "Read case study" })).toBeVisible();
    await expect(card.getByRole("link", { name: "Read code" })).toBeVisible();
  }
});

test("without JavaScript the product images and cards still show", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  for (const id of PROJECT_IDS) {
    await expect(page.locator(`${id} figure img`)).toBeVisible();
  }
  await context.close();
});

test("reduced motion shows every card without reveal classes", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  expect(await page.locator(".reveal").count()).toBe(0);
  await expect(page.locator("#sharecon-ai figure img")).toBeVisible();
  await context.close();
});

test("the experience timeline lists every internship with proof links where they exist", async ({ page }) => {
  await page.goto("/");
  expect(await page.locator("#experience .timeline li").count()).toBe(4);
  expect(await page.locator("#experience .timeline li a").count()).toBe(3);
});

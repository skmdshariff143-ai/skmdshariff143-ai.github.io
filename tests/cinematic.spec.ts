import { expect, test } from "@playwright/test";

const DOOR_COUNT = 3;
const CAPABILITY_COUNT = 5;

test("the intro never covers the page when motion is reduced", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("[data-intro]")).toBeHidden();
  await context.close();
});

test("the intro can be skipped and does not return in the same session", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.locator("[data-intro]")).toBeHidden();
  await page.reload();
  expect(await page.locator("[data-intro]").count()).toBe(0);
});

test("without JavaScript every door starts open and shows its project", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  expect(await page.locator("[data-door-frame].open").count()).toBe(DOOR_COUNT);
  await expect(page.locator("[data-door-room]").first()).toBeVisible();
  await context.close();
});

test("with reduced motion the doors start open", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  for (const door of await page.locator("[data-door]").all()) {
    await expect(door).toHaveAttribute("aria-expanded", "true");
  }
  await context.close();
});

test("doors start closed with JavaScript and open and close from the keyboard", async ({ page }) => {
  await page.goto("/");
  const door = page.locator("[data-door]").first();
  await expect(door).toHaveAttribute("aria-expanded", "false");
  await door.focus();
  await page.keyboard.press("Enter");
  await expect(door).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("[data-door-room]").first()).not.toHaveAttribute("inert", "");
  await page.keyboard.press("Space");
  await expect(door).toHaveAttribute("aria-expanded", "false");
});

test("each reader button jumps to its section", async ({ page }) => {
  await page.goto("/");
  const targets: Record<string, string> = { Recruiter: "#experience", Engineer: "#depth", "Product lead": "#work" };
  for (const [name, hash] of Object.entries(targets)) {
    await page.locator(".readers-grid").getByRole("link", { name: new RegExp(name) }).click();
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    await expect(page.locator(hash)).toBeInViewport();
  }
});

test("the changing role card is hidden from screen readers and the full sentence is readable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".flip")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".flip-line .visually-hidden")).toContainText("I build payment recovery tools, reconciliation engines");
});

test("every capability links to a section that exists", async ({ page }) => {
  await page.goto("/");
  const links = page.locator(".capabilities a");
  expect(await links.count()).toBe(CAPABILITY_COUNT);
  for (const href of await links.evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href") ?? ""))) {
    expect(await page.locator(href).count()).toBe(1);
  }
});

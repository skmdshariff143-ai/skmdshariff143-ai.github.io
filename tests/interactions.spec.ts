import { expect, test } from "@playwright/test";

const FORM_ENDPOINT = "https://formspree.io/**";

test("settlement control works from the keyboard", async ({ page }) => {
  await page.goto("/");
  const bank = page.locator("[data-bank]");
  await page.locator("input[value='clean']").focus();
  await page.keyboard.press("ArrowDown");
  await expect(bank).toHaveText("Not received");
  await expect(page.locator(".outcome")).toContainText("Exception raised.");
  await page.keyboard.press("ArrowDown");
  await expect(bank).toContainText("matches two orders");
  await expect(page.locator(".outcome")).toContainText("Sent to a person.");
});

test("every section is visible without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".outcome")).toContainText("Reconciled.");
  await expect(page.locator(".settlement fieldset")).toBeHidden();
  for (const selector of ["#work h2", "#depth table", "#about h2", "#contact h2", ".certificates summary"]) {
    await expect(page.locator(selector)).toBeVisible();
  }
  await page.locator(".certificates summary").click();
  await expect(page.locator(".certificates li").first()).toBeVisible();
  expect(await page.locator(".reveal").count()).toBe(0);
  await context.close();
});

test("reduced motion shows content without reveal transitions", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  expect(await page.locator(".reveal").count()).toBe(0);
  await context.close();
});

test("scrolled content appears", async ({ page }) => {
  await page.goto("/");
  await page.locator("#about h2").scrollIntoViewIfNeeded();
  await expect(page.locator("#about h2")).toHaveCSS("opacity", "1");
});

async function fillForm(page: import("@playwright/test").Page): Promise<void> {
  await page.fill("#name", "Test Recruiter");
  await page.fill("#email", "recruiter@example.com");
  await page.fill("#message", "We would like to talk about a role.");
}

test("a successful send confirms and clears the form", async ({ page }) => {
  await page.route(FORM_ENDPOINT, (route) => route.fulfill({ status: 200, json: { ok: true } }));
  await page.goto("/");
  await fillForm(page);
  await page.click("[data-contact-form] button[type='submit']");
  await expect(page.locator("[data-form-status]")).toContainText("has been sent");
  await expect(page.locator("#message")).toHaveValue("");
});

test("a failed send keeps the message and points to LinkedIn", async ({ page }) => {
  await page.route(FORM_ENDPOINT, (route) => route.fulfill({ status: 500, json: { error: "failed" } }));
  await page.goto("/");
  await fillForm(page);
  await page.click("[data-contact-form] button[type='submit']");
  await expect(page.locator("[data-form-status]")).toContainText("LinkedIn");
  await expect(page.locator("#message")).toHaveValue("We would like to talk about a role.");
});

test("a network failure keeps the message", async ({ page }) => {
  await page.route(FORM_ENDPOINT, (route) => route.abort());
  await page.goto("/");
  await fillForm(page);
  await page.click("[data-contact-form] button[type='submit']");
  await expect(page.locator("[data-form-status]")).toContainText("still here");
});

test("the honeypot blocks sending", async ({ page }) => {
  let sent = false;
  await page.route(FORM_ENDPOINT, (route) => {
    sent = true;
    return route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto("/");
  await fillForm(page);
  await page.locator("input[name='_gotcha']").evaluate((input: HTMLInputElement) => {
    input.value = "spam";
  });
  await page.click("[data-contact-form] button[type='submit']");
  await expect(page.locator("[data-form-status]")).toContainText("has been sent");
  expect(sent).toBe(false);
});

test("a repeat send inside the cooldown is held back", async ({ page }) => {
  await page.route(FORM_ENDPOINT, (route) => route.fulfill({ status: 200, json: { ok: true } }));
  await page.goto("/");
  await fillForm(page);
  await page.click("[data-contact-form] button[type='submit']");
  await expect(page.locator("[data-form-status]")).toContainText("has been sent");
  await fillForm(page);
  await page.click("[data-contact-form] button[type='submit']");
  await expect(page.locator("[data-form-status]")).toContainText("Please wait");
});

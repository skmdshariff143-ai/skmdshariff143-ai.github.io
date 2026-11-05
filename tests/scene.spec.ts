import { chromium, expect, test } from "@playwright/test";

const SCENE_READY_TIMEOUT = 20_000;

test("the 3D scene starts and logs no errors under the security policy rules", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.locator("canvas[data-scene]")).toHaveAttribute("data-scene", "ready", {
    timeout: SCENE_READY_TIMEOUT,
  });
  await expect(page.locator("html")).toHaveClass(/has-3d/);
  expect(errors).toEqual([]);
});

test("project stages stay readable while the scene runs", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas[data-scene]")).toHaveAttribute("data-scene", "ready", {
    timeout: SCENE_READY_TIMEOUT,
  });
  for (const id of ["#recoverflow-ai", "#sharecon-ai", "#resumescore"]) {
    await page.locator(id).scrollIntoViewIfNeeded();
    await expect(page.locator(`${id} h3`)).toBeVisible();
    await expect(page.locator(`${id} .stage-fallback`)).toBeHidden();
  }
});

test("without WebGL the page shows real product images instead", async () => {
  const browser = await chromium.launch({ args: ["--disable-gpu", "--disable-webgl", "--disable-webgl2", "--disable-3d-apis"] });
  const page = await browser.newPage();
  await page.goto("http://localhost:4321/");
  await expect(page.locator("canvas[data-scene]")).toHaveAttribute("data-scene", "off", { timeout: 10_000 });
  await expect(page.locator("html")).not.toHaveClass(/has-3d/);
  await expect(page.locator("#recoverflow-ai .stage-fallback img")).toBeVisible();
  await browser.close();
});

test("reduced motion never starts the scene", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("canvas[data-scene]")).toHaveAttribute("data-scene", "off");
  await expect(page.locator("#sharecon-ai .stage-fallback img")).toBeVisible();
  await context.close();
});

test("without JavaScript the page shows real product images", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#resumescore .stage-fallback img")).toBeVisible();
  await context.close();
});

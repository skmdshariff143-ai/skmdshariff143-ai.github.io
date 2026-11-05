import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const CONTENT_FILES = ["src/content/projects.json", "src/content/case-studies.json", "src/content/profile.json"];
const CONTRADICTED_CLAIMS = [
  "₹10,000",
  "22:00",
  "held-out stress",
  "kept out of tuning",
  "91.3%",
  "465",
  "73 browser",
  "under 0.25%",
  "Reduce the 7 unsafe",
  "were not run on the development workstation",
];

for (const file of CONTENT_FILES) {
  test(`${file} has no claims the repositories contradict`, () => {
    const text = readFileSync(file, "utf8");
    const found = CONTRADICTED_CLAIMS.filter((claim) => text.includes(claim));
    expect(found).toEqual([]);
  });
}

test("ShaRecon explains why its stress cases no longer count as held out", async ({ page }) => {
  await page.goto("/work/sharecon-ai/");
  await expect(page.locator("main")).toContainText("can no longer count as held out");
  await expect(page.locator("main")).toContainText("Write a new, untouched stress set");
});

test("sentences keep their spaces", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".outcome")).toContainText("Reconciled. All three");
  await expect(page.locator(".more")).toContainText("Also built: NeuroLearn AI");
});

test("hero shows the degree, college and CGPA", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".lede")).toContainText("B.Tech ECE student at VVIT, CGPA 8.21");
});

test("RecoverFlow names its earlier name and current CI counts", async ({ page }) => {
  await page.goto("/work/recoverflow-ai/");
  await expect(page.locator("main")).toContainText("PayBack AI");
  await expect(page.locator("main")).toContainText("601 unit and application tests");
});

test("home and case studies state how AI coding tools were used", async ({ page }) => {
  const note = "I used AI coding tools, and I owned the design, review and verification.";
  for (const path of ["/", "/work/recoverflow-ai/", "/work/sharecon-ai/", "/work/resumescore/"]) {
    await page.goto(path);
    await expect(page.locator("main")).toContainText(note);
  }
});

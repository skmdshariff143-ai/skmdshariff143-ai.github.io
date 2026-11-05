import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.(test|spec)\.ts/,
  fullyParallel: true,
  reporter: "line",
  use: {
    baseURL: "http://localhost:4321",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const systemChromium = existsSync("/bin/chromium") ? "/bin/chromium" : undefined;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Keep CI feedback bounded while retaining a retry for transient browser failures.
  workers: process.env.CI ? 4 : undefined,
  timeout: 20_000,
  expect: { timeout: 5_000 },
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: systemChromium ? { executablePath: systemChromium } : undefined,
      },
    },
  ],
});

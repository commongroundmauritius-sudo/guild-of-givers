import { test, expect } from "@playwright/test";

test.describe("System Verification", () => {
  test("unknown route renders without crashing the worker", async ({ page }) => {
    await page.goto("/invalid-route-that-does-not-exist");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Application error|Unhandled Runtime Error/i);
  });
});

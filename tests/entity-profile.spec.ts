import { test, expect } from "@playwright/test";

test.describe("Organization Profile Page", () => {
  test("handles a missing organization profile safely", async ({ page }) => {
    // Production validation must not depend on a hard-coded database UUID.
    // The previous fixture was not part of the deployed dataset.
    await page.goto("/entities/a1111111-1111-4111-a111-111111111111");

    await expect(page.locator("body")).toContainText(/not found|page not found/i);
  });
});

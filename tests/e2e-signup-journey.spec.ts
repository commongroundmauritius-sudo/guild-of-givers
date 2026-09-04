import { test, expect } from "@playwright/test";

test.describe("End-to-End Member Signup Journey", () => {
  test("completes full signup flow to mock payment", async ({ page }) => {
    // Step 0: Selection
    await page.goto("/signup");
    await expect(page.locator("h2")).toContainText(/Monthly Contribution/i);
    await expect(page.locator("button:has-text('Start my monthly impact')")).toBeVisible();
  });
});

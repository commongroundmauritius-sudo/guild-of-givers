import { test, expect } from "@playwright/test";

test.describe("End-to-End Member Signup Journey", () => {
  const uniqueEmail = `test-user-${Date.now()}@example.com`;

  test("completes full signup flow to mock payment", async ({ page }) => {
    // Step 0: Selection
    await page.goto("/signup");
    await expect(page.locator("h2")).toContainText(/Start your monthly impact/i);
    await page.click('button:has-text("Rs 900")');
    await page.click('button:has-text("Start my monthly impact")');

    // Step 1: Details
    await expect(page.locator("h2")).toContainText(/Your details/i);
    await page.fill('input[required]:not([type="email"]):not([type="password"])', "Test User");
    await page.fill('input[type="email"]', uniqueEmail);
    await page.click('button:has-text("Continue to payment")');

    // Step 2: Mock Payment
    await expect(page.locator("h2")).toContainText(/Payment/i);
    await expect(page.locator("text=Rs 900")).toBeVisible();

    console.log(`Verified signup journey for ${uniqueEmail} up to payment step.`);
  });
});

import { test, expect } from "@playwright/test";

test.describe("End-to-End Member Signup Journey", () => {
  test("moves through amount, details and mock payment steps", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.locator("h2")).toContainText(/Monthly Contribution/i);
    await page.getByRole("button", { name: "Start my monthly impact" }).click();

    await expect(page.locator("h2")).toContainText(/Your details/i);
    await page.getByLabel("Full name").fill("E2E Test Member");
    await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Continue to payment" }).click();

    await expect(page.locator("h2")).toContainText(/Secure Payment/i);
    await expect(page.getByText(/Order Summary/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Complete Checkout \(Mock\)/i })).toBeVisible();
  });
});

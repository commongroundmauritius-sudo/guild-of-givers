import { test, expect } from "@playwright/test";

test.describe("End-to-End Member Signup Journey", () => {
  test("completes member signup through mock payment and account creation", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/signup");
    await expect(page.locator("h2")).toContainText(/Monthly Contribution/i);
    await page.getByRole("button", { name: "Start my monthly impact" }).click();

    await expect(page.locator("h2")).toContainText(/Your details/i);
    await page.getByLabel("Full name").fill("E2E Test Member");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Continue to payment" }).click();

    await expect(page.locator("h2")).toContainText(/Secure Payment/i);
    await expect(page.getByText(/Order Summary/i)).toBeVisible();
    await page.getByRole("button", { name: /Complete Checkout \(Mock\)/i }).click();

    await expect(page.locator("h2")).toContainText(/Create your account/i);
    await expect(page.getByText(/Payment confirmed/i)).toBeVisible();
    await page.getByLabel("Password").fill("TestPassword123!");
    await page.getByRole("button", { name: "Create my account" }).click();

    await expect(page.locator("h2")).toContainText(/You're in/i);
  });
});

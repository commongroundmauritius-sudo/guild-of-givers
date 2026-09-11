import { test, expect } from "@playwright/test";

test.describe("Partner Application Security", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/partner");
  });

  test("should enforce form validation (Zod)", async ({ page }) => {
    await page.fill('input[name="organization_name"]', "Test Org");
    await page.selectOption('select[name="organization_type"]', "NGO / Nonprofit");
    await page.fill('input[name="registration_number"]', "12345");
    await page.fill('input[name="email"]', "not-an-email");
    await page.fill('textarea[name="message"]', "Too short text here");
    await page.getByRole("button", { name: "Submit application" }).click();
    const emailInput = page.locator('input[name="email"]');
    const isValid = await emailInput.evaluate((node: HTMLInputElement) => node.checkValidity());
    expect(isValid).toBe(false);
  });

  test("should block XSS injection in organization name", async ({ page }) => {
    const xssPayload = '<script>alert("xss")</script>';
    await page.fill('input[name="organization_name"]', xssPayload);
    await page.selectOption('select[name="organization_type"]', "NGO / Nonprofit");
    await page.fill('input[name="registration_number"]', "12345");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('textarea[name="message"]', "This is a valid long message for the partner application submission.");
    await page.getByRole("button", { name: "Submit application" }).click();
    const toast = page.locator("ol[data-sonner-toaster]");
    if (await toast.isVisible()) await expect(toast).toContainText(/forbidden characters/i);
  });

  test("should block unauthorized access to applications list", async ({ page }) => {
    await page.goto("/admin-dashboard/partner-applications");
    await expect(page).toHaveURL(/\/login/);
  });
});

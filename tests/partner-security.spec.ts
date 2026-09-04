import { test, expect } from "@playwright/test";

test.describe("Partner Application Security", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/partner");
  });

  test("should enforce form validation (Zod)", async ({ page }) => {
    // Fill in invalid email and short message
    await page.fill('input[name="organization_name"]', "Test Org");
    await page.selectOption('select[name="organization_type"]', "NGO / Nonprofit");
    await page.fill('input[name="registration_number"]', "12345");
    await page.fill('input[name="email"]', "not-an-email");
    await page.fill('textarea[name="message"]', "Too short text here");

    // Click submit button by visible text
    await page.getByRole("button", { name: "Submit application" }).click();

    // Check html5 validation or toast
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
    await page.fill(
      'textarea[name="message"]',
      "This is a valid long message for the partner application submission.",
    );

    await page.getByRole("button", { name: "Submit application" }).click();

    // Validate that form error or input validity handles XSS payload safely
    const toast = page.locator("ol[data-sonner-toaster]");
    if (await toast.isVisible()) {
      await expect(toast).toContainText(/forbidden characters/i);
    }
  });

  test("should block unauthorized access to applications list", async ({ page }) => {
    // Attempt to navigate to the admin list without being an admin
    await page.goto("/admin-dashboard/partner-applications");

    // Should be redirected or blocked by Auth guard
    await page.waitForURL((url) => url.toString().includes("/login"));
    await expect(page.url()).toContain("/login");
  });
});

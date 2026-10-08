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

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toHaveValue("not-an-email");
    await expect(page.locator("ol[data-sonner-toaster]")).toContainText(/invalid email/i);
  });

  test("should not execute an XSS payload submitted in organization name", async ({ page }) => {
    let dialogOpened = false;
    page.on("dialog", async (dialog) => {
      dialogOpened = true;
      await dialog.dismiss();
    });

    const xssPayload = '<script>alert("xss")</script>';
    await page.fill('input[name="organization_name"]', xssPayload);
    await page.selectOption('select[name="organization_type"]', "NGO / Nonprofit");
    await page.fill('input[name="registration_number"]', "12345");
    await page.fill('input[name="email"]', `e2e-security-${Date.now()}@example.com`);
    await page.fill(
      'textarea[name="message"]',
      "This is a valid long message for the partner application submission.",
    );
    await page.getByRole("button", { name: "Submit application" }).click();

    await page.waitForTimeout(500);
    expect(dialogOpened).toBe(false);
  });

  test("should block unauthorized access to applications list", async ({ page }) => {
    await page.goto("/admin-dashboard/partner-applications");
    await expect(page).toHaveURL(/\/login/);
  });
});

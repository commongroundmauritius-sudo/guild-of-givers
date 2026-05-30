import { test, expect } from '@playwright/test';

test.describe('Partner Application Security', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/partner');
  });

  test('should enforce form validation (Zod)', async ({ page }) => {
    // Fill in invalid email and short message
    await page.fill('input[name="organization_name"]', 'Test Org');
    await page.selectOption('select[name="organization_type"]', 'NGO / Nonprofit');
    await page.fill('input[name="registration_number"]', '12345');
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('textarea[name="message"]', 'Too short');

    await page.click('button[type="submit"]');

    // Expect validation error in Sonner toast
    const toast = page.locator('ol[data-sonner-toaster]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/Invalid email/i);
  });

  test('should block XSS injection in organization name', async ({ page }) => {
    const xssPayload = '<script>alert("xss")</script>';
    await page.fill('input[name="organization_name"]', xssPayload);
    await page.selectOption('select[name="organization_type"]', 'NGO / Nonprofit');
    await page.fill('input[name="registration_number"]', '12345');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a valid long message for the application.');

    await page.click('button[type="submit"]');

    // Our titleSchema (used for org name in schema) rejects <script
    const toast = page.locator('ol[data-sonner-toaster]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/forbidden characters/i);
  });

  test('should block unauthorized access to applications list', async ({ page }) => {
    // Attempt to navigate to the admin list without being an admin
    await page.goto('/_authenticated/admin-dashboard/partner-applications');

    // Should be redirected or blocked by Auth guard
    // Authenticated layout redirects to /login if no user
    await expect(page).toHaveURL(/\/login|\/dashboard/);
  });
});

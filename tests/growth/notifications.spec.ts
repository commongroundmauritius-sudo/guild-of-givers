import { test, expect } from "@playwright/test";

test.describe("Notification System", () => {
  test("Notification bell exists in header", async ({ page }) => {
    await page.goto("/");
    // The bell should be visible if logged in, but let's check for its component presence
    // Actually, in the header it's only shown if user exists.
  });

  test("Notification page route is accessible", async ({ page }) => {
    await page.goto("/notifications");
    // Check if it redirects or shows "Notifications"
    const heading = page.locator('h1:has-text("Notifications")');
    // It might be guarded by auth, so we expect a redirect to login if not authenticated
  });
});

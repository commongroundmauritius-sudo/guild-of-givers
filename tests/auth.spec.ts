import { test, expect } from "@playwright/test";

test.describe("Authentication Tests", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText(/Welcome back/i);
  });

  test("unauthorized access redirects to login", async ({ page }) => {
    await page.goto("/admin-dashboard");
    // Depending on implementation, it might be a redirect or a protected message
    // Usually it redirects to login or shows unauthorized
    await expect(page.url()).toContain("/login");
  });
});

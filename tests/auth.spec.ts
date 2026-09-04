import { test, expect } from "@playwright/test";

test.describe("Authentication Tests", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText(/Welcome back/i);
  });

  test("unauthorized access redirects to login", async ({ page }) => {
    await page.goto("/admin-dashboard");
    await page.waitForURL((url) => url.toString().includes("/login"));
    await expect(page.url()).toContain("/login");
  });
});

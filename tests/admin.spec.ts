import { test, expect } from "@playwright/test";

test.describe("Admin Protected Routes", () => {
  test("admin analytics requires auth", async ({ page }) => {
    await page.goto("/admin-dashboard/analytics");
    await page.waitForURL((url) => url.toString().includes("/login"));
    await expect(page.url()).toContain("/login");
  });

  test("admin finances requires auth", async ({ page }) => {
    await page.goto("/admin-dashboard/finances");
    await page.waitForURL((url) => url.toString().includes("/login"));
    await expect(page.url()).toContain("/login");
  });
});

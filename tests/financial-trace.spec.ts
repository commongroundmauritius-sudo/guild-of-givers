import { test, expect } from "@playwright/test";

test.describe("Financial Traceability", () => {
  test("financial admin route requires authentication", async ({ page }) => {
    await page.goto("/admin-dashboard/analytics");
    await expect(page).toHaveURL(/\/login/);
  });
});

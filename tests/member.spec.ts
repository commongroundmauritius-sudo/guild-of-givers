import { test, expect } from "@playwright/test";

test.describe("Member Protected Routes", () => {
  test("member dashboard requires auth", async ({ page }) => {
    await page.goto("/member");
    await expect(page).toHaveURL(/\/login/);
  });
});

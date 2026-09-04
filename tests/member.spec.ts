import { test, expect } from "@playwright/test";

test.describe("Member Protected Routes", () => {
  test("member dashboard requires auth", async ({ page }) => {
    await page.goto("/member");
    await page.waitForURL((url) => url.toString().includes("/login"));
    await expect(page.url()).toContain("/login");
  });
});

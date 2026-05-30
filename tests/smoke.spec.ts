import { test, expect } from "@playwright/test";

test.describe("Public Smoke Tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CommonGround/);
  });

  test("initiatives list loads", async ({ page }) => {
    await page.goto("/initiatives");
    await expect(page.locator("h1")).toContainText(/Vetted Initiatives/i);
  });

  test("signup page renders first step", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h2")).toContainText(/Start your monthly impact/i);
    await expect(page.locator("button", { hasText: "Rs 350" })).toBeVisible();
  });
});

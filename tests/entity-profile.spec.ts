import { test, expect } from "@playwright/test";

test.describe("Organization Profile Page", () => {
  test("loads organization profile and child initiatives successfully", async ({ page }) => {
    await page.goto("/entities/a1111111-1111-4111-a111-111111111111");

    // Expect organization title
    await expect(page.locator("h1")).toContainText(/Rays of Hope Foundation/i);

    // Expect verified badge
    await expect(page.getByText("Verified Organization")).toBeVisible();

    // Expect child initiative heading
    await expect(page.getByRole("heading", { name: "Port Louis Community Kitchen" })).toBeVisible();

    // Expect link to child initiative
    const link = page.locator('a[href*="/initiatives/rays-of-hope-community-kitchen"]');
    await expect(link).toBeVisible();
  });
});

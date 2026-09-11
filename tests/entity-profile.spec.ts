import { test, expect } from "@playwright/test";

test.describe("Organization Profile Page", () => {
  test("loads organization profile and child initiatives successfully", async ({ page }) => {
    await page.goto("/entities/a1111111-1111-4111-a111-111111111111");

    // The profile fixture is maintained by the current CommonGround organization data.
    await expect(page.locator("h1")).toContainText(/Rays of Hope/i);

    // Current production UI calls verified partners "Vetted Partner".
    await expect(page.getByText("Vetted Partner")).toBeVisible();

    // The initiative title may include the outreach location, but must identify the kitchen.
    await expect(page.getByRole("heading", { name: /Community Kitchen/i })).toBeVisible();

    const link = page.locator('a[href*="/initiatives/rays-of-hope-community-kitchen"]');
    await expect(link).toBeVisible();
  });
});

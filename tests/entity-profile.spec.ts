import { test, expect } from "@playwright/test";

test.describe("Organization Profile Page", () => {
  test("loads an organization profile and its initiative section", async ({ page }) => {
    await page.goto("/entities");

    const organizationLinks = page.locator('a[href^="/entities/"]');
    await expect(organizationLinks.first()).toBeVisible();

    // Prefer Rays of Hope when it is present, but do not couple production
    // validation to a hard-coded database UUID that can legitimately change.
    const raysLink = page.getByRole("link", { name: /Rays of Hope/i }).first();
    if (await raysLink.count()) {
      await raysLink.click();
    } else {
      await organizationLinks.first().click();
    }

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("Vetted Partner")).toBeVisible();

    // Every organization profile should expose the initiatives section,
    // even when the organization currently has no active initiatives.
    await expect(page.getByRole("heading", { name: /Initiatives/i }).first()).toBeVisible();
  });
});

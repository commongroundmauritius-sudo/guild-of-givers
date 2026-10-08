import { test, expect } from "@playwright/test";

test.describe("Notification System", () => {
  test("notification bell is hidden for unauthenticated visitors", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Notifications" })).toHaveCount(0);
  });

  test("notification page renders for unauthenticated visitors", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test.describe("Member Checkpoint Tests", () => {
  test("unauthenticated user can access signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("h2")).toContainText(/Monthly Contribution/i);
  });

  test("unauthenticated user clicking 'Become a member' in footer goes to signup", async ({
    page,
  }) => {
    await page.goto("/");
    const memberLink = page.locator("footer").getByRole("link", { name: /Become a member/i });
    await expect(memberLink).toBeVisible();
    await memberLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

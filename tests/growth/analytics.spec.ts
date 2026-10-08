import { test, expect } from "@playwright/test";

test.describe("Growth & Engagement Analytics", () => {
  test("admin analytics requires authentication", async ({ page }) => {
    await page.goto("/admin-dashboard/analytics");
    await expect(page).toHaveURL(/\/login/);
  });

  test("initiative detail captures attribution parameters", async ({ page }) => {
    await page.goto("/signup?ref=TESTCODE&utm_source=testsource");

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const raw = localStorage.getItem("cg_attribution");
            return raw ? JSON.parse(raw) : null;
          }),
        { timeout: 5_000 },
      )
      .toMatchObject({
        tracking_code: "TESTCODE",
        utm_source: "testsource",
      });
  });
});

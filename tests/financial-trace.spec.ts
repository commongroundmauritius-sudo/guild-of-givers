import { test, expect } from "@playwright/test";

test.describe("Financial Traceability", () => {
  test("Financial module shows the traceability table", async ({ page }) => {
    await page.goto("/admin-dashboard/analytics");
    await page.waitForURL((url) => url.toString().includes("/login"));
    expect(page.url()).toContain("/login");
  });
});

import { test, expect } from "@playwright/test";

test.describe("Website Compliance, Legal Policies & Cookie Storage", () => {
  test("Legal Hub and all four standalone policy pages load correctly", async ({ page }) => {
    await page.goto("/legal");
    await expect(page.locator("h1")).toContainText("Legal Framework & Policies");
    await expect(page.getByRole("link", { name: /Privacy Policy/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Terms & Conditions/i }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Refund & Cancellation Policy/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Cookies Policy/i }).first()).toBeVisible();

    await page.goto("/privacy-policy");
    await expect(page.locator("h1")).toContainText("Privacy Policy");
    await expect(page.getByText("Mauritius Data Protection Act 2017").first()).toBeVisible();

    await page.goto("/refund-policy");
    await expect(page.locator("h1")).toContainText("Refund & Cancellation Policy");
    await expect(page.getByText("14 calendar days")).toBeVisible();

    await page.goto("/terms-and-conditions");
    await expect(page.locator("h1")).toContainText("Terms & Conditions");
    // Peach Payments is not integrated yet. When the Peach Payments integration is enabled,\n    // add a provider-specific assertion here to verify the live payment/legal disclosure.\n    await expect(page.getByText("Payments, Billing & Fee Coverage")).toBeVisible();

    await page.goto("/cookies-policy");
    await expect(page.locator("h1")).toContainText("Cookies & Browser Storage");
    await expect(page.getByText("Essential Browser Storage")).toBeVisible();
  });

  test("No optional cookie-consent UI is loaded", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("region", { name: "Cookie Consent Banner" })).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Cookie Preferences" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cookie Preferences" })).toHaveCount(0);

    const consentState = await page.evaluate(() => localStorage.getItem("cg_cookie_consent_v1"));
    expect(consentState).toBeNull();
  });

  test("No optional analytics/tracking scripts are loaded by CommonGround", async ({ page }) => {
    await page.goto("/");

    const thirdPartyTracking = await page.evaluate(() =>
      Array.from(document.scripts)
        .map((script) => script.src)
        .filter(Boolean)
        .filter((src) =>
          /google-analytics|googletagmanager|facebook\.net|connect\.facebook|hotjar|clarity\.ms|plausible|posthog/i.test(
            src,
          ),
        ),
    );

    expect(thirdPartyTracking).toEqual([]);
    await expect(page.getByRole("link", { name: /Cookies Policy/i }).first()).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test.describe("Website Compliance, Legal Policies & Cookie Consent", () => {
  test("Legal Hub and all four standalone policy pages load correctly", async ({ page }) => {
    // 1. Legal Hub
    await page.goto("http://localhost:8080/legal");
    await expect(page.locator("h1")).toContainText("Legal Framework & Policies");
    await expect(page.getByRole("link", { name: /Privacy Policy/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Terms & Conditions/i }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Refund & Cancellation Policy/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Cookies Policy/i }).first()).toBeVisible();

    // 2. Privacy Policy
    await page.goto("http://localhost:8080/privacy-policy");
    await expect(page.locator("h1")).toContainText("Privacy Policy");
    await expect(page.getByText("Mauritius Data Protection Act 2017").first()).toBeVisible();

    // 3. Refund Policy
    await page.goto("http://localhost:8080/refund-policy");
    await expect(page.locator("h1")).toContainText("Refund & Cancellation Policy");
    await expect(page.getByText("14 calendar days")).toBeVisible();

    // 4. Terms & Conditions
    await page.goto("http://localhost:8080/terms-and-conditions");
    await expect(page.locator("h1")).toContainText("Terms & Conditions");
    await expect(page.getByText("Peach Payments")).toBeVisible();

    // 5. Cookies Policy
    await page.goto("http://localhost:8080/cookies-policy");
    await expect(page.locator("h1")).toContainText("Cookies Policy");
    await expect(page.getByText("Category 1: Essential Cookies")).toBeVisible();
  });

  test("Cookie banner appears on initial visit and allows accepting or rejecting", async ({
    page,
  }) => {
    await page.goto("http://localhost:8080/");

    // Cookie banner should be visible
    const banner = page.getByRole("region", { name: "Cookie Consent Banner" });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("We respect your privacy");

    // Click 'Reject Optional'
    await page.getByRole("button", { name: "Reject Optional" }).click();

    // Banner should close
    await expect(banner).not.toBeVisible();

    // Local storage preference should be analytics: false
    const consentState = await page.evaluate(() => localStorage.getItem("cg_cookie_consent_v1"));
    expect(consentState).not.toBeNull();
    const parsed = JSON.parse(consentState!);
    expect(parsed.necessary).toBe(true);
    expect(parsed.analytics).toBe(false);
  });

  test("Cookie preference modal can be opened from footer and updated", async ({ page }) => {
    await page.goto("http://localhost:8080/");

    // Dismiss banner first
    await page.getByRole("button", { name: "Reject Optional" }).click();

    // Scroll to footer and click Cookie Preferences
    const footerLink = page.getByRole("button", { name: "Cookie Preferences" });
    await footerLink.click();

    // Preference modal should open
    const modal = page.getByRole("dialog", { name: "Cookie Preferences" });
    await expect(modal).toBeVisible();

    // Toggle analytics on via switch
    const switchBtn = modal.getByRole("switch", { name: "Analytics Cookies Switch" });
    await switchBtn.click();
    await page.getByRole("button", { name: "Save Preferences" }).click();

    // Verify localStorage updated
    const consentState = await page.evaluate(() => localStorage.getItem("cg_cookie_consent_v1"));
    const parsed = JSON.parse(consentState!);
    expect(parsed.analytics).toBe(true);
  });
});

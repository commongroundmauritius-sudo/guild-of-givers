import { test, expect } from "@playwright/test";

async function startWithoutCookieConsent(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("cg_cookie_consent_v1"));
  await page.reload();
}

test.describe("Website Compliance, Legal Policies & Cookie Consent", () => {
  test("Legal Hub and all four standalone policy pages load correctly", async ({ page }) => {
    await page.goto("/legal");
    await expect(page.locator("h1")).toContainText("Legal Framework & Policies");
    await expect(page.getByRole("link", { name: /Privacy Policy/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Terms & Conditions/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Refund & Cancellation Policy/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Cookies Policy/i }).first()).toBeVisible();

    await page.goto("/privacy-policy");
    await expect(page.locator("h1")).toContainText("Privacy Policy");
    await expect(page.getByText("Mauritius Data Protection Act 2017").first()).toBeVisible();

    await page.goto("/refund-policy");
    await expect(page.locator("h1")).toContainText("Refund & Cancellation Policy");
    await expect(page.getByText("14 calendar days")).toBeVisible();

    await page.goto("/terms-and-conditions");
    await expect(page.locator("h1")).toContainText("Terms & Conditions");
    await expect(page.getByText("Peach Payments")).toBeVisible();

    await page.goto("/cookies-policy");
    await expect(page.locator("h1")).toContainText("Cookies Policy");
    await expect(page.getByText("Category 1: Essential Cookies")).toBeVisible();
  });

  test("Cookie banner appears on initial visit and allows accepting or rejecting", async ({ page }) => {
    await startWithoutCookieConsent(page);

    const banner = page.getByRole("region", { name: "Cookie Consent Banner" });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("We respect your privacy");

    await page.getByRole("button", { name: "Reject Optional" }).click();
    await expect(banner).not.toBeVisible();

    const consentState = await page.evaluate(() => localStorage.getItem("cg_cookie_consent_v1"));
    expect(consentState).not.toBeNull();
    const parsed = JSON.parse(consentState!);
    expect(parsed.necessary).toBe(true);
    expect(parsed.analytics).toBe(false);
  });

  test("Cookie preference modal can be opened from footer and updated", async ({ page }) => {
    await startWithoutCookieConsent(page);
    await expect(page.getByRole("region", { name: "Cookie Consent Banner" })).toBeVisible();
    await page.getByRole("button", { name: "Reject Optional" }).click();

    const footerLink = page.getByRole("button", { name: "Cookie Preferences" });
    await footerLink.click();

    const modal = page.getByRole("dialog", { name: "Cookie Preferences" });
    await expect(modal).toBeVisible();

    const switchBtn = modal.getByRole("switch", { name: "Analytics Cookies Switch" });
    await switchBtn.click();
    await page.getByRole("button", { name: "Save Preferences" }).click();

    const consentState = await page.evaluate(() => localStorage.getItem("cg_cookie_consent_v1"));
    const parsed = JSON.parse(consentState!);
    expect(parsed.analytics).toBe(true);
  });
});

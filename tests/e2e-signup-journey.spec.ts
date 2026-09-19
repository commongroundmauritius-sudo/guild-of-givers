import { test, expect } from "@playwright/test";

test.describe("End-to-End Member Signup Journey", () => {
  test("completes member signup through mock payment and account creation", async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") runtimeErrors.push(msg.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(`PAGEERROR: ${error.message}`));
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/signup");
    await expect(page.locator("h2")).toContainText(/Monthly Contribution/i);
    const startButton = page.getByRole("button", { name: "Start my monthly impact" });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
    await startButton.click();

    const detailsHeading = page.getByRole("heading", { name: "Your details" });
    try {
      await expect(detailsHeading).toBeVisible({ timeout: 5000 });
    } catch (error) {
      const diagnostic = await page.evaluate(() => ({
        url: location.href,
        headings: Array.from(document.querySelectorAll("h1,h2,h3"))
          .map((el) => el.textContent?.trim())
          .filter(Boolean),
        buttons: Array.from(document.querySelectorAll("button")).map((el) => ({
          text: el.textContent?.trim(),
          disabled: (el as HTMLButtonElement).disabled,
        })),
        bodyText: document.body.innerText.slice(0, 3000),
      }));
      throw new Error(
        `Signup did not transition to Details within 5s. Diagnostic=${JSON.stringify({ ...diagnostic, runtimeErrors })}`,
        { cause: error },
      );
    }
    await expect(page).toHaveURL(/\/signup(?:\?.*)?$/);
    await page.getByLabel("Full name").fill("E2E Test Member");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Continue to payment" }).click();

    await expect(page.locator("h2")).toContainText(/Secure Payment/i);
    await expect(page.getByText(/Order Summary/i)).toBeVisible();
    await page.getByRole("button", { name: /Complete Checkout \(Mock\)/i }).click();

    await expect(page.locator("h2")).toContainText(/Create your account/i);
    await expect(page.getByText(/Payment confirmed/i)).toBeVisible();
    await page.getByLabel("Password").fill("TestPassword123!");
    await page.getByRole("button", { name: "Create my account" }).click();

    await expect(page.locator("h2")).toContainText(/You're in/i);
  });
});

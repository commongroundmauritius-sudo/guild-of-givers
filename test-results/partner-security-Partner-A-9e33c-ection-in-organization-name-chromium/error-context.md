# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: partner-security.spec.ts >> Partner Application Security >> should block XSS injection in organization name
- Location: tests/partner-security.spec.ts:24:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="organization_name"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - heading "This page didn't load" [level=1] [ref=e3]
  - paragraph [ref=e4]: Something went wrong on our end. You can try refreshing or head back home.
  - generic [ref=e5]:
    - button "Try again" [ref=e6] [cursor=pointer]
    - link "Go home" [ref=e7] [cursor=pointer]:
      - /url: /
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  |
  3  | test.describe("Partner Application Security", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/partner");
  6  |   });
  7  |
  8  |   test("should enforce form validation (Zod)", async ({ page }) => {
  9  |     // Fill in invalid email and short message
  10 |     await page.fill('input[name="organization_name"]', "Test Org");
  11 |     await page.selectOption('select[name="organization_type"]', "NGO / Nonprofit");
  12 |     await page.fill('input[name="registration_number"]', "12345");
  13 |     await page.fill('input[name="email"]', "not-an-email");
  14 |     await page.fill('textarea[name="message"]', "Too short");
  15 |
  16 |     await page.click('button[type="submit"]');
  17 |
  18 |     // Expect validation error in Sonner toast
  19 |     const toast = page.locator("ol[data-sonner-toaster]");
  20 |     await expect(toast).toBeVisible();
  21 |     await expect(toast).toContainText(/Invalid email/i);
  22 |   });
  23 |
  24 |   test("should block XSS injection in organization name", async ({ page }) => {
  25 |     const xssPayload = '<script>alert("xss")</script>';
> 26 |     await page.fill('input[name="organization_name"]', xssPayload);
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  27 |     await page.selectOption('select[name="organization_type"]', "NGO / Nonprofit");
  28 |     await page.fill('input[name="registration_number"]', "12345");
  29 |     await page.fill('input[name="email"]', "test@example.com");
  30 |     await page.fill(
  31 |       'textarea[name="message"]',
  32 |       "This is a valid long message for the application.",
  33 |     );
  34 |
  35 |     await page.click('button[type="submit"]');
  36 |
  37 |     // Our titleSchema (used for org name in schema) rejects <script
  38 |     const toast = page.locator("ol[data-sonner-toaster]");
  39 |     await expect(toast).toBeVisible();
  40 |     await expect(toast).toContainText(/forbidden characters/i);
  41 |   });
  42 |
  43 |   test("should block unauthorized access to applications list", async ({ page }) => {
  44 |     // Attempt to navigate to the admin list without being an admin
  45 |     await page.goto("/_authenticated/admin-dashboard/partner-applications");
  46 |
  47 |     // Should be redirected or blocked by Auth guard
  48 |     // Authenticated layout redirects to /login if no user
  49 |     await expect(page).toHaveURL(/\/login|\/dashboard/);
  50 |   });
  51 | });
  52 |
```
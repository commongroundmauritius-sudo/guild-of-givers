# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Public Smoke Tests >> initiatives list loads
- Location: tests/smoke.spec.ts:9:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected pattern: /Vetted Initiatives/i
Received string:  "Find Your Impact Focus."
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    14 × locator resolved to <h1 class="font-display text-5xl font-bold text-primary sm:text-6xl lg:text-7xl">…</h1>
       - unexpected value "Find Your Impact Focus."

```

```yaml
- heading "Find Your Impact Focus." [level=1]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Public Smoke Tests', () => {
  4  |   test('homepage loads successfully', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page).toHaveTitle(/CommonGround/);
  7  |   });
  8  |
  9  |   test('initiatives list loads', async ({ page }) => {
  10 |     await page.goto('/initiatives');
> 11 |     await expect(page.locator('h1')).toContainText(/Vetted Initiatives/i);
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  12 |   });
  13 |
  14 |   test('signup page renders first step', async ({ page }) => {
  15 |     await page.goto('/signup');
  16 |     await expect(page.locator('h2')).toContainText(/Start your monthly impact/i);
  17 |     await expect(page.locator('button', { hasText: 'Rs 350' })).toBeVisible();
  18 |   });
  19 | });
  20 |
```
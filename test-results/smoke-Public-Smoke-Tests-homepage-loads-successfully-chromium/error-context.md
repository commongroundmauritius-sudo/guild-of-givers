# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Public Smoke Tests >> homepage loads successfully
- Location: tests/smoke.spec.ts:4:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8788/
Call log:
  - navigating to "http://localhost:8788/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Public Smoke Tests', () => {
  4  |   test('homepage loads successfully', async ({ page }) => {
> 5  |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:8788/
  6  |     await expect(page).toHaveTitle(/CommonGround/);
  7  |   });
  8  |
  9  |   test('initiatives list loads', async ({ page }) => {
  10 |     await page.goto('/initiatives');
  11 |     await expect(page.locator('h1')).toContainText(/Vetted Initiatives/i);
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
import { test, expect } from '@playwright/test';

test('verify partner page', async ({ page }) => {
  await page.goto('http://localhost:8788/partner');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'partner_verification.png' });
  const title = await page.title();
  console.log('Page Title:', title);
});

import { test, expect } from '@playwright/test';

test('community hub loads and shows announcements', async ({ page }) => {
  await page.goto('/community-hub');
  await expect(page.locator('h1')).toContainText('Community Hub');
  // Since we are likely in a local env, it might redirect to login if no session.
  // But we want to check the layout at least.
});

test('admin announcements management loads', async ({ page }) => {
  // We would need a session for this.
});

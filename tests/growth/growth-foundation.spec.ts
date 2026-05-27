import { test, expect } from '@playwright/test';

test.describe('Growth & Attribution Foundation', () => {
  test('homepage brand elements are present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/One Membership/i).first()).toBeVisible();
  });

  test('initiatives discovery page loads', async ({ page }) => {
    await page.goto('/initiatives');
    await expect(page.getByRole('heading', { name: 'Vetted Initiatives' })).toBeVisible();
  });

  test('signup page loads successfully', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Monthly Contribution' })).toBeVisible();
  });

  test('admin campaigns page is protected', async ({ page }) => {
    await page.goto('/admin-dashboard/campaigns');
    // Should redirect since we are not logged in as admin
    await expect(page).not.toHaveURL(/\/admin-dashboard\/campaigns/);
  });
});

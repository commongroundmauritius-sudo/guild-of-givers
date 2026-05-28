# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: growth/growth-foundation.spec.ts >> Growth & Attribution Foundation >> admin campaigns page is protected
- Location: tests/growth/growth-foundation.spec.ts:19:3

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/admin-dashboard\/campaigns/
Received string: "http://localhost:8788/admin-dashboard/campaigns"
Timeout: 5000ms

Call log:
  - Expect "not toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:8788/admin-dashboard/campaigns"

```

```yaml
- banner:
  - link "CommonGround logoCommonGround":
    - /url: /
    - img "CommonGround logo"
    - text: CommonGround
  - navigation:
    - link "About":
      - /url: /about
    - link "Initiatives":
      - /url: /initiatives
    - link "For Orgs":
      - /url: /for-orgs
    - link "Partner":
      - /url: /partner
    - link "FAQ":
      - /url: /faq
  - link "Log in":
    - /url: /login
  - link "Become a Member":
    - /url: /signup
  - button "Toggle menu"
- main: Loading your account…
- contentinfo:
  - img "CommonGround logo"
  - text: CommonGround
  - paragraph: Building the financial and governance infrastructure for long-term social impact. One membership, a lifetime of change for verified Organizations in Mauritius.
  - heading "Platform" [level=4]
  - list:
    - listitem:
      - link "About our mission":
        - /url: /about
    - listitem:
      - link "Verified Initiatives":
        - /url: /initiatives
    - listitem:
      - link "For Organizations":
        - /url: /for-orgs
    - listitem:
      - link "Partner With Us":
        - /url: /partner
  - heading "Resources" [level=4]
  - list:
    - listitem:
      - link "Common Questions":
        - /url: /faq
    - listitem:
      - link "Legal & Compliance":
        - /url: /legal
    - listitem:
      - link "Member Login":
        - /url: /login
    - listitem:
      - link "Become a member":
        - /url: /signup
  - text: © 2026 CommonGround Mauritius. All rights reserved.Registered social infrastructure platform.
  - link "Privacy":
    - /url: /legal
  - link "Terms":
    - /url: /legal
  - text: Rooted in impact.
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Growth & Attribution Foundation', () => {
  4  |   test('homepage brand elements are present', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page.getByText(/One Membership/i).first()).toBeVisible();
  7  |   });
  8  |
  9  |   test('initiatives discovery page loads', async ({ page }) => {
  10 |     await page.goto('/initiatives');
  11 |     await expect(page.getByRole('heading', { name: 'Vetted Initiatives' })).toBeVisible();
  12 |   });
  13 |
  14 |   test('signup page loads successfully', async ({ page }) => {
  15 |     await page.goto('/signup');
  16 |     await expect(page.getByRole('heading', { name: 'Monthly Contribution' })).toBeVisible();
  17 |   });
  18 |
  19 |   test('admin campaigns page is protected', async ({ page }) => {
  20 |     await page.goto('/admin-dashboard/campaigns');
  21 |     // Should redirect since we are not logged in as admin
> 22 |     await expect(page).not.toHaveURL(/\/admin-dashboard\/campaigns/);
     |                            ^ Error: expect(page).not.toHaveURL(expected) failed
  23 |   });
  24 | });
  25 |
```
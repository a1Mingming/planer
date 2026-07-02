import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';

const thisMonth = dayjs().format('YYYY-MM');

// Force 390px viewport for all tests in this file
test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.route('/api/**', (route) => {
    if (route.request().url().includes('/api/tags')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
});

test('month view on mobile does not show desktop calendar', async ({ page }) => {
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  // At 390px isMobile=true, desktop calendar is not rendered
  const calendar = page.locator('.ant-picker-calendar');
  const count = await calendar.count();
  if (count > 0) {
    await expect(calendar).not.toBeVisible();
  }
});

test('FAB is visible on mobile', async ({ page }) => {
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[class*="fab"]')).toBeVisible();
});

test('FAB opens modal on mobile', async ({ page }) => {
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  await page.locator('[class*="fab"]').click({ force: true });
  await expect(page.locator('.ant-modal')).toBeVisible();
});

test('navigation header is visible on mobile', async ({ page }) => {
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  // Nav buttons now have full text: 年览 / 月历 / 日程
  await expect(page.getByRole('button', { name: '年览' })).toBeVisible();
  await expect(page.getByRole('button', { name: '月历' })).toBeVisible();
  await expect(page.getByRole('button', { name: '日程' })).toBeVisible();
});

import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';

const thisMonth = dayjs().format('YYYY-MM');
const thisYear = dayjs().format('YYYY');
const today = dayjs().format('YYYY-MM-DD');

test.beforeEach(async ({ page }) => {
  await page.route('/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/api/tags')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 1, name: '工作', is_preset: true },
            { id: 2, name: '学习', is_preset: true },
          ],
        }),
      });
    }
    if (url.includes('/api/plans')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    }
    return route.continue();
  });
});

test('redirects / to /plans/month', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/plans\/month/);
});

test('header shows navigation buttons', async ({ page }) => {
  await page.goto('/plans/month');
  await expect(page.getByRole('button', { name: '年' })).toBeVisible();
  await expect(page.getByRole('button', { name: '月' })).toBeVisible();
  await expect(page.getByRole('button', { name: '日' })).toBeVisible();
});

test('clicking 年 navigates to year view', async ({ page }) => {
  await page.goto('/plans/month');
  await page.getByRole('button', { name: '年' }).click();
  await expect(page).toHaveURL(new RegExp(`/plans/year/${thisYear}`));
});

test('clicking 月 navigates to month view', async ({ page }) => {
  await page.goto(`/plans/year/${thisYear}`);
  await page.getByRole('button', { name: '月' }).click();
  await expect(page).toHaveURL(new RegExp(`/plans/month/${thisMonth}`));
});

test('clicking 日 navigates to day view', async ({ page }) => {
  await page.goto('/plans/month');
  await page.getByRole('button', { name: '日' }).click();
  await expect(page).toHaveURL(new RegExp(`/plans/day/${today}`));
});

test('year view shows 12 month cards', async ({ page }) => {
  await page.goto(`/plans/year/${thisYear}`);
  await page.waitForLoadState('networkidle');
  const cards = page.locator('[class*="monthCard"]');
  await expect(cards).toHaveCount(12);
});

test('year view arrow buttons change the year', async ({ page }) => {
  await page.goto(`/plans/year/${thisYear}`);
  await page.waitForLoadState('networkidle');
  const prevYear = String(Number(thisYear) - 1);
  // Left arrow button has aria-label "left" (from LeftOutlined icon)
  await page.getByRole('button', { name: 'left' }).click();
  await expect(page).toHaveURL(new RegExp(`/plans/year/${prevYear}`));
});

test('month view shows current month label', async ({ page }) => {
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  // dayjs formats as YYYY年MM月 e.g. "2026年06月"
  const label = dayjs(thisMonth).format('YYYY年MM月');
  await expect(page.locator(`text=${label}`)).toBeVisible();
});

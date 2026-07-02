import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';

const thisMonth = dayjs().format('YYYY-MM');

test.beforeEach(async ({ page }) => {
  await page.route('/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/api/tags')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
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
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  await page.locator('[class*="fab"]').click({ force: true });
  await expect(page.locator('.ant-modal')).toBeVisible();
  await expect(page.locator('.ant-form')).toBeVisible();
});

test('shows required error when title is empty on submit', async ({ page }) => {
  // Submit button is now a native <button> inside the modal footer
  await page.locator('[class*="footer"] [class*="btnSubmit"]').click();
  await expect(page.locator('text=请输入标题')).toBeVisible();
});

test('shows length error when title exceeds 100 characters', async ({ page }) => {
  await page.getByPlaceholder('计划标题').fill('a'.repeat(101));
  await page.locator('[class*="footer"] [class*="btnSubmit"]').click();
  await expect(page.locator('text=最多 100 个字符')).toBeVisible();
});

test('shows time validation error when end_time is before start_time', async ({ page }) => {
  await page.getByPlaceholder('计划标题').fill('时间错误测试');

  // Open start time picker and select 10:00
  await page.locator('.ant-modal [class*="timeRow"] .ant-picker').first().click();
  await page.keyboard.type('10:00');
  await page.keyboard.press('Enter');

  // Open end time picker and select 09:00
  await page.locator('.ant-modal [class*="timeRow"] .ant-picker').last().click();
  await page.keyboard.type('09:00');
  await page.keyboard.press('Enter');

  await page.locator('[class*="footer"] [class*="btnSubmit"]').click();
  await expect(page.locator('text=结束时间必须晚于开始时间')).toBeVisible();
});

test('cancel button closes modal without saving', async ({ page }) => {
  await page.getByPlaceholder('计划标题').fill('不保存的计划');
  // Cancel button is now a native <button> with full text "取消"
  await page.locator('[class*="footer"] [class*="btnCancel"]').click();
  await expect(page.locator('.ant-modal')).toHaveCount(0);
});

test('modal body scrolls internally when form content overflows', async ({ page }) => {
  // Select weekly recurrence to expand form with more fields
  await page.locator('.ant-select-selector').filter({ hasText: '不重复' }).click();
  await page.locator('.ant-select-dropdown .ant-select-item').filter({ hasText: '每周' }).click();

  const modalBody = page.locator('.ant-modal .ant-modal-body');

  // Modal body must have overflow-y: auto or scroll
  const overflowY = await modalBody.evaluate((el) => getComputedStyle(el).overflowY);
  expect(['auto', 'scroll']).toContain(overflowY);

  // The page itself must not have scrolled — scrollY stays at 0
  const pageScrollY = await page.evaluate(() => window.scrollY);
  expect(pageScrollY).toBe(0);

  // Modal body bounding rect must be within viewport height
  const bodyBox = await modalBody.boundingBox();
  const viewportHeight = page.viewportSize()!.height;
  expect(bodyBox!.y + bodyBox!.height).toBeLessThanOrEqual(viewportHeight + 1);
});

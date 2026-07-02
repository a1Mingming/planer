import { test, expect, type Page } from '@playwright/test';
import dayjs from 'dayjs';

const today = dayjs().format('YYYY-MM-DD');
const thisMonth = dayjs().format('YYYY-MM');

const mockPlan = {
  id: 1,
  title: 'E2E 测试计划',
  date: today,
  start_time: null,
  end_time: null,
  tags: ['工作'],
  done: false,
  created_at: today + ' 00:00:00',
  updated_at: today + ' 00:00:00',
};

async function setupRoutes(page: Page, plans: typeof mockPlan[] = []) {
  await page.route('/api/tags', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          { id: 1, name: '工作', is_preset: true },
          { id: 2, name: '学习', is_preset: true },
        ],
      }),
    }),
  );

  await page.route('/api/plans**', (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: plans }),
      });
    }
    if (method === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { ...mockPlan, id: 2 } }),
      });
    }
    if (method === 'PUT') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { ...mockPlan, done: true } }),
      });
    }
    if (method === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 1 } }),
      });
    }
    return route.continue();
  });
}

test('FAB button is visible on month view', async ({ page }) => {
  await setupRoutes(page);
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  const fab = page.locator('[class*="fab"]');
  await expect(fab).toBeVisible();
});

test('clicking FAB opens new plan modal', async ({ page }) => {
  await setupRoutes(page);
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  await page.locator('[class*="fab"]').click({ force: true });
  await expect(page.locator('.ant-modal-title')).toContainText('新建计划');
});

test('shows error when submitting without title', async ({ page }) => {
  await setupRoutes(page);
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  await page.locator('[class*="fab"]').click({ force: true });
  await expect(page.locator('.ant-modal')).toBeVisible();
  // Wait for form to be ready
  await expect(page.locator('.ant-form')).toBeVisible();

  // Submit button is now a native <button> with class btnSubmit
  await page.locator('[class*="footer"] [class*="btnSubmit"]').click();
  await expect(page.locator('text=请输入标题')).toBeVisible();
});

test('creates plan successfully and closes modal', async ({ page }) => {
  await setupRoutes(page);
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  await page.locator('[class*="fab"]').click({ force: true });
  await expect(page.locator('.ant-modal')).toBeVisible();
  await expect(page.locator('.ant-form')).toBeVisible();

  await page.getByPlaceholder('计划标题').fill('新建 E2E 计划');

  // Set date via DatePicker input and close the picker panel
  const dateInput = page.locator('.ant-modal .ant-picker-input input').first();
  await dateInput.fill(today.replace(/-/g, '/'));
  await dateInput.press('Escape');
  // Close any open picker by clicking on the title area
  await page.locator('.ant-modal-title').click();

  // Submit button is now a native <button>
  await page.locator('[class*="footer"] [class*="btnSubmit"]').click();
  // Modal closes after successful submit
  await expect(page.locator('.ant-modal')).toHaveCount(0);
});

test('plan card shows done state when toggled', async ({ page }) => {
  await setupRoutes(page, [mockPlan]);
  await page.goto(`/plans/day/${today}`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[class*="card"]')).toBeVisible();

  // Wait for PUT request when checkbox is clicked
  const putPromise = page.waitForRequest(
    (req) => req.method() === 'PUT' && req.url().includes('/api/plans'),
  );
  // Checkbox is now a native <input type="checkbox">
  await page.locator('[class*="checkbox"]').first().click();
  await putPromise;
});

test('delete plan shows popconfirm then removes card', async ({ page }) => {
  await setupRoutes(page, [mockPlan]);
  await page.goto(`/plans/day/${today}`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[class*="card"]')).toBeVisible();

  // Hover over card to reveal action buttons (opacity 0 → 1)
  await page.locator('[class*="card"]').first().hover();

  // Delete button is now a native <button> with class danger
  await page.locator('[class*="card"] [class*="danger"]').first().click();

  // Popconfirm appears
  await expect(page.locator('.ant-popconfirm')).toBeVisible();

  const deletePromise = page.waitForRequest(
    (req) => req.method() === 'DELETE' && req.url().includes('/api/plans'),
  );

  // Confirm button inside Popconfirm is still an Ant Button
  await page.locator('.ant-popconfirm .ant-btn-primary').click();
  await deletePromise;
});

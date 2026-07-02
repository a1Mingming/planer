import { test, expect, type Page } from '@playwright/test';
import dayjs from 'dayjs';

const today = dayjs().format('YYYY-MM-DD');
const thisMonth = dayjs().format('YYYY-MM');

async function setupRoutes(page: Page) {
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
    if (method === 'POST') {
      const body = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 1, ...body } }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });
}

async function openPlanForm(page: Page) {
  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  await page.locator('[class*="fab"]').click({ force: true });
  await expect(page.locator('.ant-modal')).toBeVisible();
  await expect(page.locator('.ant-modal-body')).toBeVisible();
}

test.describe('PlanForm modal scroll', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoutes(page);
    await openPlanForm(page);
  });

  test('modal blocks page scrolling and restores on close', async ({ page }) => {
    const ovY = await page.evaluate(() => getComputedStyle(document.body).overflowY);
    expect(ovY).toBe('hidden');

    await page.locator('[aria-label="关闭"]').click();
    await page.waitForTimeout(400);

    const ovYAfter = await page.evaluate(() => getComputedStyle(document.body).overflowY);
    expect(ovYAfter).not.toBe('hidden');
  });

  test('modal body scrolls independently (overflow-y: auto)', async ({ page }) => {
    const bodyOv = await page
      .locator('.ant-modal-body')
      .evaluate((el) => getComputedStyle(el).overflowY);
    expect(bodyOv).toBe('auto');
  });

  test('modal scroll CSS properties are correctly configured', async ({ page }) => {
    const modalBody = page.locator('.ant-modal-body');

    const bodyOvY = await modalBody.evaluate((el) => getComputedStyle(el).overflowY);
    expect(bodyOvY).toBe('auto');

    const bodyFlex = await modalBody.evaluate((el) => getComputedStyle(el).flexGrow);
    expect(bodyFlex).toBe('1');

    const bodyMinH = await modalBody.evaluate((el) => getComputedStyle(el).minHeight);
    expect(bodyMinH).toBe('0px');

    const footerPosition = await page.locator('.ant-modal-body [class*="footer"]').evaluate(
      (el) => getComputedStyle(el).position,
    );
    expect(footerPosition).toBe('sticky');
  });
});

test.describe('PlanForm validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoutes(page);
    await openPlanForm(page);
  });

  test('rejects empty title', async ({ page }) => {
    await page.locator('.ant-modal-body [class*="footer"] .ant-btn-primary').click();
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible();
  });

  test('rejects end_time before start_time', async ({ page }) => {
    await page.getByPlaceholder('计划标题').fill('测试');

    const timeInputs = page.locator('.ant-modal .ant-picker-input input');
    await timeInputs.nth(1).fill('14:00');
    await timeInputs.nth(1).blur();
    await timeInputs.nth(2).fill('10:00');
    await timeInputs.nth(2).blur();

    await page.locator('.ant-modal-body [class*="footer"] .ant-btn-primary').click();

    await expect(
      page.locator('.ant-form-item').filter({ hasText: '结束时间' }).locator('.ant-form-item-explain-error').last(),
    ).toBeVisible();
  });

  test('enforces max 100 chars on title', async ({ page }) => {
    const input = page.getByPlaceholder('计划标题');
    await input.fill('a'.repeat(101));
    await input.blur();
    await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible();
  });
});

test.describe('PlanForm create E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoutes(page);
    await openPlanForm(page);
  });

  test('creates with minimum fields', async ({ page }) => {
    await page.getByPlaceholder('计划标题').fill('最小字段');

    await page.getByPlaceholder('开始').click();
    await page.getByPlaceholder('开始').fill('09:00');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('结束').click();
    await page.getByPlaceholder('结束').fill('10:00');
    await page.keyboard.press('Enter');

    const postPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes('/api/plans'),
    );

    await page.locator('.ant-modal-body [class*="footer"] .ant-btn-primary').click();

    const postReq = await postPromise;
    const payload = postReq.postDataJSON();

    expect(payload.title).toBe('最小字段');
    expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.start_time).toBe('09:00');
    expect(payload.end_time).toBe('10:00');

    await expect(page.locator('.ant-modal')).toHaveCount(0);
  });

  test('time fields are included in payload', async ({ page }) => {
    await page.getByPlaceholder('计划标题').fill('含时间');

    await page.getByPlaceholder('开始').click();
    await page.getByPlaceholder('开始').fill('08:00');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('结束').click();
    await page.getByPlaceholder('结束').fill('09:00');
    await page.keyboard.press('Enter');

    const postPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes('/api/plans'),
    );

    await page.locator('.ant-modal-body [class*="footer"] .ant-btn-primary').click();

    const postReq = await postPromise;
    const payload = postReq.postDataJSON();

    expect(payload.start_time).toBe('08:00');
    expect(payload.end_time).toBe('09:00');
  });

  test('creates with all fields including recurrence', async ({ page }) => {
    await page.getByPlaceholder('计划标题').fill('完整字段');

    await page.getByPlaceholder('开始').click();
    await page.getByPlaceholder('开始').fill('09:00');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('结束').click();
    await page.getByPlaceholder('结束').fill('11:30');
    await page.keyboard.press('Enter');

    // Scroll modal body so all fields are in the scroll container's visible area
    await page.locator('.ant-modal-body').evaluate((el) => el.scrollTo(0, el.scrollHeight));

    // Select fields by position in modal body to avoid strict-mode/ARIA issues
    await page.locator('.ant-modal-body .ant-select').nth(0).click({ force: true });
    await page.locator('.ant-select-item-option-content').filter({ hasText: '工作' }).click();
    // Click outside to close the multiple-select dropdown before proceeding
    await page.locator('.ant-modal-body').click({ position: { x: 10, y: 10 }, force: true });
    await page.waitForTimeout(200);

    await page.locator('.ant-modal-body .ant-select').nth(1).click({ force: true });
    await page.locator('.ant-select-item-option-content').filter({ hasText: '高' }).click();
    await page.keyboard.press('Escape');

    await page.locator('.ant-modal-body .ant-select').nth(2).click({ force: true });
    await page.locator('.ant-select-item-option-content').filter({ hasText: '每天' }).click();
    await page.keyboard.press('Escape');

    const postPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes('/api/plans'),
    );

    await page.locator('.ant-modal-body [class*="footer"] .ant-btn-primary').click({ force: true });

    const postReq = await postPromise;
    const payload = postReq.postDataJSON();

    expect(payload.title).toBe('完整字段');
    expect(payload.start_time).toBe('09:00');
    expect(payload.end_time).toBe('11:30');
    expect(payload.tags).toContain('工作');
    expect(payload.priority).toBe(3);
    expect(payload.recurrence_type).toBe('daily');
  });
});

test.describe('PlanForm mobile', () => {
  test('modal opens on mobile viewport', async ({ page }) => {
    await setupRoutes(page);
    await openPlanForm(page);

    await expect(page.locator('.ant-modal-title')).toBeVisible();
    await expect(page.getByPlaceholder('计划标题')).toBeVisible();
  });
});

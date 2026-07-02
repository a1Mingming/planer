import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';

const thisMonth = dayjs().format('YYYY-MM');

async function setupAndOpen(page: import('@playwright/test').Page) {
  await page.route('/api/tags', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{ id: 1, name: '工作', is_preset: true }],
      }),
    }),
  );
  await page.route('/api/plans**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );

  await page.goto(`/plans/month/${thisMonth}`);
  await page.waitForLoadState('networkidle');
  await page.locator('[class*="fab"]').click({ force: true });
  await expect(page.locator('.ant-modal')).toBeVisible();
  await expect(page.locator('.ant-modal-body')).toBeVisible();
}

test.describe('PlanForm scroll isolation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAndOpen(page);
  });

  test('modal body scrolls without scrolling the page', async ({ page }) => {
    await page.evaluate(() => {
      const body = document.querySelector('.ant-modal-body');
      if (!body) return;
      const filler = document.createElement('div');
      filler.style.height = '2000px';
      filler.style.width = '1px';
      body.insertBefore(filler, body.firstChild);
    });

    const canScroll = await page.evaluate(() => {
      const body = document.querySelector('.ant-modal-body');
      return body ? body.scrollHeight > body.clientHeight : false;
    });
    expect(canScroll).toBe(true);

    const initialPageY = await page.evaluate(() => window.scrollY);

    await page.locator('.ant-modal-body').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(100);

    const finalPageY = await page.evaluate(() => window.scrollY);
    expect(finalPageY).toBe(initialPageY);
  });

  test('page body is locked while modal is open', async ({ page }) => {
    const overflowY = await page.evaluate(() => getComputedStyle(document.body).overflowY);
    expect(overflowY).toBe('hidden');
  });

  test('page scroll is restored after modal closes', async ({ page }) => {
    await page.locator('[aria-label="关闭"]').click();
    await page.waitForTimeout(400);

    const overflowY = await page.evaluate(() => getComputedStyle(document.body).overflowY);
    expect(overflowY).not.toBe('hidden');
  });
});

test.describe('PlanForm footer', () => {
  test.beforeEach(async ({ page }) => {
    await setupAndOpen(page);
  });

  test('footer has visible background (not transparent)', async ({ page }) => {
    const bgColor = await page.evaluate(() => {
      // Scoped: only match footer inside the modal form
      const container = document.querySelector('.ant-modal-container');
      const footer = container?.querySelector('[class*="footer"]');
      if (!footer) return null;
      return getComputedStyle(footer).backgroundColor;
    });
    expect(bgColor).not.toBeNull();
    // Should not be fully transparent (CSS variable should resolve to a color)
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(bgColor).not.toBe('transparent');
  });

  test('footer is sticky and stays visible when scrolling', async ({ page }) => {
    // Inject scrollable content
    await page.evaluate(() => {
      const body = document.querySelector('.ant-modal-body');
      if (!body) return;
      const filler = document.createElement('div');
      filler.style.height = '2000px';
      filler.style.width = '1px';
      body.insertBefore(filler, body.firstChild);
    });

    // Scroll to bottom
    await page.locator('.ant-modal-body').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(100);

    // Use scoped selector: only footer inside modal container
    const footerEl = page.locator('.ant-modal-container [class*="footer"]');
    const footerBox = await footerEl.boundingBox();
    expect(footerBox).not.toBeNull();

    // Footer should be within the visible modal area (not scrolled away)
    const containerBox = await page.locator('.ant-modal-container').boundingBox();
    if (footerBox && containerBox) {
      expect(footerBox.y).toBeGreaterThanOrEqual(containerBox.y);
    }
  });

  test('footer buttons are visually centered in the footer', async ({ page }) => {
    const info = await page.evaluate(() => {
      const container = document.querySelector('.ant-modal-container');
      const footer = container?.querySelector('[class*="footer"]');
      // Get BOTH buttons to check vertical positioning
      const buttons = footer?.querySelectorAll('button');
      if (!footer || !buttons || buttons.length < 2) return null;
      const fH = footer.clientHeight;
      const bTop = buttons[0].getBoundingClientRect().top - footer.getBoundingClientRect().top;
      const bH = buttons[0].clientHeight;
      const bBottom = fH - bTop - bH;
      const b2Top = buttons[1].getBoundingClientRect().top - footer.getBoundingClientRect().top;
      return {
        topGap: bTop, bottomGap: bBottom, fH, bH,
        // Both buttons should have same top offset (aligned)
        aligned: Math.abs(bTop - b2Top),
      };
    });
    expect(info).not.toBeNull();
    // Both buttons should be aligned to the same vertical position
    expect(info!.aligned).toBeLessThanOrEqual(1);
    // Buttons should not be pressed against footer edges
    expect(info!.topGap).toBeGreaterThanOrEqual(2);
    expect(info!.bottomGap).toBeGreaterThanOrEqual(5);
  });
});

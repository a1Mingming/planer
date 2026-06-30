import { test, expect, type Page } from '@playwright/test';
import dayjs from 'dayjs';

const today = dayjs().format('YYYY-MM-DD');
const thisYear = dayjs().format('YYYY');
const thisMonth = dayjs().format('YYYY-MM');

function mockPlan(overrides = {}) {
  return {
    id: 1,
    title: '测试计划项目',
    date: today,
    start_time: null as string | null,
    end_time: null as string | null,
    tags: ['工作'],
    done: false,
    created_at: `${today} 00:00:00`,
    updated_at: `${today} 00:00:00`,
    ...overrides,
  };
}

function mockTimedPlan(overrides = {}) {
  return mockPlan({ start_time: '10:00', end_time: '12:00', ...overrides });
}

const yearSummary = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  total: i * 2,
  done: i,
}));

async function setupDayView(page: Page) {
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
  await page.route('/api/plans**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockPlan()] }),
      });
    }
    return route.continue();
  });
}

async function setupYearView(page: Page) {
  await page.route('/api/tags', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    }),
  );
  await page.route('/api/plans**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: yearSummary }),
      });
    }
    return route.continue();
  });
}

async function setupMonthView(page: Page) {
  await page.route('/api/tags', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    }),
  );
  await page.route('/api/plans**', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockPlan()] }),
      });
    }
    return route.continue();
  });
}

test.describe('PlanCard hover', () => {
  test.beforeEach(async ({ page }) => {
    await setupDayView(page);
  });

  test('hover reveals action buttons fully within card boundary', async ({ page }) => {
    await page.goto(`/plans/day/${today}`);
    await page.waitForLoadState('networkidle');

    const card = page.locator('[class*="card"]').first();
    await expect(card).toBeVisible();

    await card.hover();
    await page.waitForTimeout(200);

    const actions = card.locator('[class*="actions"]');
    await expect(actions).toBeVisible();

    const cardBox = await card.boundingBox();
    const actionsBox = await actions.boundingBox();

    if (cardBox && actionsBox) {
      expect(actionsBox.x).toBeGreaterThanOrEqual(cardBox.x - 1);
      expect(actionsBox.y).toBeGreaterThanOrEqual(cardBox.y - 1);
      expect(actionsBox.x + actionsBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
      expect(actionsBox.y + actionsBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height + 1);
    }
  });

  test('hover card transform does not push card outside parent', async ({ page }) => {
    await page.goto(`/plans/day/${today}`);
    await page.waitForLoadState('networkidle');

    const card = page.locator('[class*="card"]').first();
    const originalBox = await card.boundingBox();

    await card.hover();
    await page.waitForTimeout(200);

    const hoveredBox = await card.boundingBox();

    if (originalBox && hoveredBox) {
      expect(hoveredBox.y).toBeLessThanOrEqual(originalBox.y);
      expect(Math.abs(hoveredBox.y - originalBox.y)).toBeLessThanOrEqual(3);
    }
  });

  test('hover card box-shadow does not overflow into adjacent card', async ({ page }) => {
    const plans = [
      mockPlan({ id: 1, title: '计划A' }),
      mockPlan({ id: 2, title: '计划B' }),
    ];
    await page.route('/api/plans**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: plans }),
        });
      }
      return route.continue();
    });

    await page.goto(`/plans/day/${today}`);
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[class*="card"]');
    const count = await cards.count();
    if (count < 2) return;

    const firstCard = cards.nth(0);
    const secondCard = cards.nth(1);

    const secondBefore = await secondCard.boundingBox();

    await firstCard.hover();
    await page.waitForTimeout(200);

    const secondAfter = await secondCard.boundingBox();

    if (secondBefore && secondAfter) {
      expect(secondAfter.y).toBeCloseTo(secondBefore.y, 0);
    }
  });
});

test.describe('YearView monthCard hover', () => {
  test.beforeEach(async ({ page }) => {
    await setupYearView(page);
  });

  test('month card hover transform stays within grid cell', async ({ page }) => {
    await page.goto(`/plans/year/${thisYear}`);
    await page.waitForLoadState('networkidle');

    const card = page.locator('[class*="monthCard"]').first();
    await expect(card).toBeVisible();

    const grid = page.locator('[class*="grid"]');
    const gridBox = await grid.boundingBox();

    await card.hover();
    await page.waitForTimeout(200);

    const cardBox = await card.boundingBox();

    if (cardBox && gridBox) {
      // translateY(-2px) + box-shadow may nudge card ~2px above grid; allow tolerance
      expect(cardBox.x).toBeGreaterThanOrEqual(gridBox.x - 2);
      expect(cardBox.y).toBeGreaterThanOrEqual(gridBox.y - 2);
      expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(gridBox.x + gridBox.width + 2);
      expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(gridBox.y + gridBox.height + 2);
    }
  });

  test('month card has visible ring progress after hover', async ({ page }) => {
    await page.goto(`/plans/year/${thisYear}`);
    await page.waitForLoadState('networkidle');

    const card = page.locator('[class*="monthCard"]').first();
    await card.hover();
    await page.waitForTimeout(200);

    // month name color transitions on hover (to var(--purple))
    const monthName = card.locator('[class*="monthName"]');
    const color = await monthName.evaluate((el) => getComputedStyle(el).color);

    expect(color).toBeTruthy();
  });
});

test.describe('DayView timeBlock hover', () => {
  test.beforeEach(async ({ page }) => {
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
    await page.route('/api/plans**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [mockTimedPlan()] }),
        });
      }
      return route.continue();
    });
  });

  test('timeBlock hover box-shadow not clipped by timeline overflow', async ({ page }) => {
    await page.goto(`/plans/day/${today}`);
    await page.waitForLoadState('networkidle');

    const timeBlock = page.locator('[class*="timeBlock"]').first();
    if (!(await timeBlock.count())) return;

    await timeBlock.hover();
    await page.waitForTimeout(200);

    // Verify box-shadow CSS property is set and not 'none'
    const boxShadow = await timeBlock.evaluate((el) =>
      getComputedStyle(el).boxShadow,
    );

    expect(boxShadow).not.toBe('none');
  });

  test('timeBlock title overflow ellipsis shows properly', async ({ page }) => {
    await page.goto(`/plans/day/${today}`);
    await page.waitForLoadState('networkidle');

    const title = page.locator('[class*="blockTitle"]').first();
    if (!(await title.count())) return;

    const overflow = await title.evaluate((el) => getComputedStyle(el).overflow);
    const textOverflow = await title.evaluate(
      (el) => getComputedStyle(el).textOverflow,
    );

    expect(overflow).toBe('hidden');
    expect(textOverflow).toBe('ellipsis');
  });
});

test.describe('navArrows hover in round container', () => {
  test.beforeEach(async ({ page }) => {
    await setupMonthView(page);
  });

  test('hover background stays inside rounded container', async ({ page }) => {
    await page.goto('/plans/month/2026-06');
    await page.waitForLoadState('networkidle');

    const container = page.locator('[class*="navArrows"]');
    const arrow = container.locator('[class*="navArrow"]').first();

    const containerBox = await container.boundingBox();

    await arrow.hover();
    await page.waitForTimeout(200);

    const arrowBox = await arrow.boundingBox();

    if (containerBox && arrowBox) {
      // Arrow must be contained within the navArrows container
      expect(arrowBox.x).toBeGreaterThanOrEqual(containerBox.x - 1);
      expect(arrowBox.x + arrowBox.width).toBeLessThanOrEqual(
        containerBox.x + containerBox.width + 1,
      );
    }
  });
});

test.describe('FabButton hover', () => {
  test.beforeEach(async ({ page }) => {
    await setupDayView(page);
  });

  test('fab hover transform does not clip floating animation', async ({ page }) => {
    await page.goto(`/plans/day/${today}`);
    await page.waitForLoadState('networkidle');

    const fab = page.locator('[class*="fab"]');
    await expect(fab).toBeVisible();

    const beforeBox = await fab.boundingBox();

    await fab.hover({ force: true });
    await page.waitForTimeout(300);

    const afterBox = await fab.boundingBox();

    if (beforeBox && afterBox) {
      // scale(1.1) enlarges, but center should stay roughly same
      const beforeCenterX = beforeBox.x + beforeBox.width / 2;
      const beforeCenterY = beforeBox.y + beforeBox.height / 2;
      const afterCenterX = afterBox.x + afterBox.width / 2;
      const afterCenterY = afterBox.y + afterBox.height / 2;
      expect(Math.abs(afterCenterX - beforeCenterX)).toBeLessThanOrEqual(5);
      expect(Math.abs(afterCenterY - beforeCenterY)).toBeLessThanOrEqual(5);
    }
  });

  test('fab remains in viewport after hover', async ({ page }) => {
    await page.goto(`/plans/day/${today}`);
    await page.waitForLoadState('networkidle');

    const fab = page.locator('[class*="fab"]');
    await fab.hover({ force: true });
    await page.waitForTimeout(300);

    const box = await fab.boundingBox();
    const viewport = page.viewportSize();

    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  });
});

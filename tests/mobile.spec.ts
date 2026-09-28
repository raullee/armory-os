import { test, expect } from '@playwright/test';
import { canvasCoverage, enter, watchConsole } from './helpers';

test.describe('mobile', () => {
  test('phone layout: no horizontal scroll, rail toggle, touch orbit, deck reachable', async ({ page }) => {
    const log = watchConsole(page);
    await enter(page, 'm4a1');
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerW = await page.evaluate(() => window.innerWidth);
    expect(scrollW).toBeLessThanOrEqual(innerW + 1);
    await expect(page.locator('.rail-toggle')).toBeVisible();
    await page.locator('.rail-toggle').click();
    await expect(page.locator('.rail')).toHaveClass(/is-open/);
    await page.locator('.rail-close').click();
    const box = (await page.locator('.viewer-canvas').boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    expect(await canvasCoverage(page)).toBeGreaterThan(0.01);
    await expect(page.locator('.deck')).toBeVisible();
    await page.locator('.deck .btn', { hasText: 'Field strip' }).click();
    await page.waitForTimeout(2200);
    await expect(page.locator('.strip-title')).toHaveText(/^5 /);
    expect(log.errors).toEqual([]);
  });
});

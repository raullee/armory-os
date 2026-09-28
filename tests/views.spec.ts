import { test, expect } from '@playwright/test';
import { enter, watchConsole } from './helpers';

test.describe('other views', () => {
  test('collection lists every object and opens the exhibition', async ({ page }) => {
    const log = watchConsole(page);
    await enter(page, 'm4a1');
    await page.locator('.tab[data-view="collection"]').click();
    await expect(page.locator('.card')).toHaveCount(24);
    await page.locator('.chip', { hasText: 'Pistols' }).click();
    await expect(page.locator('.card').first()).toContainText(/Glock|M1911|Desert Eagle/);
    await page.locator('.card').first().locator('.btn', { hasText: 'Open in exhibition' }).click();
    await expect(page.locator('#view-exhibition')).toBeVisible();
    expect(log.errors).toEqual([]);
  });

  test('comparator renders two objects, links rotation, true scale and dimensions', async ({ page }) => {
    const log = watchConsole(page);
    await enter(page, 'm4a1');
    await page.locator('.tab[data-view="compare"]').click();
    await expect(page.locator('.compare-viewport')).toHaveCount(2);
    await page.waitForTimeout(2500);
    await expect(page.locator('.compare-viewport .t-model').nth(0)).not.toHaveText('');
    await expect(page.locator('.compare-viewport .t-model').nth(1)).not.toHaveText('');
    await page.locator('.compare-tools .btn', { hasText: 'True 1:1' }).click();
    await page.locator('.compare-tools .btn', { hasText: 'Dimensions' }).click();
    await page.locator('.compare-tools .btn', { hasText: 'Linked' }).click();
    await page.locator('.compare-tools .btn', { hasText: 'Top' }).click();
    await page.waitForTimeout(1200);
    await expect(page.locator('.compare-bars .bar-row')).toHaveCount(6);
    await expect(page.locator('.compare-silhouette canvas')).toBeVisible();
    // change B
    await page.locator('.compare-select select').nth(1).selectOption('glock19');
    await page.waitForTimeout(2500);
    await expect(page.locator('.compare-viewport .t-model').nth(1)).toHaveText(/Glock/);
    expect(log.errors).toEqual([]);
  });

  test('plates open a lightbox', async ({ page }) => {
    await enter(page, 'm4a1');
    await page.locator('.tab[data-view="posters"]').click();
    await expect(page.locator('.poster')).toHaveCount(8);
    await page.locator('.poster img').first().click();
    await expect(page.locator('.lightbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.lightbox')).toBeHidden();
  });

  test('identify quiz runs to completion', async ({ page }) => {
    await enter(page, 'm4a1');
    await page.locator('.tab[data-view="identify"]').click();
    for (let i = 0; i < 8; i++) {
      await page.locator('.q-opt').first().click();
      await page.locator('.q-fb .btn', { hasText: 'Next' }).click();
    }
    await expect(page.locator('.quiz')).toContainText('Complete');
  });

  test('hash routing opens a specific object', async ({ page }) => {
    const log = watchConsole(page);
    await enter(page, 'glock19');
    await expect(page.locator('.hud-identity .t-model')).toHaveText(/Glock/);
    expect(log.errors).toEqual([]);
  });
});

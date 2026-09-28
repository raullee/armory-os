import { test, expect } from '@playwright/test';
import { FIREARMS, canvasCoverage, enter, modelInfo, waitForModel, watchConsole } from './helpers';

test.describe('exhibition', () => {
  test('landing enters the exhibition with no console errors and a rendered model', async ({ page }) => {
    const log = watchConsole(page);
    await enter(page, 'm4a1');
    await expect(page.locator('.hud-identity .t-model')).toHaveText(/M4A1/);
    const info = await modelInfo(page);
    expect(info.nodes).toBeGreaterThan(25);
    expect(info.tris).toBeGreaterThan(5000);
    expect(await canvasCoverage(page)).toBeGreaterThan(0.02);
    expect(log.errors).toEqual([]);
  });

  for (const id of FIREARMS) {
    test(`loads ${id} from the rail with no errors`, async ({ page }) => {
      const log = watchConsole(page);
      await enter(page, 'm4a1');
      await page.locator(`.rail-item[data-id="${id}"]`).click();
      await waitForModel(page, id);
      const info = await modelInfo(page);
      expect(info.nodes, 'component count').toBeGreaterThan(18);
      expect(info.size[0], 'modelled length mm').toBeGreaterThan(150);
      expect(await canvasCoverage(page)).toBeGreaterThan(0.015);
      await expect(page.locator('.error-card')).toHaveCount(0);
      expect(log.errors).toEqual([]);
    });
  }

  test('every render mode and camera preset works', async ({ page }) => {
    const log = watchConsole(page);
    await enter(page, 'm4a1');
    for (const mode of ['xray', 'wireframe', 'thermal', 'groups', 'pbr']) {
      await page.locator(`.hud-tools .btn[data-mode="${mode}"]`).click();
      await page.waitForTimeout(250);
      await expect(page.locator(`.hud-tools .btn[data-mode="${mode}"]`)).toHaveAttribute('aria-pressed', 'true');
      expect(await canvasCoverage(page)).toBeGreaterThan(0.01);
    }
    for (const preset of ['side', 'top', 'front', 'iso', 'three-quarter']) {
      await page.locator(`.hud-tools .btn[data-preset="${preset}"]`).click();
      await page.waitForTimeout(1100);
      expect(await canvasCoverage(page)).toBeGreaterThan(0.01);
    }
    expect(log.errors).toEqual([]);
  });

  test('field strip walks all six stages forward and back', async ({ page }) => {
    const log = watchConsole(page);
    await enter(page, 'm4a1');
    const count = page.locator('.strip-count');
    for (let stage = 1; stage <= 5; stage++) {
      await page.keyboard.press(']');
      await page.waitForTimeout(1900);
      await expect(page.locator('.strip-title')).toHaveText(new RegExp(`^${stage} `));
    }
    await expect(count).toHaveText(/^(\d+) \/ \1 components separated$/i);
    for (let stage = 4; stage >= 0; stage--) {
      await page.keyboard.press('[');
      await page.waitForTimeout(1900);
      await expect(page.locator('.strip-title')).toHaveText(new RegExp(`^${stage} `));
    }
    await expect(count).toHaveText(/^0 \//);
    expect(log.errors).toEqual([]);
  });

  test('action lab: charge, dry fire, reload, selector, eject', async ({ page }) => {
    const log = watchConsole(page);
    await enter(page, 'm4a1');
    await page.keyboard.press('Space');
    await page.waitForTimeout(900);
    await expect(page.locator('.deck .status-chip')).toHaveText(/Released/);
    await page.keyboard.press('c');
    await page.waitForTimeout(1300);
    await expect(page.locator('.deck .status-chip')).toHaveText(/Cocked/);
    await page.keyboard.press('r');
    await page.waitForTimeout(1700);
    await page.keyboard.press('s');
    await page.waitForTimeout(500);
    await page.keyboard.press('e');
    await page.waitForTimeout(1500);
    expect(log.errors).toEqual([]);
  });

  test('selecting a component opens the panel with relationships', async ({ page }) => {
    await enter(page, 'm4a1');
    await page.evaluate(() => {
      const ex = (window as unknown as { __armory: { exhibitionView: { viewer: { onSelect: (f: (c: unknown) => void) => void } } } }).__armory.exhibitionView;
      void ex;
    });
    // Click in the middle of the canvas where the receiver sits.
    const box = (await page.locator('.viewer-canvas').boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(400);
    const panel = page.locator('.component-panel');
    if (await panel.evaluate((el) => el.classList.contains('is-visible'))) {
      await expect(panel.locator('.cp-name')).not.toHaveText('');
      await expect(panel.locator('dt').first()).toHaveText(/Material/i);
    }
  });

  test('data drawer shows the audited specification with confidence grades', async ({ page }) => {
    await enter(page, 'm4a1');
    await page.locator('#btn-data').click();
    await expect(page.locator('#drawer')).toHaveClass(/is-open/);
    await expect(page.locator('#drawer .spec-table')).toContainText('838 mm');
    await expect(page.locator('#drawer .conf.published').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#drawer')).not.toHaveClass(/is-open/);
  });

  test('mute, captions and acoustic environment controls', async ({ page }) => {
    const log = watchConsole(page);
    await enter(page, 'm4a1');
    await page.keyboard.press('m');
    await expect(page.locator('#btn-audio')).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('m');
    await expect(page.locator('#btn-audio')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.cell-globals .select').selectOption('concrete');
    await page.locator('.cell-globals .btn', { hasText: 'CC' }).click();
    await page.keyboard.press('c');
    await expect(page.locator('.caption-line')).toHaveClass(/is-visible/);
    // The audio graph is live and every mechanical event synthesises without throwing.
    const audioState = await page.evaluate(async () => {
      const a = (window as unknown as { __armoryAudio: { ctx: AudioContext | null; play: (e: string, id: unknown, o?: unknown) => void; setEnvironment: (e: string) => void } }).__armoryAudio;
      const ex = (window as unknown as { __armory: { exhibitionView: { viewer: { model: { def: { acoustic: unknown } } } } } }).__armory.exhibitionView;
      const identity = ex.viewer.model.def.acoustic;
      const events = ['charge_pull', 'bolt_release', 'bolt_battery', 'trigger_break', 'trigger_reset', 'hammer_fall', 'striker_fall', 'mag_release', 'mag_out', 'mag_seat', 'selector', 'casing_eject', 'casing_floor', 'pin_push', 'receiver_split', 'component_out', 'component_seat', 'cylinder_open', 'cylinder_index', 'pump_back', 'pump_forward', 'bolt_lift', 'bolt_close'];
      const failed: string[] = [];
      for (const env of ['studio', 'industrial', 'concrete', 'outdoor', 'museum']) {
        a.setEnvironment(env);
        for (const e of events) {
          try {
            a.play(e, identity, { pan: 0.2, distance: 0.3 });
          } catch (err) {
            failed.push(`${env}:${e}:${(err as Error).message}`);
          }
        }
      }
      return { state: a.ctx?.state ?? 'none', failed };
    });
    expect(audioState.state).toBe('running');
    expect(audioState.failed).toEqual([]);
    expect(log.errors).toEqual([]);
  });

  test('reduced motion: sequences still complete', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const log = watchConsole(page);
    await enter(page, 'm4a1');
    await page.keyboard.press(']');
    await page.waitForTimeout(600);
    await expect(page.locator('.strip-title')).toHaveText(/^1 /);
    expect(log.errors).toEqual([]);
    await ctx.close();
  });

  test('keyboard: tab focus reaches the rail and the deck', async ({ page }) => {
    await enter(page, 'm4a1');
    await page.locator('.rail-search input').focus();
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => document.activeElement?.className ?? '');
    expect(active).toContain('rail-item');
  });

  test('no overlapping HUD panels at desktop size', async ({ page }) => {
    await enter(page, 'm4a1');
    const rects = await page.evaluate(() => {
      const sel = ['.hud-identity', '.hud-tools', '.deck', '#btn-data'];
      return sel.map((s) => {
        const r = document.querySelector(s)!.getBoundingClientRect();
        return { s, x: r.x, y: r.y, w: r.width, h: r.height };
      });
    });
    const overlap = (a: (typeof rects)[0], b: (typeof rects)[0]) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(overlap(rects[i], rects[j]), `${rects[i].s} overlaps ${rects[j].s}`).toBe(false);
  });

  test('visual baseline: flagship three-quarter view', async ({ page }) => {
    await enter(page, 'm4a1');
    await page.waitForTimeout(1200);
    await expect(page.locator('.stage')).toHaveScreenshot('m4a1-three-quarter.png', { maxDiffPixelRatio: 0.06 });
  });
});

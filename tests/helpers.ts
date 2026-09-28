import { expect, type Page } from '@playwright/test';

export const FIREARMS = ['m4a1', 'ak47', 'scar17h', 'g3', 'asval', 'steyraug', 'sa80', 'svd', 'm14_ebr', 'aiax338', 'cheytac_m200', 'm82a1', 'm249', 'pkp', 'hkmp5', 'kriss_vector', 'p90', 'mp7', 'benellim4', 'remington870', 'glock19', 'm1911', 'desert_eagle', 'colt_python'];

export interface ConsoleLog {
  errors: string[];
}

/** Collects page errors and console errors; benign environment warnings are ignored. */
export function watchConsole(page: Page): ConsoleLog {
  const log: ConsoleLog = { errors: [] };
  page.on('pageerror', (e) => log.errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/AudioContext was not allowed|GPU stall|swiftshader|WebGL: INVALID|ReadPixels/i.test(t)) return;
    log.errors.push(`console: ${t}`);
  });
  page.on('requestfailed', (r) => {
    if (/fonts\.g(static|oogleapis)/.test(r.url())) return;
    log.errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ''}`);
  });
  return log;
}

export async function enter(page: Page, id = 'm4a1'): Promise<void> {
  await page.goto(`/#/${id}`);
  await page.locator('#landing-enter').click();
  await expect(page.locator('#landing')).toHaveClass(/is-hidden/);
  await waitForModel(page, id);
}

export async function waitForModel(page: Page, id: string): Promise<void> {
  await page.waitForFunction((want) => {
    const ex = (window as unknown as { __armory?: { exhibitionView: { currentId: string | null; viewer: { model: unknown } } } }).__armory?.exhibitionView;
    return !!ex && ex.currentId === want && !!ex.viewer.model;
  }, id, { timeout: 30_000 });
  await page.waitForTimeout(400);
}

export async function modelInfo(page: Page): Promise<{ nodes: number; tris: number; size: number[] }> {
  return page.evaluate(() => {
    const ex = (window as unknown as { __armory: { exhibitionView: { viewer: { model: { nodes: Map<string, unknown>; size: { toArray: () => number[] } } | null; renderer: { info: { render: { triangles: number } } } } } } }).__armory.exhibitionView;
    const m = ex.viewer.model!;
    return { nodes: m.nodes.size, tris: ex.viewer.renderer.info.render.triangles, size: m.size.toArray() };
  });
}

/** Percentage of non-background pixels in the viewer canvas: proves something rendered. */
export async function canvasCoverage(page: Page): Promise<number> {
  return page.evaluate(() => {
    const ex = (window as unknown as { __armory: { exhibitionView: { viewer: { renderer: { domElement: HTMLCanvasElement; render: (s: unknown, c: unknown) => void }; scene: unknown; activeCamera: unknown } } } }).__armory.exhibitionView;
    // Render synchronously so the drawing buffer is intact when it is copied (no preserveDrawingBuffer).
    ex.viewer.renderer.render(ex.viewer.scene, ex.viewer.activeCamera);
    const src = ex.viewer.renderer.domElement;
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 100;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(src, 0, 0, 160, 100);
    const d = ctx.getImageData(0, 0, 160, 100).data;
    let lit = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 60) lit++;
    return lit / (160 * 100);
  });
}

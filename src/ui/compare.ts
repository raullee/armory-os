import * as THREE from 'three';
import { Viewer } from '@/core/Viewer';
import type { FirearmDefinition, CameraPresetId } from '@/firearm/schema';
import type { FirearmModel, RenderMode } from '@/firearm/FirearmModel';
import { CATALOG, loadFirearm } from '@/data/registry';
import { settings } from '@/app/state';
import { audio } from '@/audio/AudioEngine';
import { button, clear, h, setPressed } from './dom';

const A_COLOR = '#e8eaed';
const B_COLOR = '#67e8f9';

interface Side {
  key: 'a' | 'b';
  viewer: Viewer;
  model: FirearmModel | null;
  def: FirearmDefinition | null;
  select: HTMLSelectElement;
  label: HTMLElement;
  tip: HTMLElement;
  silhouette: ImageData | null;
}

/**
 * Comparator 2.0: two synchronised viewports, true 1:1 scale, dimension
 * overlays, a rendered silhouette overlay aligned on the breech face and bore
 * axis, and a published-data comparison. No invented numbers: anything
 * without a sourced value renders as N/A.
 */
export class CompareView {
  private a: Side;
  private b: Side;
  private linked = true;
  private trueScale = false;
  private measure = false;
  private mode: RenderMode = 'pbr';
  private syncing = false;
  private active = false;
  private raf = 0;
  private last = performance.now();
  private silCanvas: HTMLCanvasElement;
  private bars: HTMLElement;
  private linkBtn!: HTMLButtonElement;
  private scaleBtn!: HTMLButtonElement;
  private measureBtn!: HTMLButtonElement;
  private silRenderer: THREE.WebGLRenderer | null = null;
  private modeBtns = new Map<RenderMode, HTMLButtonElement>();

  constructor(root: HTMLElement) {
    const mkSelect = (label: string, cls: string) => {
      const sel = h('select', { class: 'select', 'aria-label': label }) as HTMLSelectElement;
      CATALOG.forEach((e) => sel.appendChild(h('option', { value: e.id }, `${e.name} · ${e.cartridge}`)));
      return h('div', { class: 'compare-select' }, h('span', { class: `t-system ${cls}` }, label), sel);
    };
    const selAWrap = mkSelect('A', 'legend-a');
    const selBWrap = mkSelect('B', 'legend-b');
    const selA = selAWrap.querySelector('select')!;
    const selB = selBWrap.querySelector('select')!;
    selA.value = 'm4a1';
    selB.value = 'ak47';

    const vpA = h('div', { class: 'compare-viewport' });
    const vpB = h('div', { class: 'compare-viewport' });
    const vA = h('div', { class: 'viewer' });
    const vB = h('div', { class: 'viewer' });
    const labA = h('div', { class: 'cv-label' });
    const labB = h('div', { class: 'cv-label' });
    const tipA = h('div', { class: 'cv-tip' });
    const tipB = h('div', { class: 'cv-tip' });
    vpA.append(vA, labA, tipA);
    vpB.append(vB, labB, tipB);

    this.silCanvas = h('canvas', { 'aria-label': 'Silhouette comparison' }) as HTMLCanvasElement;
    this.bars = h('div', { class: 'compare-bars' });

    // tools
    this.linkBtn = button('Linked rotation', { icon: 'link', ariaPressed: true, onClick: () => this.toggleLink() });
    this.scaleBtn = button('True 1:1', { ariaPressed: false, title: 'Both viewports at the same physical scale', onClick: () => this.toggleScale() });
    this.measureBtn = button('Dimensions', { icon: 'ruler', ariaPressed: false, onClick: () => this.toggleMeasure() });
    const swap = button('Swap', { icon: 'compare', onClick: () => { const t = selA.value; selA.value = selB.value; selB.value = t; void this.loadBoth(); } });
    const cams = h('div', { class: 'btn-group' });
    (['side', 'top', 'three-quarter', 'front'] as CameraPresetId[]).forEach((p) => cams.appendChild(button(p === 'three-quarter' ? '3/4' : p[0].toUpperCase() + p.slice(1), { onClick: () => this.goTo(p) })));
    const modes = h('div', { class: 'btn-group' });
    (['pbr', 'xray', 'wireframe', 'groups'] as RenderMode[]).forEach((m) => {
      const b = button(m === 'pbr' ? 'Material' : m === 'xray' ? 'X-ray' : m === 'wireframe' ? 'Wire' : 'Systems', { onClick: () => this.setMode(m) });
      this.modeBtns.set(m, b);
      modes.appendChild(b);
    });
    const tools = h('div', { class: 'compare-tools' }, this.linkBtn, this.scaleBtn, this.measureBtn, cams, modes, swap);

    root.append(
      h('div', { class: 'compare' },
        h('div', { class: 'compare-head' }, selAWrap, selBWrap),
        tools,
        h('div', { class: 'compare-stage' }, vpA, vpB),
        h('div', { class: 'compare-silhouette' }, h('div', { class: 't-system', style: 'margin-bottom:8px' }, 'Side silhouettes, same scale, aligned on the breech face and bore axis'), this.silCanvas),
        this.bars,
      ),
    );

    const q = settings.quality;
    const rm = settings.reducedMotion;
    this.a = { key: 'a', viewer: new Viewer(vA, { quality: q, reducedMotion: rm, compact: true }), model: null, def: null, select: selA, label: labA, tip: tipA, silhouette: null };
    this.b = { key: 'b', viewer: new Viewer(vB, { quality: q, reducedMotion: rm, compact: true }), model: null, def: null, select: selB, label: labB, tip: tipB, silhouette: null };
    [this.a, this.b].forEach((s) => {
      s.select.addEventListener('change', () => void this.loadSide(s));
      s.viewer.onHover((c) => {
        if (c) {
          s.tip.replaceChildren(h('strong', {}, c.def.name), h('span', { style: 'color:var(--muted)' }, ` · ${c.def.function}`));
          s.tip.classList.add('is-visible');
        } else s.tip.classList.remove('is-visible');
      });
      s.viewer.controls.addEventListener('change', () => this.sync(s));
    });
    this.setMode('pbr');
    void this.loadBoth();
    this.loop();
    new ResizeObserver(() => { this.a.viewer.resize(); this.b.viewer.resize(); this.drawSilhouettes(); }).observe(root);
  }

  setActive(on: boolean): void {
    this.active = on;
    this.a.viewer.paused = !on;
    this.b.viewer.paused = !on;
    if (on) {
      this.a.viewer.resize();
      this.b.viewer.resize();
    }
  }

  setSecondary(id: string): void {
    this.b.select.value = id;
    void this.loadSide(this.b);
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.active) return;
    this.a.viewer.update(dt);
    this.b.viewer.update(dt);
  };

  private async loadBoth(): Promise<void> {
    await Promise.all([this.loadSide(this.a), this.loadSide(this.b)]);
  }

  private async loadSide(s: Side): Promise<void> {
    const id = s.select.value;
    try {
      const def = await loadFirearm(id);
      s.def = def;
      s.model = s.viewer.setModel(def);
      s.model.setRenderMode(this.mode);
      s.label.replaceChildren(h('div', { class: 't-system', style: `color:${s.key === 'a' ? A_COLOR : B_COLOR}` }, s.key.toUpperCase()), h('div', { class: 't-model' }, def.name), h('div', { class: 't-config' }, `${def.spec.cartridge} · ${def.spec.actionLabel}`));
      this.applyScale();
      s.viewer.goTo('side', false);
      s.viewer.setMeasurements(this.measure);
      s.silhouette = this.renderSilhouette(s);
      this.drawSilhouettes();
      this.renderBars();
      audio.play('component_seat', def.acoustic, { intensity: 0.4, pan: s.key === 'a' ? -0.5 : 0.5 });
    } catch (err) {
      console.error(err);
      s.label.replaceChildren(h('div', { class: 't-system' }, 'Load error'), h('div', { class: 't-config' }, String((err as Error).message)));
    }
  }

  private applyScale(): void {
    const sa = this.a.model?.size;
    const sb = this.b.model?.size;
    const size = this.trueScale && sa && sb ? new THREE.Vector3(Math.max(sa.x, sb.x), Math.max(sa.y, sb.y), Math.max(sa.z, sb.z)) : null;
    this.a.viewer.setFramingOverride(size);
    this.b.viewer.setFramingOverride(size);
  }

  private sync(from: Side): void {
    if (!this.linked || this.syncing) return;
    const to = from === this.a ? this.b : this.a;
    this.syncing = true;
    const fv = from.viewer;
    const tv = to.viewer;
    const dir = fv.camera.position.clone().sub(fv.controls.target);
    const dist = dir.length();
    dir.normalize();
    const rel = dist / fv.framingDistancePublic();
    const targetDist = rel * tv.framingDistancePublic();
    tv.controls.target.copy(fv.controls.target);
    tv.camera.position.copy(tv.controls.target).addScaledVector(dir, targetDist);
    tv.controls.update();
    this.syncing = false;
  }

  private toggleLink(): void {
    this.linked = !this.linked;
    setPressed(this.linkBtn, this.linked);
    this.linkBtn.replaceChildren(...[button('', { icon: this.linked ? 'link' : 'unlink' }).firstChild!], h('span', {}, this.linked ? 'Linked rotation' : 'Independent'));
    if (this.linked) this.sync(this.a);
    audio.ui('click');
  }

  private toggleScale(): void {
    this.trueScale = !this.trueScale;
    setPressed(this.scaleBtn, this.trueScale);
    this.applyScale();
    this.a.viewer.goTo('side');
    this.b.viewer.goTo('side');
    audio.ui('click');
  }

  private toggleMeasure(): void {
    this.measure = !this.measure;
    setPressed(this.measureBtn, this.measure);
    this.a.viewer.setMeasurements(this.measure);
    this.b.viewer.setMeasurements(this.measure);
    audio.ui('click');
  }

  private goTo(p: CameraPresetId): void {
    this.a.viewer.goTo(p);
    this.b.viewer.goTo(p);
    audio.ui('tick');
  }

  private setMode(m: RenderMode): void {
    this.mode = m;
    this.a.model?.setRenderMode(m);
    this.b.model?.setRenderMode(m);
    this.modeBtns.forEach((b, id) => setPressed(b, id === m));
  }

  // ------------------------------------------------------------ silhouettes

  /** Render the model's side elevation to an offscreen buffer at a fixed mm/px so both sides share a scale. */
  private renderSilhouette(s: Side): ImageData | null {
    if (!s.model) return null;
    const W = 1500, H = 500; // px; 1 px = 1 mm
    if (!this.silRenderer) {
      this.silRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.silRenderer.setPixelRatio(1);
      this.silRenderer.setSize(W, H, false);
      this.silRenderer.setClearColor(0x000000, 0);
    }
    const r = this.silRenderer;
    const scene = new THREE.Scene();
    const override = new THREE.MeshBasicMaterial({ color: 0xffffff });
    scene.overrideMaterial = override;
    // Lightweight proxy meshes sharing geometry, placed with the live world matrices (mm, breech at x=0).
    s.model.group.updateMatrixWorld(true);
    const inv = s.model.group.matrixWorld.clone().invert();
    // Proxies come out in recentred millimetres (the group scale cancels); shift back so the breech sits at x=0.
    const wrap = new THREE.Group();
    wrap.position.set(s.model.centre.x, s.model.centre.y, s.model.centre.z);
    for (const n of s.model.nodes.values()) {
      if (n.def.group === 'ammunition') continue;
      const proxy = new THREE.Mesh(n.mesh.geometry);
      proxy.matrixAutoUpdate = false;
      proxy.matrix.copy(inv).multiply(n.mesh.matrixWorld);
      wrap.add(proxy);
    }
    scene.add(wrap);
    // Frame: x from -1100 to +400 mm relative to the breech (x=0), y from -300 to +200
    const cam = new THREE.OrthographicCamera(-1100, 400, 200, -300, -2000, 2000);
    cam.position.set(0, 0, 1000);
    cam.lookAt(0, 0, 0);
    r.render(scene, cam);
    const gl = r.getContext();
    const px = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const img = new ImageData(W, H);
    // flip vertically
    for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
    override.dispose();
    return img;
  }

  private drawSilhouettes(): void {
    const c = this.silCanvas;
    const wrapW = c.parentElement?.clientWidth ?? 900;
    const W = 1500, H = 500;
    const scale = Math.min(1, (wrapW - 28) / W);
    c.width = Math.floor(W * scale);
    c.height = Math.floor(H * scale);
    c.style.width = `${c.width}px`;
    c.style.height = `${c.height}px`;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    // scale grid: 100 mm ticks
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1500; x += 100) {
      const px = x * scale;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, c.height);
      ctx.stroke();
    }
    // breech line
    ctx.strokeStyle = 'rgba(103,232,249,0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(1100 * scale, 0);
    ctx.lineTo(1100 * scale, c.height);
    ctx.stroke();
    ctx.setLineDash([]);
    const draw = (s: Side, color: [number, number, number], alpha: number) => {
      if (!s.silhouette) return;
      const tmp = document.createElement('canvas');
      tmp.width = W;
      tmp.height = H;
      const tctx = tmp.getContext('2d')!;
      const img = new ImageData(W, H);
      for (let i = 0; i < W * H; i++) {
        const a = s.silhouette.data[i * 4 + 3];
        img.data[i * 4] = color[0];
        img.data[i * 4 + 1] = color[1];
        img.data[i * 4 + 2] = color[2];
        img.data[i * 4 + 3] = a ? Math.round(255 * alpha) : 0;
      }
      tctx.putImageData(img, 0, 0);
      ctx.drawImage(tmp, 0, 0, c.width, c.height);
    };
    ctx.globalCompositeOperation = 'lighter';
    draw(this.a, [232, 234, 237], 0.55);
    draw(this.b, [103, 232, 249], 0.55);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(127,135,144,0.9)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('100 mm grid', 6, c.height - 6);
    ctx.fillText('breech', 1100 * scale + 4, 12);
  }

  // ------------------------------------------------------------ bars

  private renderBars(): void {
    clear(this.bars);
    const a = this.a.def, b = this.b.def;
    if (!a || !b) return;
    const rows: { label: string; unit: string; va: number | null; vb: number | null; ca: string; cb: string; max?: number }[] = [
      { label: 'Overall length', unit: 'mm', va: a.spec.overallLength.value, vb: b.spec.overallLength.value, ca: a.spec.overallLength.confidence, cb: b.spec.overallLength.confidence },
      { label: 'Barrel length', unit: 'mm', va: a.spec.barrelLength.value, vb: b.spec.barrelLength.value, ca: a.spec.barrelLength.confidence, cb: b.spec.barrelLength.confidence },
      { label: 'Mass (unloaded)', unit: 'g', va: a.spec.mass.value, vb: b.spec.mass.value, ca: a.spec.mass.confidence, cb: b.spec.mass.confidence },
      { label: 'Muzzle velocity', unit: 'm/s', va: a.spec.muzzleVelocity.value, vb: b.spec.muzzleVelocity.value, ca: a.spec.muzzleVelocity.confidence, cb: b.spec.muzzleVelocity.confidence },
      { label: 'Effective range', unit: 'm', va: a.spec.effectiveRange.value, vb: b.spec.effectiveRange.value, ca: a.spec.effectiveRange.confidence, cb: b.spec.effectiveRange.confidence },
      { label: 'Modelled components', unit: '', va: a.components.length, vb: b.components.length, ca: 'measured', cb: 'measured' },
    ];
    const left = h('div', { class: 'sheet' }, h('h3', {}, 'Dimensions and performance', h('span', { class: 't-system' }, 'Published values only')));
    rows.forEach((r) => {
      const max = Math.max(r.va ?? 0, r.vb ?? 0) || 1;
      const fmtv = (v: number | null, conf: string) => (v === null ? 'N/A' : `${v.toLocaleString()} ${r.unit}`.trim() + (conf !== 'published' && conf !== 'measured' ? ` (${conf})` : ''));
      left.append(
        h('div', { class: 'bar-row' },
          h('div', { class: 'bar-label' }, h('span', {}, r.label), h('span', {}, h('span', { class: 'legend-a' }, fmtv(r.va, r.ca)), ' · ', h('span', { class: 'legend-b' }, fmtv(r.vb, r.cb)))),
          h('div', { class: 'bar bar-a' }, h('div', { style: `width:${((r.va ?? 0) / max) * 100}%` })),
          h('div', { class: 'bar bar-b', style: 'margin-top:3px' }, h('div', { style: `width:${((r.vb ?? 0) / max) * 100}%` })),
        ),
      );
    });
    const conf = (s: FirearmDefinition) => h('div', { class: 'prose' },
      h('p', {}, h('strong', {}, s.name), ' · ', s.provenance.configuration),
      h('p', {}, `${s.spec.actionLabel}. ${s.spec.feed.replace('-', ' ')}. ${s.spec.capacity.value ?? 'capacity N/A'}.`),
      h('p', {}, s.spec.identification),
    );
    const right = h('div', { class: 'sheet' }, h('h3', {}, 'Configuration', h('span', { class: 't-system' }, 'What is being compared')), conf(a), h('hr', { style: 'border:0;border-top:1px solid var(--line);margin:10px 0' }), conf(b));
    this.bars.append(left, right);
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.a.viewer.dispose();
    this.b.viewer.dispose();
    this.silRenderer?.dispose();
  }
}

import type { AudioCue, CameraPresetId, ComponentGroup, FirearmDefinition, SpecValue } from '@/firearm/schema';
import { Viewer } from '@/core/Viewer';
import { FirearmModel, GROUP_LABELS, type ComponentNode, type RenderMode } from '@/firearm/FirearmModel';
import { Sequencer, Tween } from '@/animation/Sequencer';
import { EASINGS } from '@/animation/easing';
import { audio, haptic } from '@/audio/AudioEngine';
import { CATALOG, CATEGORY_LABELS, loadFirearm } from '@/data/registry';
import { settings } from '@/app/state';
import { PRESET_ORDER, CAMERA_PRESETS } from '@/core/cameraPresets';
import { materialLabel } from '@/materials/profiles';
import { button, clear, h, icon, setPressed, fmt } from './dom';
import { setGeometryQuality } from '@/geometry/builders';

const STAGE_LABELS = ['Battery', 'Magazine', 'Receivers', 'Action', 'Internals', 'Matrix'];

/**
 * Exhibition view: the centrepiece viewer with selector rail, identity block,
 * tools, component panel, action deck, field-strip console and data sheet.
 */
export class ExhibitionView {
  readonly root: HTMLElement;
  readonly viewer: Viewer;
  private model: FirearmModel | null = null;
  private def: FirearmDefinition | null = null;
  private sequencer = new Sequencer();
  private stripTween = new Tween();
  private stripProgress = 0;
  private renderMode: RenderMode = 'pbr';
  private groupFilter: ComponentGroup[] | null = null;
  private cocked = true;
  private lastDetent = -1;
  private autoStrip = false;
  private autoTimer: number | null = null;
  private last = performance.now();
  private raf = 0;
  private active = true;
  private selectedId: string | null = null;
  // DOM
  private stage: HTMLElement;
  private viewerEl: HTMLElement;
  private rail: HTMLElement;
  private railList: HTMLElement;
  private identity: HTMLElement;
  private tools: HTMLElement;
  private panel: HTMLElement;
  private hoverTip: HTMLElement;
  private deck: HTMLElement;
  private captionEl: HTMLElement;
  private veil: HTMLElement;
  private datasheet: HTMLElement;
  private stripSlider!: HTMLInputElement;
  private stripTitle!: HTMLElement;
  private stripDesc!: HTMLElement;
  private stripCount!: HTMLElement;
  private stripStageBtns: HTMLButtonElement[] = [];
  private modeBtns = new Map<RenderMode, HTMLButtonElement>();
  private groupBtns = new Map<string, HTMLButtonElement>();
  private actionBtns: Record<string, HTMLButtonElement> = {};
  private stateChip!: HTMLElement;
  private autoBtn!: HTMLButtonElement;
  private measureBtn!: HTMLButtonElement;
  private boreBtn!: HTMLButtonElement;
  private rotateBtn!: HTMLButtonElement;
  private scaleBtn!: HTMLButtonElement;
  private captionTimer: number | null = null;
  private onChangeListeners: ((id: string) => void)[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
    setGeometryQuality(settings.quality);

    this.stage = h('div', { class: 'stage' });
    this.viewerEl = h('div', { class: 'viewer', id: 'viewer' });
    this.rail = h('aside', { class: 'rail', 'aria-label': 'Collection' });
    this.railList = h('div', { class: 'rail-list', role: 'listbox', 'aria-label': 'Firearms' });
    this.identity = h('div', { class: 'hud-identity' });
    this.tools = h('div', { class: 'hud-tools' });
    this.panel = h('div', { class: 'component-panel', role: 'region', 'aria-label': 'Component detail' });
    this.hoverTip = h('div', { class: 'hover-tip' });
    this.deck = h('div', { class: 'deck' });
    this.captionEl = h('div', { class: 'caption-line', 'aria-live': 'polite' });
    this.veil = h('div', { class: 'loading-veil' }, h('div', { class: 'spinner' }));
    this.datasheet = document.getElementById('drawer-body') ?? h('div', { class: 'datasheet' });
    const dataToggle = button('Data', { class: 'data-toggle', id: 'btn-data', title: 'Technical data and provenance', onClick: () => this.openDrawer() });
    dataToggle.appendChild(h('span', { class: 'plus' }, '+'));

    this.stage.append(this.viewerEl, this.rail, this.identity, this.tools, this.panel, this.hoverTip, this.deck, this.captionEl, this.veil, dataToggle);
    root.append(this.stage);

    this.viewer = new Viewer(this.viewerEl, { quality: settings.quality, reducedMotion: settings.reducedMotion });
    this.buildRail();
    this.buildTools();
    this.buildDeck();
    this.bindViewer();
    this.bindKeys();
    this.bindAudioCaptions();
    window.addEventListener('resize', () => this.syncInset());
    new ResizeObserver(() => this.syncInset()).observe(this.viewerEl);
    // The deck's height drives where the rail, identity block and callouts stop.
    new ResizeObserver(() => this.stage.style.setProperty('--deck-h', `${this.deck.offsetHeight}px`)).observe(this.deck);
    this.stage.style.setProperty('--deck-h', `${this.deck.offsetHeight}px`);
    this.syncInset();
    this.loop();
  }

  /** Keep the viewer's framing aware of how much of the canvas the rail covers. */
  private syncInset(): void {
    const railVisible = getComputedStyle(this.rail).display !== 'none' && !this.rail.classList.contains('is-collapsed') && window.innerWidth > 600;
    this.viewer.setViewportInset(railVisible ? this.rail.offsetWidth : 0);
    this.viewer.resize();
  }

  onChange(fn: (id: string) => void): void {
    this.onChangeListeners.push(fn);
  }

  setActive(on: boolean): void {
    this.active = on;
    this.viewer.paused = !on;
    if (on) this.viewer.resize();
  }

  // ------------------------------------------------------------ loop

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.active) return;
    this.sequencer.update(dt);
    this.stripTween.update(dt);
    this.viewer.update(dt);
  };

  // ------------------------------------------------------------ rail

  private buildRail(): void {
    const search = h('input', { type: 'search', placeholder: 'Search the collection', 'aria-label': 'Search firearms' }) as HTMLInputElement;
    search.addEventListener('input', () => this.renderRail(search.value));
    this.rail.append(
      h('div', { class: 'rail-head' }, h('span', { class: 't-system' }, `Collection · ${CATALOG.length}`), button('', { icon: 'x', class: 'btn-icon btn-sm btn-ghost rail-close', title: 'Close', onClick: () => this.rail.classList.remove('is-open') })),
      h('div', { class: 'rail-search' }, search),
      this.railList,
    );
    this.renderRail('');
    const toggle = button('Collection', { icon: 'grid', class: 'rail-toggle btn-sm', onClick: () => this.rail.classList.toggle('is-open') });
    this.stage.appendChild(toggle);
  }

  private renderRail(query: string): void {
    clear(this.railList);
    const q = query.trim().toLowerCase();
    const groups = new Map<string, typeof CATALOG>();
    CATALOG.filter((e) => !q || `${e.name} ${e.cartridge} ${e.actionLabel} ${e.categoryLabel} ${e.origin}`.toLowerCase().includes(q)).forEach((e) => {
      const g = groups.get(e.category) ?? [];
      g.push(e);
      groups.set(e.category, g);
    });
    groups.forEach((entries, cat) => {
      this.railList.appendChild(h('div', { class: 'rail-cat t-system' }, CATEGORY_LABELS[cat] ?? cat));
      entries.forEach((e) => {
        const num = String(CATALOG.indexOf(e) + 1).padStart(2, '0');
        const item = h('button', { class: `rail-item${e.id === this.def?.id ? ' is-active' : ''}`, role: 'option', 'aria-selected': String(e.id === this.def?.id), 'data-id': e.id, onClick: () => void this.load(e.id) }, h('span', { class: 'rail-num' }, num), h('span', {}, e.name), h('span', { class: 'rail-item-len' }, e.overallLength ? `${e.overallLength} mm` : ''), h('span', { class: 'rail-item-sub' }, `${e.cartridge} · ${e.origin}`));
        this.railList.appendChild(item);
      });
    });
  }

  private markRail(id: string): void {
    this.railList.querySelectorAll<HTMLElement>('.rail-item').forEach((el) => {
      const on = el.dataset.id === id;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', String(on));
    });
  }

  // ------------------------------------------------------------ tools

  private buildTools(): void {
    const modes: [RenderMode, string, string][] = [
      ['pbr', 'Material', 'Physically based materials'],
      ['xray', 'X-ray', 'Internal components through a transparent shell'],
      ['wireframe', 'Wire', 'Edge wireframe'],
      ['thermal', 'Thermal', 'Illustrative heat distribution (not measured)'],
      ['groups', 'Systems', 'Colour by subsystem'],
    ];
    const modeGroup = h('div', { class: 'btn-group', role: 'group', 'aria-label': 'Render mode' });
    modes.forEach(([id, label, title]) => {
      const b = button(label, { title, onClick: () => this.setRenderMode(id) });
      b.dataset.mode = id;
      this.modeBtns.set(id, b);
      modeGroup.appendChild(b);
    });
    const camGroup = h('div', { class: 'btn-group', role: 'group', 'aria-label': 'Camera view' });
    PRESET_ORDER.forEach((id) => {
      const b = button(CAMERA_PRESETS[id].label, { title: `${CAMERA_PRESETS[id].label} view`, onClick: () => this.goTo(id) });
      b.dataset.preset = id;
      camGroup.appendChild(b);
    });
    this.rotateBtn = button('', { icon: 'rotate', class: 'btn-icon', title: 'Auto-rotate', ariaPressed: false, onClick: () => this.toggleRotate() });
    this.measureBtn = button('', { icon: 'ruler', class: 'btn-icon', title: 'Dimensions', ariaPressed: false, onClick: () => this.toggleMeasure() });
    this.boreBtn = button('', { icon: 'target', class: 'btn-icon', title: 'Bore line', ariaPressed: false, onClick: () => this.toggleBore() });
    this.scaleBtn = button('1:1', { title: 'True scale (approximate, assumes a 96 dpi display)', ariaPressed: false, onClick: () => this.toggleScale() });
    const resetBtn = button('', { icon: 'reset', class: 'btn-icon', title: 'Reset view', onClick: () => this.goTo('three-quarter') });
    this.tools.append(h('div', { class: 'tool-row' }, modeGroup), h('div', { class: 'tool-row' }, camGroup, this.rotateBtn, this.measureBtn, this.boreBtn, this.scaleBtn, resetBtn));
    this.updateModeButtons();
  }

  private updateModeButtons(): void {
    this.modeBtns.forEach((b, id) => setPressed(b, id === this.renderMode));
  }

  // ------------------------------------------------------------ deck

  private buildDeck(): void {
    // Action lab
    const actions = h('div', { class: 'deck-actions' });
    const mk = (key: string, label: string, kbd: string, onClick: () => void, cls = '') => {
      const b = button(label, { kbd, onClick, class: cls });
      this.actionBtns[key] = b;
      actions.appendChild(b);
      return b;
    };
    mk('cycle', 'Charge', 'C', () => void this.cycle());
    mk('dryFire', 'Dry fire', 'Space', () => void this.dryFire());
    mk('reload', 'Magazine', 'R', () => void this.reload());
    mk('safety', 'Selector', 'S', () => void this.safety());
    mk('eject', 'Eject case', 'E', () => this.eject());
    this.stateChip = h('span', { class: 'status-chip is-ok' }, 'Cocked');
    const groupRow = h('div', { class: 'deck-actions', style: 'margin-top:8px' });
    const groupBtnGroup = h('div', { class: 'btn-group', role: 'group', 'aria-label': 'Subsystem filter' });
    const groups: [string, string][] = [['all', 'All'], ['action', 'Action'], ['fire-control', 'Fire control'], ['barrel', 'Barrel'], ['feed', 'Feed'], ['furniture', 'Furniture']];
    groups.forEach(([id, label]) => {
      const b = button(label, { class: 'btn-sm', onClick: () => this.setGroupFilter(id === 'all' ? null : (id as ComponentGroup)) });
      this.groupBtns.set(id, b);
      groupBtnGroup.appendChild(b);
    });
    groupRow.append(h('span', { class: 't-system' }, 'Isolate'), groupBtnGroup);
    setPressed(this.groupBtns.get('all')!, true);
    const lab = h('div', { class: 'deck-card' }, h('div', { class: 'deck-title' }, h('span', { class: 't-system' }, 'Action'), this.stateChip), actions, groupRow);

    // Field strip
    this.stripSlider = h('input', { type: 'range', min: 0, max: 500, value: 0, step: 1, class: 'range', 'aria-label': 'Field strip progress', 'aria-valuetext': 'In battery' }) as HTMLInputElement;
    this.stripSlider.addEventListener('input', () => {
      this.stopAuto();
      this.stripTween.stop();
      this.setStrip(Number(this.stripSlider.value) / 100, false);
    });
    this.stripSlider.addEventListener('change', () => this.onStageSettled());
    const stages = h('div', { class: 'strip-stages' });
    STAGE_LABELS.forEach((label, i) => {
      const b = h('button', { class: 'strip-stage', type: 'button', title: label, onClick: () => this.goToStage(i) }, String(i), h('span', { class: 'stage-name' }, label)) as HTMLButtonElement;
      this.stripStageBtns.push(b);
      stages.appendChild(b);
    });
    const prev = button('', { icon: 'chevronLeft', class: 'btn-icon', title: 'Previous stage [', onClick: () => this.step(-1) });
    const next = button('', { icon: 'chevronRight', class: 'btn-icon', title: 'Next stage ]', onClick: () => this.step(1) });
    this.autoBtn = button('Play', { icon: 'play', title: 'Play the full sequence', onClick: () => this.toggleAuto() });
    const master = button('Field strip', { kbd: 'F', onClick: () => this.toggleStrip() });
    this.stripTitle = h('div', { class: 'strip-title' }, 'In battery');
    this.stripDesc = h('div', { class: 'strip-desc' }, '');
    this.stripCount = h('div', { class: 't-status strip-count' }, '');
    const strip = h(
      'div',
      { class: 'deck-card' },
      h('div', { class: 'strip-row' }, h('div', { class: 'strip-nav' }, master, prev, next, this.autoBtn), h('div', { class: 'strip-track' }, this.stripSlider, stages), h('div', { class: 'strip-meta' }, this.stripTitle, this.stripDesc, this.stripCount)),
    );
    this.deck.append(lab, strip);
  }

  // ------------------------------------------------------------ viewer binding

  private bindViewer(): void {
    this.viewer.onHover((c, screen) => {
      if (c && !this.viewer.isTrueScale) {
        this.hoverTip.replaceChildren(h('span', {}, c.def.name), h('span', { class: 'hover-tip-group' }, GROUP_LABELS[c.def.group]));
        this.hoverTip.style.left = `${screen.x}px`;
        this.hoverTip.style.top = `${screen.y}px`;
        this.hoverTip.classList.add('is-visible');
        audio.ui('tick');
      } else {
        this.hoverTip.classList.remove('is-visible');
      }
    });
    this.viewer.onSelect((c) => this.select(c?.def.id ?? null));
    this.viewer.onCasingFloor = (bounce, pan) => {
      if (!this.def) return;
      audio.play('casing_floor', this.def.acoustic, { pan, intensity: 0.9 / bounce, distance: this.viewer.distanceFactor() });
      if (bounce === 1) haptic(4);
    };
    this.viewerEl.addEventListener('pointermove', (e) => {
      const r = this.viewerEl.getBoundingClientRect();
      this.hoverTip.style.left = `${e.clientX - r.left}px`;
      this.hoverTip.style.top = `${e.clientY - r.top}px`;
    });
  }

  private bindKeys(): void {
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      const t = e.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName) || t.isContentEditable) return;
      const k = e.key.toLowerCase();
      const map: Record<string, () => void> = {
        c: () => void this.cycle(),
        ' ': () => void this.dryFire(),
        r: () => void this.reload(),
        s: () => void this.safety(),
        e: () => this.eject(),
        f: () => this.toggleStrip(),
        x: () => this.toggleStrip(),
        '[': () => this.step(-1),
        ']': () => this.step(1),
        arrowleft: () => this.step(-1),
        arrowright: () => this.step(1),
        '1': () => this.goTo('three-quarter'),
        '2': () => this.goTo('side'),
        '3': () => this.goTo('top'),
        '4': () => this.goTo('front'),
        '5': () => this.goTo('iso'),
        v: () => this.cycleRenderMode(),
        d: () => this.toggleMeasure(),
        escape: () => this.select(null),
      };
      const fn = map[k];
      if (fn) {
        e.preventDefault();
        fn();
      }
    });
  }

  private bindAudioCaptions(): void {
    audio.onCaption((text) => {
      this.captionEl.textContent = text;
      this.captionEl.classList.add('is-visible');
      if (this.captionTimer) clearTimeout(this.captionTimer);
      this.captionTimer = window.setTimeout(() => this.captionEl.classList.remove('is-visible'), 1800);
    });
  }

  // ------------------------------------------------------------ loading

  async load(id: string): Promise<void> {
    if (this.def?.id === id) return;
    this.veil.hidden = false;
    this.veil.style.opacity = '1';
    this.sequencer.stop();
    this.stopAuto();
    try {
      const def = await loadFirearm(id);
      this.def = def;
      settings.set({ lastFirearm: id });
      this.model = this.viewer.setModel(def);
      this.stripProgress = 0;
      this.stripSlider.value = '0';
      this.cocked = true;
      this.selectedId = null;
      this.model.setRenderMode(this.renderMode);
      this.model.setGroupFilter(this.groupFilter);
      this.model.setStripProgress(0);
      this.viewer.setMeasurements(this.measureBtn.getAttribute('aria-pressed') === 'true');
      this.viewer.setBoreLine(this.boreBtn.getAttribute('aria-pressed') === 'true');
      this.viewer.goTo('three-quarter', false);
      this.renderIdentity();
      this.renderDatasheet();
      this.updateStripUI();
      this.updateActionButtons();
      this.renderPanel(null);
      this.markRail(id);
      audio.play('component_seat', def.acoustic, { intensity: 0.5 });
      this.onChangeListeners.forEach((f) => f(id));
      const stageErr = this.stage.querySelector('.error-card');
      stageErr?.remove();
    } catch (err) {
      console.error(err);
      const card = h('div', { class: 'error-card' }, h('div', {}, h('div', { class: 't-system' }, 'Load error'), h('p', { class: 'prose' }, `The definition for “${id}” could not be loaded. `, String((err as Error).message ?? err)), button('Retry', { onClick: () => void this.load(id) })));
      this.stage.appendChild(card);
    } finally {
      this.veil.style.opacity = '0';
      window.setTimeout(() => (this.veil.hidden = true), 300);
    }
  }

  get currentId(): string | null {
    return this.def?.id ?? null;
  }

  // ------------------------------------------------------------ identity + datasheet

  private renderIdentity(): void {
    const d = this.def!;
    const geomChip = h('span', { class: `status-chip ${d.provenance.geometryConfidence === 'published' ? 'is-ok' : 'is-warn'}` }, `Geometry · ${d.provenance.geometryConfidence}`);
    const specChip = h('span', { class: `status-chip ${d.provenance.specConfidence === 'published' ? 'is-ok' : 'is-warn'}` }, `Data · ${d.provenance.specConfidence}`);
    this.identity.replaceChildren(
      h('div', { class: 't-system' }, `${d.spec.categoryLabel} · ${d.spec.cartridge}`),
      h('div', { class: 't-model' }, d.name),
      h('div', { class: 't-config' }, d.provenance.configuration),
      h('div', { class: 'status-row' }, geomChip, specChip, h('span', { class: 'status-chip is-accent', id: 'chip-mode' }, 'Material')),
    );
  }

  private specRow(label: string, v: SpecValue<number | string> | undefined, unit?: string, plain = false): HTMLElement {
    let text = 'N/A';
    let note = v?.note ?? '';
    let conf = v?.confidence ?? 'unverified';
    if (v && v.value !== null && v.value !== undefined) {
      text = typeof v.value === 'number' ? (plain ? String(v.value) : fmt(v.value, v.unit ?? unit ?? '')) : String(v.value);
    } else if (v?.value === null) {
      text = v.note;
      note = '';
    }
    return h('tr', {}, h('th', {}, label), h('td', {}, h('span', { class: `conf ${conf}` }, conf), text, note ? h('span', { class: 'note' }, note) : null));
  }

  private renderDatasheet(): void {
    const d = this.def!;
    const s = d.spec;
    const table = h(
      'table',
      { class: 'spec-table' },
      h('tbody', {},
        h('tr', {}, h('th', {}, 'Manufacturer'), h('td', {}, s.manufacturer)),
        h('tr', {}, h('th', {}, 'Designation'), h('td', {}, s.designation)),
        h('tr', {}, h('th', {}, 'Origin'), h('td', {}, s.origin)),
        this.specRow('Designed', s.designed, undefined, true),
        h('tr', {}, h('th', {}, 'Cartridge'), h('td', {}, s.cartridge)),
        h('tr', {}, h('th', {}, 'Action'), h('td', {}, s.actionLabel)),
        this.specRow('Capacity', s.capacity),
        this.specRow('Overall length', s.overallLength, 'mm'),
        s.overallLengthCollapsed ? this.specRow('Length, collapsed', s.overallLengthCollapsed, 'mm') : null,
        this.specRow('Barrel length', s.barrelLength, 'mm'),
        this.specRow('Mass', s.mass, 'g'),
        this.specRow('Muzzle velocity', s.muzzleVelocity, 'm/s'),
        this.specRow('Rate of fire', s.rateOfFire),
        this.specRow('Effective range', s.effectiveRange, 'm'),
        s.twist ? this.specRow('Rifling', s.twist) : null,
        h('tr', {}, h('th', {}, 'Sights'), h('td', {}, s.sights)),
      ),
    );
    const legend = h('div', { class: 'legend' },
      h('span', {}, h('span', { class: 'conf published' }, 'published'), h('span', { class: 'desc' }, 'manufacturer or military manual')),
      h('span', {}, h('span', { class: 'conf measured' }, 'measured'), h('span', { class: 'desc' }, 'physically measured example')),
      h('span', {}, h('span', { class: 'conf estimated' }, 'estimated'), h('span', { class: 'desc' }, 'derived; treat as approximate')),
      h('span', {}, h('span', { class: 'conf unverified' }, 'unverified'), h('span', { class: 'desc' }, 'no reliable source found')),
    );
    const specSheet = h('div', { class: 'sheet' }, h('h3', {}, 'Technical specification', h('span', { class: 't-system' }, 'Factual layer')), table, legend);

    const prov = d.provenance;
    const provSheet = h('div', { class: 'sheet' },
      h('h3', {}, 'Authenticity', h('span', { class: 't-system' }, `Model v${prov.version}`)),
      h('div', { class: 'prose' },
        h('p', {}, h('strong', {}, 'Configuration. '), prov.configuration),
        h('p', {}, h('strong', {}, 'Identification. '), s.identification),
        h('p', {}, h('strong', {}, 'Mechanism. '), s.mechanism),
      ),
      h('div', { class: 'layers' },
        h('div', { class: 'layer' }, h('div', { class: 't-system' }, 'Specification'), h('p', {}, `Confidence: ${prov.specConfidence}. Values above carry their own source grade.`)),
        h('div', { class: 'layer' }, h('div', { class: 't-system' }, 'Visualisation'), h('p', {}, `${prov.modelOrigin === 'parametric' ? 'Parametric model built from published dimensions' : 'Authored mesh'}; geometry confidence ${prov.geometryConfidence}. ${d.components.length} addressable components.`)),
        h('div', { class: 'layer' }, h('div', { class: 't-system' }, 'Procedural'), h('p', {}, 'Thermal view, audio and ejection are synthesised effects. They illustrate behaviour; they are not measurements.')),
      ),
      h('h3', { style: 'margin-top:16px' }, 'Sources'),
      h('ul', { class: 'source-list' }, ...prov.sources.map((src) => h('li', {}, src.ref ? h('a', { href: src.ref, target: '_blank', rel: 'noopener' }, src.label) : src.label, src.covers ? h('div', { class: 'covers' }, src.covers.join(' · ')) : null))),
      prov.notes?.length ? h('div', { class: 'prose', style: 'margin-top:12px' }, ...prov.notes.map((n) => h('p', {}, n))) : null,
    );
    const build = h('div', { class: 'sheet' },
      h('h3', {}, 'Build notes', h('span', { class: 't-system' }, 'How this object is made')),
      h('dl', { class: 'build-notes' },
        h('dt', {}, 'Languages'), h('dd', {}, 'TypeScript / GLSL ES 3.00 / CSS / HTML'),
        h('dt', {}, 'Rendering'), h('dd', {}, 'WebGL 2 via three.js; physically based materials with image-based lighting, shadow-mapped key light, procedural normal and roughness maps, screen-space edge wear'),
        h('dt', {}, 'Geometry'), h('dd', {}, `Parametric: ${d.components.length} components from side-profile extrusions, lathe profiles and merged composites, all in millimetres; independently addressable nodes with rest pose, strip transform and animation transform`),
        h('dt', {}, 'Motion'), h('dd', {}, 'Data-defined sequences with mechanical easings (accelerating impacts, spring returns, detents); travel limits from the definition; no interpolation through other parts'),
        h('dt', {}, 'Audio'), h('dd', {}, 'Web Audio synthesis: multi-mode metal strikes, filtered friction, coil-spring modes and brass bounces, parameterised by mass, receiver material and action type; five synthesised room responses by convolution'),
        h('dt', {}, 'Interface'), h('dd', {}, 'Vanilla DOM, keyboard first, captions for audio events, reduced-motion aware'),
        h('dt', {}, 'Build'), h('dd', {}, 'Vite, code-split per firearm, deployed on Vercel'),
      ),
    );
    this.datasheet.replaceChildren(specSheet, provSheet, build);
  }

  openDrawer(): void {
    const drawer = document.getElementById('drawer');
    const veil = document.getElementById('drawer-veil');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    if (veil) veil.hidden = false;
    audio.ui('click');
    (drawer.querySelector('#drawer-close') as HTMLElement | null)?.focus();
  }

  // ------------------------------------------------------------ component panel

  private select(id: string | null): void {
    if (!this.model) return;
    this.selectedId = id;
    this.model.setSelected(id);
    this.renderPanel(id ? this.model.get(id) ?? null : null);
    if (id) {
      audio.ui('click');
      haptic(6);
    }
  }

  private renderPanel(n: ComponentNode | null): void {
    if (!n) {
      this.panel.classList.remove('is-visible');
      return;
    }
    const d = n.def;
    const adj = h('div', { class: 'cp-adj' });
    (d.adjacent ?? []).forEach((id) => {
      const other = this.model?.get(id);
      if (!other) return;
      adj.appendChild(h('button', { type: 'button', onClick: () => this.select(id), title: `Select ${other.def.name}` }, other.def.name));
    });
    this.panel.replaceChildren(
      h('div', { class: 'cp-head' }, h('div', {}, h('div', { class: 't-system' }, GROUP_LABELS[d.group]), h('div', { class: 'cp-name' }, d.name)), button('', { icon: 'x', class: 'btn-icon btn-sm btn-ghost', title: 'Close', onClick: () => this.select(null) })),
      h('p', { class: 'cp-fn' }, d.function),
      h('dl', {},
        h('dt', {}, 'Material'), h('dd', {}, d.materialLabel ?? materialLabel(d.material)),
        d.mass ? h('dt', {}, 'Mass') : null, d.mass ? h('dd', {}, `${fmt(d.mass, 'g')} (approx.)`) : null,
        d.notes?.length ? h('dt', {}, 'Notes') : null, d.notes?.length ? h('dd', {}, d.notes.join('. ')) : null,
        h('dt', {}, 'Geometry'), h('dd', {}, h('span', { class: `conf ${d.confidence ?? 'estimated'}` }, d.confidence ?? 'estimated')),
        d.strip ? h('dt', {}, 'Removed at') : null, d.strip ? h('dd', {}, `Stage ${d.strip.stage} · ${STAGE_LABELS[d.strip.stage]}`) : null,
        adj.childElementCount ? h('dt', {}, 'Interfaces') : null, adj.childElementCount ? h('dd', {}, adj) : null,
      ),
      h('div', { class: 'cp-actions' }, button('Frame', { class: 'btn-sm', icon: 'eye', onClick: () => this.viewer.focusComponent(d.id) }), button('Isolate', { class: 'btn-sm', onClick: () => this.isolate(d.id) })),
    );
    this.panel.classList.add('is-visible');
  }

  private isolate(id: string): void {
    if (!this.model) return;
    const n = this.model.get(id);
    if (!n) return;
    const ids = [id, ...(n.def.adjacent ?? [])];
    this.model.setFocus(ids);
    this.viewer.setCallouts(ids.slice(0, 6));
    this.viewer.focusComponent(id);
    window.setTimeout(() => {
      this.model?.setFocus(null);
      this.viewer.clearCallouts();
    }, 4500);
  }

  // ------------------------------------------------------------ modes + camera

  setRenderMode(mode: RenderMode): void {
    this.renderMode = mode;
    this.model?.setRenderMode(mode);
    this.updateModeButtons();
    const chip = this.identity.querySelector('#chip-mode');
    if (chip) chip.textContent = mode === 'pbr' ? 'Material' : mode === 'xray' ? 'X-ray' : mode === 'wireframe' ? 'Wireframe' : mode === 'thermal' ? 'Thermal (illustrative)' : 'Subsystems';
    audio.ui('click');
  }

  private cycleRenderMode(): void {
    const order: RenderMode[] = ['pbr', 'xray', 'wireframe', 'thermal', 'groups'];
    this.setRenderMode(order[(order.indexOf(this.renderMode) + 1) % order.length]);
  }

  private setGroupFilter(g: ComponentGroup | null): void {
    this.groupFilter = g ? (g === 'action' ? ['action', 'gas-system'] : g === 'barrel' ? ['barrel', 'muzzle', 'gas-system'] : g === 'furniture' ? ['furniture', 'sights', 'accessory'] : g === 'feed' ? ['feed', 'ammunition'] : [g]) : null;
    this.model?.setGroupFilter(this.groupFilter);
    this.groupBtns.forEach((b, id) => setPressed(b, (g ?? 'all') === id));
    audio.ui('click');
  }

  goTo(preset: CameraPresetId): void {
    if (this.viewer.isTrueScale) this.toggleScale();
    this.viewer.goTo(preset);
    audio.ui('tick');
  }

  private toggleRotate(): void {
    const on = !this.viewer.isAutoRotating;
    this.viewer.setAutoRotate(on);
    setPressed(this.rotateBtn, on);
  }

  private toggleMeasure(): void {
    const on = !this.viewer.hasMeasurements;
    this.viewer.setMeasurements(on);
    setPressed(this.measureBtn, on);
    audio.ui('click');
  }

  private toggleBore(): void {
    const on = !this.viewer.hasBoreLine;
    this.viewer.setBoreLine(on);
    setPressed(this.boreBtn, on);
    audio.ui('click');
  }

  private toggleScale(): void {
    const on = !this.viewer.isTrueScale;
    this.viewer.setTrueScale(on);
    setPressed(this.scaleBtn, on);
    if (on) this.toast('1:1 scale assumes a 96 dpi display. Orbit is locked to the side view.');
  }

  // ------------------------------------------------------------ action lab

  private updateActionButtons(): void {
    const a = this.def?.actions;
    const set = (key: string, seq: { label: string } | undefined) => {
      const b = this.actionBtns[key];
      if (!b) return;
      b.disabled = !seq;
      b.style.display = seq ? '' : 'none';
      if (seq) (b.querySelector('span') as HTMLElement).textContent = seq.label;
    };
    set('cycle', a?.cycle);
    set('dryFire', a?.dryFire);
    set('reload', a?.reload);
    set('safety', a?.safety);
    this.updateStateChip();
  }

  private updateStateChip(): void {
    this.stateChip.className = `status-chip ${this.cocked ? 'is-ok' : 'is-danger'}`;
    this.stateChip.textContent = this.cocked ? 'Cocked' : 'Released';
  }

  private cue(cue: AudioCue): void {
    if (!this.def) return;
    const pan = cue.component ? this.viewer.screenX(cue.component) : 0;
    audio.play(cue.event, this.def.acoustic, { pan, distance: this.viewer.distanceFactor(), intensity: cue.intensity, caption: cue.caption });
    if (cue.event === 'bolt_battery' || cue.event === 'mag_seat' || cue.event === 'hammer_fall' || cue.event === 'striker_fall') haptic([14, 20, 10]);
    else if (cue.event !== 'ui_tick') haptic(6);
  }

  private async runAction(key: keyof NonNullable<FirearmDefinition['actions']>): Promise<void> {
    if (!this.def || !this.model) return;
    const seq = this.def.actions[key];
    if (!seq || Array.isArray(seq)) return;
    if (this.stripProgress > 0.02) {
      this.toast('Assemble the firearm before operating the action.');
      return;
    }
    if (this.sequencer.busy && !seq.interruptible) return;
    await this.sequencer.play(this.model, seq, { onAudio: (c) => this.cue(c) });
  }

  async cycle(): Promise<void> {
    await this.runAction('cycle');
    this.cocked = true;
    this.updateStateChip();
  }

  async dryFire(): Promise<void> {
    if (!this.def) return;
    if (!this.cocked) {
      audio.play('trigger_break', this.def.acoustic, { intensity: 0.35, caption: 'Trigger: not cocked' });
      this.toast('Not cocked. Charge the action first (C).');
      return;
    }
    await this.runAction('dryFire');
    this.cocked = false;
    this.updateStateChip();
  }

  async reload(): Promise<void> {
    await this.runAction('reload');
  }

  async safety(): Promise<void> {
    if (!this.def?.actions.safety || !this.model) return;
    const seq = this.def.actions.safety;
    const node = this.model.get(seq.steps[0]?.component ?? '');
    // toggle: if already rotated, play in reverse by resetting
    if (node && (Math.abs(node.anim.rotate.z) > 0.01 || Math.abs(node.anim.rotate.x) > 0.01 || node.anim.offset.lengthSq() > 0.01)) {
      const back = { ...seq, id: 'safety-back', steps: seq.steps.map((s) => ({ ...s, reset: true })) };
      await this.sequencer.play(this.model, back, { onAudio: (c) => this.cue(c) });
      return;
    }
    await this.runAction('safety');
  }

  eject(): void {
    if (!this.def) return;
    if (this.stripProgress > 0.02) return;
    this.viewer.spawnCasing();
    audio.play('casing_eject', this.def.acoustic, { pan: this.def.ejection ? this.viewer.screenX('upper_receiver') : 0, caption: 'Case ejected' });
  }

  // ------------------------------------------------------------ field strip

  private setStrip(p: number, updateSlider = true): void {
    this.stripProgress = Math.max(0, Math.min(5, p));
    this.model?.setStripProgress(this.stripProgress);
    if (updateSlider) this.stripSlider.value = String(Math.round(this.stripProgress * 100));
    const detent = Math.floor(this.stripProgress * 12);
    if (detent !== this.lastDetent) {
      this.lastDetent = detent;
      audio.ui('detent', this.stripProgress / 5);
      haptic(3);
    }
    this.updateStripUI();
  }

  private updateStripUI(): void {
    if (!this.def || !this.model) return;
    const stage = Math.round(this.stripProgress);
    const data = this.def.fieldStrip[stage] ?? this.def.fieldStrip[0];
    this.stripTitle.textContent = `${stage} · ${data.title}`;
    this.stripDesc.textContent = data.description;
    this.stripCount.textContent = `${this.model.detachedCount} / ${this.model.strippableCount} components separated`;
    this.stripSlider.setAttribute('aria-valuetext', data.title);
    this.stripStageBtns.forEach((b, i) => b.classList.toggle('is-active', i === stage));
  }

  private animateStripTo(target: number, onDone?: () => void): void {
    const from = this.stripProgress;
    const dist = Math.abs(target - from);
    const dur = settings.reducedMotion ? 0.05 : Math.min(1.6, 0.55 + dist * 0.45);
    this.stripTween.start(from, target, dur, EASINGS.inOutCubic, (v) => this.setStrip(v), () => {
      this.onStageSettled();
      onDone?.();
    });
  }

  private onStageSettled(): void {
    if (!this.def || !this.model) return;
    const stage = Math.round(this.stripProgress);
    const data = this.def.fieldStrip[stage];
    if (!data) return;
    this.model.setFocus(data.focus.length ? data.focus : null);
    this.viewer.setCallouts(data.focus.slice(0, 6));
    if (stage === 0) {
      this.model.setFocus(null);
      this.viewer.clearCallouts();
    }
  }

  private goToStage(stage: number): void {
    if (!this.def) return;
    this.stopAuto();
    const target = Math.max(0, Math.min(5, stage));
    const current = Math.round(this.stripProgress);
    if (target === current && Math.abs(this.stripProgress - target) < 0.01) return;
    const data = this.def.fieldStrip[target];
    const reverse = target < this.stripProgress;
    // audio cues for entering the stage
    const cues = reverse ? [{ event: 'component_seat' as const, at: 0.15, caption: `Reassembled: ${data.title}` }] : data.audio;
    cues.forEach((c) => window.setTimeout(() => this.cue(c), c.at * 1000));
    this.select(null);
    this.model?.setFocus(data.focus.length ? data.focus : null);
    this.viewer.clearCallouts();
    // camera choreography
    if (data.camera) this.viewer.goTo(data.camera, true, target >= 2 ? 1.25 : 1);
    this.animateStripTo(target, () => {
      if (target >= 2) this.viewer.fitCurrent(true, target === 5 ? 1.32 : 1.15);
    });
  }

  step(dir: number): void {
    const stage = Math.round(this.stripProgress) + dir;
    this.goToStage(stage);
  }

  toggleStrip(): void {
    this.goToStage(this.stripProgress > 0.2 ? 0 : 5);
  }

  private toggleAuto(): void {
    if (this.autoStrip) {
      this.stopAuto();
      return;
    }
    this.autoStrip = true;
    this.autoBtn.replaceChildren(icon('pause'), h('span', {}, 'Pause'));
    setPressed(this.autoBtn, true);
    const run = (stage: number) => {
      if (!this.autoStrip) return;
      this.goToStage(stage);
      const wait = settings.reducedMotion ? 600 : 2600;
      if (stage < 5) this.autoTimer = window.setTimeout(() => run(stage + 1), wait);
      else this.autoTimer = window.setTimeout(() => {
        if (!this.autoStrip) return;
        this.goToStage(0);
        this.autoTimer = window.setTimeout(() => this.stopAuto(), 1500);
      }, wait + 800);
    };
    const start = Math.round(this.stripProgress) >= 5 ? 0 : Math.round(this.stripProgress) + 1;
    // goToStage calls stopAuto; re-arm after
    run(start);
  }

  private stopAuto(): void {
    if (!this.autoStrip) return;
    this.autoStrip = false;
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.autoTimer = null;
    this.autoBtn.replaceChildren(icon('play'), h('span', {}, 'Play'));
    setPressed(this.autoBtn, false);
  }

  // ------------------------------------------------------------ misc

  private toast(text: string): void {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-visible');
    window.setTimeout(() => el.classList.remove('is-visible'), 2600);
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.viewer.dispose();
  }
}

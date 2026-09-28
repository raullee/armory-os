import { audio, ENVIRONMENTS, type AcousticEnvironment } from '@/audio/AudioEngine';
import { settings } from './state';
import { ExhibitionView } from '@/ui/exhibition';
import { CollectionView } from '@/ui/collection';
import { PostersView } from '@/ui/posters';
import { IdentifyView } from '@/ui/identify';
import { CompareView } from '@/ui/compare';
import { initLanding } from '@/ui/landing';
import { button, h, icon, setPressed } from '@/ui/dom';

type ViewId = 'exhibition' | 'collection' | 'compare' | 'posters' | 'identify';

export class App {
  private current: ViewId = 'exhibition';
  private exhibition!: ExhibitionView;
  private compare: CompareView | null = null;
  private views: Partial<Record<ViewId, { setActive?: (on: boolean) => void }>> = {};

  /** Test / debug surface. */
  get exhibitionView(): ExhibitionView {
    return this.exhibition;
  }

  start(): void {
    const s = settings.get();
    audio.enabled = s.audioEnabled;
    audio.volume = s.volume;
    audio.environment = s.environment;
    audio.captionsEnabled = s.captions;
    audio.gentle = s.gentleAudio;
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? 'on' : 'off';

    this.buildGlobals();
    this.exhibition = new ExhibitionView(document.getElementById('view-exhibition')!);
    this.views.exhibition = this.exhibition;
    new CollectionView(document.getElementById('view-collection')!, (id) => this.openInExhibition(id), (id) => this.openInCompare(id));
    new PostersView(document.getElementById('view-posters')!);
    new IdentifyView(document.getElementById('view-identify')!, (id) => this.openInExhibition(id));
    this.bindTabs();
    this.bindHash();
    this.bindDrawer();

    const initial = this.idFromHash() ?? s.lastFirearm ?? 'm4a1';
    void this.exhibition.load(initial);
    this.exhibition.onChange((id) => {
      if (this.current === 'exhibition') history.replaceState(null, '', `#/${id}`);
    });

    initLanding(() => {
      audio.init();
      document.getElementById('app')!.setAttribute('aria-hidden', 'false');
      this.exhibition.setActive(true);
      this.exhibition.viewer.resize();
      this.exhibition.goTo('three-quarter');
    });
    // The app is rendered behind the landing so the first frame is ready when it fades.
    document.getElementById('app')!.setAttribute('aria-hidden', 'false');
  }

  private buildGlobals(): void {
    const root = document.getElementById('globals')!;
    const s = settings.get();
    const muteBtn = button('Audio', { icon: s.audioEnabled ? 'volume' : 'mute', title: 'Toggle audio [M]', ariaPressed: s.audioEnabled, onClick: () => this.toggleAudio() });
    muteBtn.id = 'btn-audio';
    const vol = h('input', { type: 'range', min: 0, max: 100, value: Math.round(s.volume * 100), class: 'range', 'aria-label': 'Volume', style: 'width:70px' }) as HTMLInputElement;
    vol.addEventListener('input', () => {
      audio.init();
      audio.setVolume(Number(vol.value) / 100);
      settings.set({ volume: Number(vol.value) / 100 });
    });
    const env = h('select', { class: 'select', 'aria-label': 'Acoustic environment', title: 'Acoustic environment' }) as HTMLSelectElement;
    ENVIRONMENTS.forEach((e) => env.appendChild(h('option', { value: e.id, selected: e.id === s.environment }, e.label)));
    env.addEventListener('change', () => {
      audio.init();
      audio.setEnvironment(env.value as AcousticEnvironment);
      settings.set({ environment: env.value as AcousticEnvironment });
      audio.ui('click');
    });
    const capBtn = button('CC', { title: 'Captions for audio events', ariaPressed: s.captions, onClick: () => {
      const on = !audio.captionsEnabled;
      audio.captionsEnabled = on;
      settings.set({ captions: on });
      setPressed(capBtn, on);
    } });
    const settingsBtn = button('', { icon: 'settings', class: 'btn-icon', title: 'Settings and shortcuts', onClick: () => this.toggleSettings() });
    settingsBtn.id = 'btn-settings';
    root.append(muteBtn, vol, env, capBtn, settingsBtn);

    // settings popover
    const pop = h('div', { class: 'popover', id: 'settings-pop', hidden: true, role: 'dialog', 'aria-label': 'Settings' });
    const row = (label: string, control: HTMLElement) => h('div', { class: 'row' }, h('span', {}, label), control);
    const sw = (checked: boolean, on: (v: boolean) => void) => {
      const i = h('input', { type: 'checkbox', checked: checked || undefined }) as HTMLInputElement;
      i.addEventListener('change', () => on(i.checked));
      return h('label', { class: 'switch' }, i);
    };
    const rm = h('select', { class: 'select' }, h('option', { value: 'auto', selected: s.reducedMotion === 'auto' }, 'System'), h('option', { value: 'on', selected: s.reducedMotion === 'on' }, 'Reduced'), h('option', { value: 'off', selected: s.reducedMotion === 'off' }, 'Full')) as HTMLSelectElement;
    rm.addEventListener('change', () => {
      settings.set({ reducedMotion: rm.value as 'auto' | 'on' | 'off' });
      document.documentElement.dataset.reducedMotion = settings.reducedMotion ? 'on' : 'off';
      this.toast('Motion setting applies fully after reload.');
    });
    const q = h('select', { class: 'select' }, ...['auto', 'high', 'medium', 'low'].map((v) => h('option', { value: v, selected: s.quality === v }, v === 'auto' ? `Auto (${settings.quality})` : v[0].toUpperCase() + v.slice(1)))) as HTMLSelectElement;
    q.addEventListener('change', () => {
      settings.set({ quality: q.value as 'auto' | 'high' | 'medium' | 'low' });
      this.toast('Quality applies after reload.');
    });
    pop.append(
      h('h4', {}, 'Settings'),
      row('Gentle audio (softer, low-passed)', sw(s.gentleAudio, (v) => { audio.gentle = v; settings.set({ gentleAudio: v }); })),
      row('Haptics on touch devices', sw(s.haptics, (v) => settings.set({ haptics: v }))),
      row('Motion', rm),
      row('Render quality', q),
      h('h4', { style: 'margin-top:12px' }, 'Keyboard'),
      h('div', { class: 'kbd-list' },
        h('kbd', {}, 'C'), h('span', {}, 'Charge / cycle the action'),
        h('kbd', {}, 'Space'), h('span', {}, 'Dry fire'),
        h('kbd', {}, 'R'), h('span', {}, 'Magazine change'),
        h('kbd', {}, 'S'), h('span', {}, 'Selector'),
        h('kbd', {}, 'E'), h('span', {}, 'Eject a case'),
        h('kbd', {}, 'F'), h('span', {}, 'Field strip / assemble'),
        h('kbd', {}, '[ ]'), h('span', {}, 'Previous / next strip stage'),
        h('kbd', {}, '1-5'), h('span', {}, 'Camera presets'),
        h('kbd', {}, 'V'), h('span', {}, 'Cycle render mode'),
        h('kbd', {}, 'D'), h('span', {}, 'Dimensions'),
        h('kbd', {}, 'I'), h('span', {}, 'Technical data drawer'),
        h('kbd', {}, 'M'), h('span', {}, 'Mute'),
        h('kbd', {}, 'Esc'), h('span', {}, 'Deselect'),
      ),
    );
    document.body.appendChild(pop);
    document.addEventListener('click', (e) => {
      if (pop.hidden) return;
      const t = e.target as Node;
      if (!pop.contains(t) && t !== settingsBtn && !settingsBtn.contains(t)) pop.hidden = true;
    });
    window.addEventListener('keydown', (e) => {
      const t = e.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName)) return;
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        this.toggleAudio();
      }
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.showTab('exhibition');
      }
      if (e.key === '?') this.toggleSettings();
    });
  }

  private toggleSettings(): void {
    const pop = document.getElementById('settings-pop')!;
    const btn = document.getElementById('btn-settings')!;
    pop.hidden = !pop.hidden;
    if (!pop.hidden) {
      const r = btn.getBoundingClientRect();
      pop.style.top = `${r.bottom + 8}px`;
      pop.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
      pop.style.left = 'auto';
    }
  }

  private toggleAudio(): void {
    audio.init();
    const on = !audio.enabled;
    audio.setEnabled(on);
    settings.set({ audioEnabled: on });
    const b = document.getElementById('btn-audio')!;
    setPressed(b, on);
    b.replaceChildren(icon(on ? 'volume' : 'mute'), h('span', {}, 'Audio'));
    if (on) audio.ui('click');
  }

  private bindDrawer(): void {
    const drawer = document.getElementById('drawer')!;
    const veil = document.getElementById('drawer-veil')!;
    const close = () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      veil.hidden = true;
    };
    document.getElementById('drawer-close')?.addEventListener('click', close);
    veil.addEventListener('click', close);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
      if (e.key.toLowerCase() === 'i' && !['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (drawer.classList.contains('is-open')) close();
        else this.exhibition.openDrawer();
      }
    });
  }

  private bindTabs(): void {
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach((t) => t.addEventListener('click', () => this.showTab(t.dataset.view as ViewId)));
  }

  private bindHash(): void {
    window.addEventListener('hashchange', () => {
      const id = this.idFromHash();
      if (id) {
        this.showTab('exhibition');
        void this.exhibition.load(id);
      }
    });
  }

  private idFromHash(): string | null {
    const m = location.hash.match(/^#\/([a-z0-9_]+)/i);
    return m ? m[1] : null;
  }

  showTab(id: ViewId): void {
    if (this.current === id) return;
    this.current = id;
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach((t) => {
      const on = t.dataset.view === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    (['exhibition', 'collection', 'compare', 'posters', 'identify'] as ViewId[]).forEach((v) => {
      const el = document.getElementById(`view-${v}`)!;
      const on = v === id;
      el.classList.toggle('is-active', on);
      el.hidden = !on;
      this.views[v]?.setActive?.(on);
    });
    if (id === 'compare' && !this.compare) {
      this.compare = new CompareView(document.getElementById('view-compare')!);
      this.views.compare = this.compare;
      this.compare.setActive(true);
    }
    audio.ui('click');
    window.scrollTo({ top: 0 });
  }

  private openInExhibition(id: string): void {
    this.showTab('exhibition');
    void this.exhibition.load(id);
  }

  private openInCompare(id: string): void {
    this.showTab('compare');
    this.compare?.setSecondary(id);
  }

  private toast(text: string): void {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-visible');
    window.setTimeout(() => el.classList.remove('is-visible'), 2600);
  }
}

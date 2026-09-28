import { CATALOG, CATEGORY_LABELS, type FirearmCatalogEntry } from '@/data/registry';
import { button, clear, h } from './dom';

/** Collection: the whole catalogue as cards with real, sourced headline numbers. */
export class CollectionView {
  private grid: HTMLElement;
  private category = 'all';
  private query = '';
  private chips = new Map<string, HTMLButtonElement>();

  constructor(root: HTMLElement, private onOpen: (id: string) => void, private onCompare: (id: string) => void) {
    const head = h('div', { class: 'collection-head' });
    const cats = ['all', ...Array.from(new Set(CATALOG.map((e) => e.category)))];
    cats.forEach((c) => {
      const chip = h('button', { class: `chip${c === 'all' ? ' is-on' : ''}`, type: 'button', onClick: () => this.setCategory(c) }, `${CATEGORY_LABELS[c] ?? c}${c === 'all' ? ` (${CATALOG.length})` : ''}`) as HTMLButtonElement;
      this.chips.set(c, chip);
      head.appendChild(chip);
    });
    const search = h('input', { type: 'search', placeholder: 'Search model, cartridge, action, origin', 'aria-label': 'Search', class: 'rail-search-input' }) as HTMLInputElement;
    search.style.cssText = 'height:30px;padding:0 10px;border:1px solid var(--line-2);border-radius:6px;background:rgba(255,255,255,0.02);color:var(--text);min-width:260px;font-size:12px';
    search.addEventListener('input', () => {
      this.query = search.value.toLowerCase();
      this.render();
    });
    head.append(h('span', { class: 'spacer' }), search);
    this.grid = h('div', { class: 'card-grid' });
    root.append(h('div', { class: 'collection' }, head, this.grid));
    this.render();
  }

  private setCategory(c: string): void {
    this.category = c;
    this.chips.forEach((chip, id) => chip.classList.toggle('is-on', id === c));
    this.render();
  }

  private render(): void {
    clear(this.grid);
    const list = CATALOG.filter((e) => (this.category === 'all' || e.category === this.category) && (!this.query || `${e.name} ${e.cartridge} ${e.actionLabel} ${e.categoryLabel} ${e.origin}`.toLowerCase().includes(this.query)));
    if (!list.length) {
      this.grid.appendChild(h('div', { class: 'prose', style: 'grid-column:1/-1;padding:30px;text-align:center' }, 'Nothing in the collection matches.'));
      return;
    }
    list.forEach((e) => this.grid.appendChild(this.card(e)));
  }

  private card(e: FirearmCatalogEntry): HTMLElement {
    return h(
      'article',
      { class: 'card' },
      h('div', { class: 't-system' }, `${e.categoryLabel} · ${e.origin}`),
      h('h3', { class: 'card-name' }, e.name),
      h('div', { class: 'card-silhouette', 'aria-hidden': 'true' }, lengthBar(e.overallLength)),
      h('div', { class: 'card-spec' },
        h('div', {}, h('span', {}, 'Cartridge '), e.cartridge),
        h('div', {}, h('span', {}, 'Length '), e.overallLength ? `${e.overallLength.toLocaleString()} mm` : 'N/A'),
        h('div', {}, h('span', {}, 'Mass '), e.mass ? `${(e.mass / 1000).toFixed(2)} kg` : 'N/A'),
        h('div', {}, h('span', {}, 'Action '), e.actionLabel),
      ),
      h('div', { class: 'card-foot' }, button('Open in exhibition', { class: 'btn-sm', onClick: () => this.onOpen(e.id) }), button('Compare', { class: 'btn-sm btn-ghost', icon: 'compare', onClick: () => this.onCompare(e.id) })),
    );
  }
}

/** A calibrated length bar: 1500 mm = full width, so relative size is legible at a glance. */
function lengthBar(len: number | null): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 300 64');
  const max = 1500;
  const w = len ? (len / max) * 300 : 0;
  const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bar.setAttribute('x', '0');
  bar.setAttribute('y', '28');
  bar.setAttribute('width', String(w));
  bar.setAttribute('height', '8');
  bar.setAttribute('rx', '2');
  bar.setAttribute('fill', '#3a4048');
  svg.appendChild(bar);
  for (let i = 0; i <= 15; i++) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const x = (i / 15) * 300;
    t.setAttribute('x1', String(x));
    t.setAttribute('x2', String(x));
    t.setAttribute('y1', i % 5 === 0 ? '42' : '46');
    t.setAttribute('y2', '50');
    t.setAttribute('stroke', i % 5 === 0 ? '#7f8790' : '#3a4048');
    t.setAttribute('stroke-width', '1');
    svg.appendChild(t);
  }
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', '0');
  label.setAttribute('y', '62');
  label.setAttribute('fill', '#5b636c');
  label.setAttribute('font-size', '9');
  label.setAttribute('font-family', 'JetBrains Mono, monospace');
  label.textContent = '0';
  svg.appendChild(label);
  const label2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label2.setAttribute('x', '300');
  label2.setAttribute('y', '62');
  label2.setAttribute('text-anchor', 'end');
  label2.setAttribute('fill', '#5b636c');
  label2.setAttribute('font-size', '9');
  label2.setAttribute('font-family', 'JetBrains Mono, monospace');
  label2.textContent = '1.5 m';
  svg.appendChild(label2);
  return svg;
}

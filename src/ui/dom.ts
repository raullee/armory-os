/** Tiny DOM helpers. All text goes through textContent; no innerHTML with data. */

type Child = Node | string | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | number | boolean | ((e: Event) => void) | undefined> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (k === 'class') {
      el.className = String(v);
    } else if (k === 'dataset') {
      continue;
    } else if (v === true) {
      el.setAttribute(k, '');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

export function append(el: Node, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else el.appendChild(c);
  }
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function qs<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Missing element ${sel}`);
  return el;
}

export function fmt(n: number | null | undefined, unit = '', digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return 'N/A';
  return `${n.toLocaleString('en-GB', { maximumFractionDigits: digits })}${unit ? ' ' + unit : ''}`;
}

/** Icon glyphs as inline SVG paths (24x24 viewBox), kept tiny and dependency-free. */
const ICONS: Record<string, string> = {
  play: 'M8 5v14l11-7z',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  rotate: 'M21 12a9 9 0 1 1-3-6.7M21 3v6h-6',
  reset: 'M3 12a9 9 0 1 0 3-6.7M3 3v6h6',
  volume: 'M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14',
  mute: 'M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5',
  ruler: 'M3 17l14-14 4 4L7 21H3v-4zM8 12l2 2M11 9l2 2M14 6l2 2',
  captions: 'M4 5h16v14H4zM7 12h4M7 15h7M14 12h3',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  x: 'M18 6L6 18M6 6l12 12',
  keyboard: 'M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  compare: 'M8 3L4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4',
  image: 'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v4M12 18v4M2 12h4M18 12h4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  unlink: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7M3 3l18 18',
};

export function icon(name: keyof typeof ICONS | string, size = 16): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.7');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICONS[name] ?? ICONS.info);
  svg.appendChild(path);
  return svg;
}

export function button(label: string, opts: { icon?: string; onClick?: (e: Event) => void; class?: string; title?: string; kbd?: string; ariaPressed?: boolean; id?: string } = {}): HTMLButtonElement {
  const b = h('button', { type: 'button', class: `btn ${opts.class ?? ''}`.trim(), title: opts.title ?? label, id: opts.id, onClick: opts.onClick });
  if (opts.icon) b.appendChild(icon(opts.icon));
  if (label) b.appendChild(h('span', {}, label));
  if (opts.kbd) b.appendChild(h('kbd', {}, opts.kbd));
  if (opts.ariaPressed !== undefined) b.setAttribute('aria-pressed', String(opts.ariaPressed));
  return b;
}

export function setPressed(b: HTMLElement, on: boolean): void {
  b.setAttribute('aria-pressed', String(on));
  b.classList.toggle('is-on', on);
}

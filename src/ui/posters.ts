import { button, h } from './dom';

const PLATES = [
  { src: '/posters/exploded_armory_blueprint_1790507166164.jpg', title: 'Exploded blueprint plate', note: 'Illustrative artwork' },
  { src: '/posters/tech_specs_armory_1790493204327.jpg', title: 'Specification sheet, part 1', note: 'Illustrative artwork' },
  { src: '/posters/extended_armory_specs_1790493227707.jpg', title: 'Specification sheet, part 2', note: 'Illustrative artwork' },
  { src: '/posters/master_firearms_chart_1790490483842.jpg', title: 'Master identification chart', note: 'Illustrative artwork' },
  { src: '/posters/firearm_id_poster_1790490383358.jpg', title: 'Identification poster', note: 'Illustrative artwork' },
  { src: '/posters/firearm_types_guide_1790490403213.jpg', title: 'Types guide', note: 'Illustrative artwork' },
  { src: '/posters/neo_tactical_armory_1790490526439.jpg', title: 'Exhibition plate, landscape', note: 'Illustrative artwork' },
  { src: '/posters/neo_tactical_portrait_1790490547419.jpg', title: 'Exhibition plate, portrait', note: 'Illustrative artwork' },
];

/** Plates: the poster artwork carried over from v2, clearly labelled as illustration rather than data. */
export class PostersView {
  constructor(root: HTMLElement) {
    const lb = h('div', { class: 'lightbox', hidden: true, role: 'dialog', 'aria-label': 'Plate' });
    const img = h('img', { alt: '' }) as HTMLImageElement;
    lb.append(img, button('', { icon: 'x', class: 'btn-icon', title: 'Close', onClick: () => (lb.hidden = true) }));
    lb.addEventListener('click', (e) => {
      if (e.target === lb) lb.hidden = true;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lb.hidden = true;
    });
    const grid = h('div', { class: 'posters' });
    PLATES.forEach((p) => {
      const im = h('img', { src: p.src, alt: p.title, loading: 'lazy', decoding: 'async' }) as HTMLImageElement;
      im.addEventListener('click', () => {
        img.src = p.src;
        img.alt = p.title;
        lb.hidden = false;
      });
      grid.appendChild(h('figure', { class: 'poster', style: 'margin:0' }, im, h('figcaption', { class: 'poster-foot' }, h('div', {}, h('div', { style: 'font-weight:500' }, p.title), h('div', { class: 't-system' }, p.note)), h('a', { href: p.src, target: '_blank', rel: 'noopener', class: 'btn btn-sm' }, 'Open full size'))));
    });
    root.append(h('div', { class: 'collection', style: 'padding-bottom:0' }, h('p', { class: 'prose' }, 'These plates are exhibition artwork from the previous release. Numbers printed on them are not part of the audited data set; the specification tables in the Exhibition view are authoritative.')), grid, lb);
  }
}

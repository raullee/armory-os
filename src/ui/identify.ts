import { audio } from '@/audio/AudioEngine';
import { button, clear, h } from './dom';

interface Q {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  open?: string;
}

const QUESTIONS: Q[] = [
  { prompt: 'The magazine is inserted behind the pistol grip, inside the butt, and the overall length is under 800 mm despite a full-length barrel. What layout is this?', options: ['Conventional carbine', 'Bullpup', 'Submachine gun', 'Battle rifle'], answer: 1, explanation: 'Bullpups place the action and magazine behind the trigger, so a rifle-length barrel fits in a carbine-length weapon.', open: 'steyraug' },
  { prompt: 'A large rifle with a two-chamber arrowhead muzzle brake, a straight ten-round magazine and a bipod. The barrel itself recoils inside the receiver.', options: ['Accuracy International AX338', 'Barrett M82A1', 'CheyTac M200', 'FN SCAR 17S'], answer: 1, explanation: 'The M82A1 is short-recoil operated: barrel and bolt recoil together before unlocking, and the brake absorbs much of the .50 BMG impulse.', open: 'm82a1' },
  { prompt: 'A long tube runs directly beneath the barrel with a cap at the muzzle end, and there is no box magazine at all.', options: ['Gas tube on an AR-pattern rifle', 'Tubular magazine on a shotgun', 'Suppressor', 'Cleaning rod'], answer: 1, explanation: 'Tubular magazines under the barrel are the signature of pump and semi-automatic shotguns such as the Remington 870 and Benelli M4.', open: 'remington870' },
  { prompt: 'A compact weapon with a translucent magazine lying flat along the top, rounds visible and lying at right angles to the bore.', options: ['FN P90', 'KRISS Vector', 'HK MP5', 'HK MP7'], answer: 0, explanation: 'Only the P90 feeds from a horizontal top magazine; a spiral ramp turns each round 90 degrees into the chamber.', open: 'p90' },
  { prompt: 'The charging handle sits in a tube above the barrel, well forward, and is slapped down after being locked back. The bolt uses two rollers to delay opening.', options: ['AK pattern', 'Roller-delayed HK pattern', 'Direct impingement', 'Long-stroke piston'], answer: 1, explanation: 'The forward cocking tube and roller-delayed blowback are shared by the G3 and MP5 family.', open: 'hkmp5' },
  { prompt: 'A pistol with an exposed hammer, a grip safety under the beavertail and a single-stack seven-round magazine.', options: ['Glock 19', 'Colt M1911A1', 'Desert Eagle', 'Colt Python'], answer: 1, explanation: 'The M1911 pattern: single action, grip safety, .45 ACP in a seven-round single-stack magazine.', open: 'm1911' },
  { prompt: 'A rifle whose bolt carrier is pinned to a long gas piston rod riding above the barrel, with a stamped receiver and a curved thirty-round magazine.', options: ['M4A1', 'AKM', 'SCAR 17S', 'L85A2'], answer: 1, explanation: 'The AKM is long-stroke: the piston and carrier are one assembly and travel the full stroke together.', open: 'ak47' },
  { prompt: 'A revolver with a ventilated rib along the top of the barrel and a full-length underlug enclosing the ejector rod.', options: ['Colt Python', 'Smith & Wesson Model 10', 'Ruger GP100', 'Webley Mk VI'], answer: 0, explanation: 'The Python’s vent rib and full underlug are its most recognisable features.', open: 'colt_python' },
];

/** Identify: a short recognition exercise built on the collection. */
export class IdentifyView {
  private card: HTMLElement;
  private i = 0;
  private score = 0;

  constructor(root: HTMLElement, private onOpen: (id: string) => void) {
    this.card = h('div', { class: 'quiz' });
    root.append(h('div', { class: 'identify' }, h('div', { class: 't-system', style: 'margin-bottom:10px' }, 'Recognition exercise'), h('p', { class: 'prose' }, 'Eight questions on layout and mechanism. Each answer links to the firearm in the exhibition so you can check the feature on the model.'), this.card));
    this.render();
  }

  private render(): void {
    clear(this.card);
    if (this.i >= QUESTIONS.length) {
      this.card.append(
        h('div', { class: 'q-head' }, h('span', { class: 't-system' }, 'Complete'), h('span', { class: 't-status' }, `${this.score} / ${QUESTIONS.length}`)),
        h('p', { class: 'q-text' }, this.score === QUESTIONS.length ? 'Every feature identified.' : `${this.score} of ${QUESTIONS.length} identified.`),
        button('Start again', { onClick: () => { this.i = 0; this.score = 0; this.render(); } }),
      );
      return;
    }
    const q = QUESTIONS[this.i];
    const opts = h('div', { class: 'q-opts', role: 'group' });
    const fb = h('div', { class: 'q-fb', hidden: true });
    q.options.forEach((o, idx) => {
      const b = h('button', { class: 'q-opt', type: 'button' }, o) as HTMLButtonElement;
      b.addEventListener('click', () => {
        opts.querySelectorAll<HTMLButtonElement>('.q-opt').forEach((x) => (x.disabled = true));
        const right = idx === q.answer;
        b.classList.add(right ? 'is-right' : 'is-wrong');
        if (!right) (opts.children[q.answer] as HTMLElement).classList.add('is-right');
        if (right) this.score++;
        audio.ui(right ? 'click' : 'detent');
        fb.hidden = false;
        fb.replaceChildren(
          h('div', { class: 't-system', style: 'margin-bottom:4px' }, right ? 'Correct' : `Correct answer: ${q.options[q.answer]}`),
          h('div', {}, q.explanation),
          h('div', { style: 'display:flex;gap:6px;margin-top:10px' }, button('Next', { onClick: () => { this.i++; this.render(); } }), q.open ? button('See it in the exhibition', { class: 'btn-ghost', onClick: () => this.onOpen(q.open!) }) : null),
        );
      });
      opts.appendChild(b);
    });
    this.card.append(h('div', { class: 'q-head' }, h('span', { class: 't-system' }, `Question ${this.i + 1} of ${QUESTIONS.length}`), h('span', { class: 't-status' }, `Score ${this.score}`)), h('p', { class: 'q-text' }, q.prompt), opts, fb);
  }
}

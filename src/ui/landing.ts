import { settings } from '@/app/state';

/**
 * Landing: a quiet, restrained entry. A single slowly rotating ring of
 * measured tick marks drawn on a 2D canvas (no WebGL context spent here),
 * fading to the exhibition on entry. The button also unlocks the AudioContext.
 */
export function initLanding(onEnter: () => void): void {
  const el = document.getElementById('landing')!;
  const canvas = document.getElementById('landing-canvas') as HTMLCanvasElement;
  const btn = document.getElementById('landing-enter') as HTMLButtonElement;
  const ctx = canvas.getContext('2d');
  let raf = 0;
  let t0 = performance.now();
  const reduced = settings.reducedMotion;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const draw = () => {
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const t = reduced ? 0 : (performance.now() - t0) / 1000;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h * 0.52;
    const R = Math.min(w, h) * 0.34;
    ctx.save();
    ctx.translate(cx, cy);
    // outer measured ring
    ctx.rotate(t * 0.04);
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const major = i % 10 === 0;
      const len = major ? 14 : i % 5 === 0 ? 8 : 4;
      ctx.strokeStyle = major ? 'rgba(232,234,237,0.55)' : 'rgba(127,135,144,0.35)';
      ctx.lineWidth = major ? 1.2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R);
      ctx.lineTo(Math.cos(a) * (R - len), Math.sin(a) * (R - len));
      ctx.stroke();
    }
    ctx.restore();
    // inner ring counter-rotating slowly
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-t * 0.025);
    ctx.strokeStyle = 'rgba(103,232,249,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.72, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(103,232,249,0.12)';
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.72, Math.PI * 1.5, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // crosshair ticks
    ctx.strokeStyle = 'rgba(232,234,237,0.25)';
    ctx.lineWidth = 1;
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * R * 0.86, cy + dy * R * 0.86);
      ctx.lineTo(cx + dx * R * 0.95, cy + dy * R * 0.95);
      ctx.stroke();
    });
    if (!reduced) raf = requestAnimationFrame(draw);
  };
  draw();

  const enter = () => {
    cancelAnimationFrame(raf);
    el.classList.add('is-hidden');
    el.setAttribute('aria-hidden', 'true');
    onEnter();
    window.setTimeout(() => (el.style.display = 'none'), 800);
  };
  btn.addEventListener('click', enter);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') enter();
  });
  btn.focus();
}

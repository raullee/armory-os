import type { EasingName } from '@/firearm/schema';

/**
 * Easing library tuned for mechanical motion rather than UI motion.
 *
 * mechanicalSnap: a part accelerating under stored energy and stopping hard on
 *   a mechanical stop (hammer fall, striker). No overshoot, no ease-out.
 * springReturn:   a mass released against a compressed spring: accelerates,
 *   spring force tails off, then an abrupt stop with a tiny settle.
 * detent:         slow build against a spring-loaded detent, then a snap through.
 */
export const EASINGS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  inBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  mechanicalSnap: (t) => Math.pow(t, 2.4),
  springReturn: (t) => {
    if (t >= 1) return 1;
    const travel = Math.pow(t, 1.65);
    // tiny settle in the last 6% (carrier bounce against the barrel extension)
    if (t > 0.94) {
      const s = (t - 0.94) / 0.06;
      return 1 - 0.012 * Math.sin(s * Math.PI) * (1 - s);
    }
    return travel;
  },
  detent: (t) => {
    // resists (slow) for the first 55%, then snaps
    if (t < 0.55) return Math.pow(t / 0.55, 2.2) * 0.3;
    const s = (t - 0.55) / 0.45;
    return 0.3 + 0.7 * (1 - Math.pow(1 - s, 3));
  },
};

export function ease(name: EasingName | undefined, t: number): number {
  const f = EASINGS[name ?? 'inOutCubic'] ?? EASINGS.inOutCubic;
  return f(Math.max(0, Math.min(1, t)));
}

/** Cubic-bezier as used for camera choreography. */
export function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number): (t: number) => number {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - x;
      if (Math.abs(dx) < 1e-5) break;
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= dx / d;
    }
    return sampleY(Math.max(0, Math.min(1, t)));
  };
}

export const cameraEase = cubicBezier(0.22, 0.9, 0.24, 1);

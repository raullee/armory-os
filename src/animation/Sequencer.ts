import * as THREE from 'three';
import type { AnimationSequence, AnimationStep, AudioCue, Vec3 } from '@/firearm/schema';
import type { FirearmModel } from '@/firearm/FirearmModel';
import { ease } from './easing';

interface StepState {
  step: AnimationStep;
  started: boolean;
  done: boolean;
  fromT: THREE.Vector3;
  fromR: THREE.Euler;
  toT: THREE.Vector3;
  toR: THREE.Euler;
}

interface Running {
  seq: AnimationSequence;
  model: FirearmModel;
  elapsed: number;
  steps: StepState[];
  cues: { cue: AudioCue; fired: boolean }[];
  resolve: () => void;
  onAudio?: (cue: AudioCue) => void;
  onComplete?: () => void;
}

/**
 * AnimationSequence runner. Drives FirearmModel anim offsets from data-defined
 * steps. Motion is purely kinematic (translations along an axis, rotations
 * about a pivot, travel limits from the data), so parts never pass through
 * one another unless the data says so.
 */
export class Sequencer {
  private running: Running[] = [];
  /** 1 = normal, 0.5 = half speed. Reduced motion uses 1 but shortens nothing; the data is mechanical. */
  timeScale = 1;

  get busy(): boolean {
    return this.running.length > 0;
  }

  isPlaying(id: string): boolean {
    return this.running.some((r) => r.seq.id === id);
  }

  play(model: FirearmModel, seq: AnimationSequence, hooks: { onAudio?: (cue: AudioCue) => void; onComplete?: () => void } = {}): Promise<void> {
    // A sequence with the same id restarts.
    this.stop(seq.id);
    return new Promise((resolve) => {
      this.running.push({
        seq,
        model,
        elapsed: 0,
        steps: seq.steps.map((step) => ({
          step,
          started: false,
          done: false,
          fromT: new THREE.Vector3(),
          fromR: new THREE.Euler(),
          toT: new THREE.Vector3(),
          toR: new THREE.Euler(),
        })),
        cues: seq.audio.map((cue) => ({ cue, fired: false })),
        resolve,
        onAudio: hooks.onAudio,
        onComplete: hooks.onComplete,
      });
    });
  }

  stop(id?: string): void {
    if (!id) {
      this.running.forEach((r) => r.resolve());
      this.running = [];
      return;
    }
    this.running = this.running.filter((r) => {
      if (r.seq.id === id) {
        r.resolve();
        return false;
      }
      return true;
    });
  }

  update(dt: number): void {
    if (!this.running.length) return;
    const scaled = dt * this.timeScale;
    for (const r of [...this.running]) {
      r.elapsed += scaled;
      for (const s of r.steps) {
        const [t0, t1] = s.step.t;
        if (s.done) continue;
        if (r.elapsed < t0) continue;
        const node = r.model.get(s.step.component);
        if (!node) {
          s.done = true;
          continue;
        }
        if (!s.started) {
          s.started = true;
          s.fromT.copy(node.anim.offset);
          s.fromR.copy(node.anim.rotate);
          if (s.step.reset) {
            s.toT.set(0, 0, 0);
            s.toR.set(0, 0, 0);
          } else {
            const tt = s.step.translate as Vec3 | undefined;
            const rr = s.step.rotate as Vec3 | undefined;
            if (tt) s.toT.set(tt[0], tt[1], tt[2]);
            else s.toT.copy(s.fromT);
            if (rr) s.toR.set(rr[0], rr[1], rr[2]);
            else s.toR.copy(s.fromR);
          }
        }
        const span = Math.max(1e-4, t1 - t0);
        const k = ease(s.step.easing, (r.elapsed - t0) / span);
        node.anim.offset.lerpVectors(s.fromT, s.toT, k);
        node.anim.rotate.set(
          s.fromR.x + (s.toR.x - s.fromR.x) * k,
          s.fromR.y + (s.toR.y - s.fromR.y) * k,
          s.fromR.z + (s.toR.z - s.fromR.z) * k,
        );
        r.model.setAnim(s.step.component, [node.anim.offset.x, node.anim.offset.y, node.anim.offset.z], [node.anim.rotate.x, node.anim.rotate.y, node.anim.rotate.z]);
        if (r.elapsed >= t1) s.done = true;
      }
      for (const c of r.cues) {
        if (!c.fired && r.elapsed >= c.cue.at) {
          c.fired = true;
          r.onAudio?.(c.cue);
        }
      }
      if (r.elapsed >= r.seq.duration && r.steps.every((s) => s.done)) {
        this.running = this.running.filter((x) => x !== r);
        r.onComplete?.();
        r.resolve();
      }
    }
  }
}

/** Generic scalar tween used for slider/strip/camera transitions. */
export class Tween {
  private t = 0;
  private active = false;
  private from = 0;
  private to = 0;
  private duration = 0.4;
  private easing: (t: number) => number = (t) => t;
  private onUpdate: (v: number) => void = () => {};
  private onDone?: () => void;
  value = 0;

  start(from: number, to: number, duration: number, easing: (t: number) => number, onUpdate: (v: number) => void, onDone?: () => void): void {
    this.from = from;
    this.to = to;
    this.duration = Math.max(0.0001, duration);
    this.easing = easing;
    this.onUpdate = onUpdate;
    this.onDone = onDone;
    this.t = 0;
    this.active = true;
    this.value = from;
  }

  stop(): void {
    this.active = false;
  }

  get running(): boolean {
    return this.active;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.t += dt;
    const k = this.easing(Math.min(1, this.t / this.duration));
    this.value = this.from + (this.to - this.from) * k;
    this.onUpdate(this.value);
    if (this.t >= this.duration) {
      this.active = false;
      this.onDone?.();
    }
  }
}

import type { AcousticIdentity, AudioEventId, AudioLayerParams } from '@/firearm/schema';

/**
 * ARMORY OS audio architecture (v3).
 *
 * Layered procedural synthesis, parameterised per firearm by its
 * AcousticIdentity (mass, receiver material, action type, reciprocating mass,
 * spring character, furniture). No sampled recordings are shipped: every
 * event is synthesised at play time, which keeps the build asset-free and
 * lets the same event differ between a stamped-steel roller-delayed action and
 * a forged-aluminium direct-impingement carbine.
 *
 * Signal path:
 *   layers -> event bus (pan, distance) -> dry / convolution wet -> saturation -> compressor -> master
 *
 * Firing is not simulated. Only mechanical events are represented.
 */

export type AcousticEnvironment = 'studio' | 'industrial' | 'concrete' | 'outdoor' | 'museum';

export const ENVIRONMENTS: { id: AcousticEnvironment; label: string; note: string }[] = [
  { id: 'studio', label: 'Dry / studio', note: 'Near-anechoic. Mechanical detail only.' },
  { id: 'industrial', label: 'Industrial', note: 'Steel-framed hall, long metallic tail.' },
  { id: 'concrete', label: 'Concrete room', note: 'Hard walls, dense early reflections.' },
  { id: 'outdoor', label: 'Outdoor', note: 'Open air with a single distant slap-back.' },
  { id: 'museum', label: 'Museum / exhibition', note: 'Large soft-surfaced gallery, gentle decay.' },
];

interface EnvSpec {
  rt60: number;
  preDelay: number;
  wet: number;
  damping: number; // 0..1 high-frequency loss in the tail
  early: { t: number; g: number }[];
  brightness: number; // multiplier on the tail's initial cutoff
}

const ENV_SPECS: Record<AcousticEnvironment, EnvSpec> = {
  studio: { rt60: 0.22, preDelay: 0.004, wet: 0.1, damping: 0.6, early: [{ t: 0.006, g: 0.25 }, { t: 0.011, g: 0.15 }], brightness: 0.9 },
  industrial: { rt60: 1.9, preDelay: 0.012, wet: 0.32, damping: 0.25, early: [{ t: 0.018, g: 0.45 }, { t: 0.031, g: 0.35 }, { t: 0.052, g: 0.3 }, { t: 0.078, g: 0.2 }], brightness: 1.2 },
  concrete: { rt60: 1.1, preDelay: 0.008, wet: 0.36, damping: 0.3, early: [{ t: 0.009, g: 0.5 }, { t: 0.015, g: 0.42 }, { t: 0.022, g: 0.38 }, { t: 0.034, g: 0.3 }, { t: 0.047, g: 0.22 }], brightness: 1.1 },
  outdoor: { rt60: 0.18, preDelay: 0.0, wet: 0.16, damping: 0.75, early: [{ t: 0.13, g: 0.18 }], brightness: 0.6 },
  museum: { rt60: 2.4, preDelay: 0.02, wet: 0.28, damping: 0.7, early: [{ t: 0.024, g: 0.28 }, { t: 0.041, g: 0.22 }, { t: 0.067, g: 0.16 }], brightness: 0.55 },
};

export interface PlayOptions {
  /** -1 left .. 1 right, from the component's screen position. */
  pan?: number;
  /** 0 near .. 1 far, from camera distance. */
  distance?: number;
  intensity?: number;
  caption?: string;
}

export type CaptionListener = (text: string) => void;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private compressor!: DynamicsCompressorNode;
  private shaper!: WaveShaperNode;
  private dry!: GainNode;
  private wet!: GainNode;
  private convolver!: ConvolverNode;
  private white!: AudioBuffer;
  private pink!: AudioBuffer;
  environment: AcousticEnvironment = 'studio';
  enabled = true;
  volume = 0.8;
  captionsEnabled = false;
  /** Softer, low-passed mix for people with auditory sensitivity. */
  gentle = false;
  private captionListeners: CaptionListener[] = [];
  private seed = 1;

  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC({ latencyHint: 'interactive' });
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? this.volume : 0;
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.knee.value = 6;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.0015;
    this.compressor.release.value = 0.09;
    this.shaper = ctx.createWaveShaper();
    this.shaper.curve = this.distortionCurve(1.35);
    this.shaper.oversample = '2x';
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.convolver = ctx.createConvolver();
    this.dry.connect(this.shaper);
    this.convolver.connect(this.wet);
    this.wet.connect(this.shaper);
    this.shaper.connect(this.compressor);
    this.compressor.connect(this.master);
    this.master.connect(ctx.destination);
    this.white = this.makeNoise(false);
    this.pink = this.makeNoise(true);
    this.setEnvironment(this.environment);
  }

  private distortionCurve(k: number): Float32Array<ArrayBuffer> {
    const n = 8192;
    const curve = new Float32Array(new ArrayBuffer(n * 4));
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(k * x) / Math.tanh(k);
    }
    return curve;
  }

  private makeNoise(pink: boolean): AudioBuffer {
    const ctx = this.ctx!;
    const sr = ctx.sampleRate;
    const len = sr * 2;
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (!pink) {
        d[i] = w;
        continue;
      }
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }

  // ------------------------------------------------------------ environment

  setEnvironment(env: AcousticEnvironment): void {
    this.environment = env;
    if (!this.ctx) return;
    const spec = ENV_SPECS[env];
    this.convolver.buffer = this.buildImpulse(spec);
    const t = this.ctx.currentTime;
    this.wet.gain.cancelScheduledValues(t);
    this.wet.gain.setTargetAtTime(spec.wet, t, 0.05);
    this.dry.gain.setTargetAtTime(1 - spec.wet * 0.35, t, 0.05);
  }

  /** Synthesised impulse response: early reflection taps + frequency-dependent exponential tail. */
  private buildImpulse(spec: EnvSpec): AudioBuffer {
    const ctx = this.ctx!;
    const sr = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sr * (spec.preDelay + spec.rt60 * 1.1)));
    const buf = ctx.createBuffer(2, length, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      const pre = Math.floor(spec.preDelay * sr);
      // Tail: noise with exponential decay, low-pass that closes over time (air + surface absorption).
      const tau = spec.rt60 / 6.91; // -60 dB
      let lp = 0;
      let seed = 1234 + ch * 77;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296 - 0.5;
      };
      for (let i = pre; i < length; i++) {
        const t = (i - pre) / sr;
        const env = Math.exp(-t / tau);
        // cutoff starts high and falls with time
        const cutoff = clamp(spec.brightness * (9000 - 7000 * spec.damping * (t / spec.rt60)), 600, 12000);
        const a = Math.exp((-2 * Math.PI * cutoff) / sr);
        lp = a * lp + (1 - a) * rnd() * 2;
        d[i] = lp * env * 0.9;
      }
      // Early reflections as discrete taps (slightly different per channel for width).
      spec.early.forEach((e, idx) => {
        const at = pre + Math.floor((e.t + (ch === 0 ? 0 : 0.0017 * (idx + 1))) * sr);
        for (let k = 0; k < 40 && at + k < length; k++) {
          d[at + k] += (rnd() * 2) * e.g * Math.exp(-k / 12);
        }
      });
      // direct path marker
      if (pre < length) d[pre] += 0.02;
    }
    return buf;
  }

  // ------------------------------------------------------------ controls

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.ctx) this.master.gain.setTargetAtTime(on ? this.volume : 0, this.ctx.currentTime, 0.02);
  }

  setVolume(v: number): void {
    this.volume = clamp(v, 0, 1);
    if (this.ctx && this.enabled) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
  }

  onCaption(fn: CaptionListener): () => void {
    this.captionListeners.push(fn);
    return () => (this.captionListeners = this.captionListeners.filter((f) => f !== fn));
  }

  private caption(text?: string): void {
    if (!text || !this.captionsEnabled) return;
    this.captionListeners.forEach((f) => f(text));
  }

  private vary(v: number, pct = 0.04): number {
    // deterministic-ish jitter so repeated events differ subtly
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    const r = (this.seed / 0x7fffffff) * 2 - 1;
    return v * (1 + r * pct);
  }

  // ------------------------------------------------------------ primitives

  private bus(pan = 0, distance = 0): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const att = 1 - clamp(distance, 0, 1) * 0.55;
    g.gain.value = att * (this.gentle ? 0.55 : 1);
    let out: AudioNode = g;
    if (this.gentle) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      g.connect(lp);
      out = lp;
    }
    if (distance > 0.05) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 12000 - 8000 * clamp(distance, 0, 1);
      out.connect(lp);
      out = lp;
    }
    const panner = ctx.createStereoPanner();
    panner.pan.value = clamp(pan, -1, 1) * 0.7;
    out.connect(panner);
    panner.connect(this.dry);
    panner.connect(this.convolver);
    return g;
  }

  private resonator(dest: AudioNode, t: number, freq: number, q: number, gain: number, decay: number, source: 'white' | 'pink' = 'white'): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = source === 'white' ? this.white : this.pink;
    src.loop = true;
    src.loopStart = Math.random() * 1.5;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(this.vary(freq, 0.025), t);
    f.Q.setValueAtTime(q, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.0012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + decay + 0.02);
  }

  private burst(dest: AudioNode, t: number, duration: number, freq: number, q: number, gain: number, type: BiquadFilterType = 'bandpass', source: 'white' | 'pink' = 'white'): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = source === 'white' ? this.white : this.pink;
    src.loop = true;
    src.loopStart = Math.random() * 1.5;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    f.Q.setValueAtTime(q, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.min(0.002, duration * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  private friction(dest: AudioNode, t: number, duration: number, f0: number, f1: number, gain: number, q = 4.5): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.pink;
    src.loop = true;
    src.loopStart = Math.random() * 1.5;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(f0, t);
    f.frequency.linearRampToValueAtTime(f1, t + duration);
    f.Q.setValueAtTime(q, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + duration * 0.3);
    g.gain.setValueAtTime(gain, t + duration * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  private tone(dest: AudioNode, t: number, duration: number, f0: number, f1: number, gain: number, type: OscillatorType = 'sine'): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + duration + 0.01);
  }

  /** Multi-mode metal strike. The four modes map to body mass, structure, reciprocating part and hardened contact. */
  private strike(dest: AudioNode, t: number, p: AudioLayerParams, opts: { bounce?: boolean; bodyDecay?: number; ringDecay?: number } = {}): void {
    const bodyDecay = opts.bodyDecay ?? p.duration;
    const ringDecay = opts.ringDecay ?? p.duration * 0.6;
    const polymer = clamp(p.polymer, 0, 1);
    // contact transient
    this.burst(dest, t, 0.0035, p.ring * 1.1, 4, 0.32 * p.gain * (1 - polymer * 0.5), 'highpass');
    // body mass thump
    this.resonator(dest, t, p.body, 4.5 + polymer * 2, 0.5 * p.gain, bodyDecay * (1 + polymer * 0.4), 'pink');
    // structural mid
    this.resonator(dest, t, p.mid, 14, 0.32 * p.gain * (1 - polymer * 0.45), bodyDecay * 0.8);
    // hardened contact ring
    this.resonator(dest, t, p.ring, 24, 0.24 * p.gain * (1 - polymer * 0.7), ringDecay);
    // polymer thock
    if (polymer > 0.05) this.burst(dest, t, 0.03, 420, 2.5, 0.4 * p.gain * polymer, 'lowpass', 'pink');
    if (opts.bounce !== false) {
      const tb = t + 0.007 + Math.random() * 0.003;
      this.resonator(dest, tb, p.mid * 1.17, 12, 0.14 * p.gain, bodyDecay * 0.5);
      this.resonator(dest, tb, p.ring * 0.94, 20, 0.1 * p.gain * (1 - polymer * 0.6), ringDecay * 0.5);
    }
  }

  private springTwang(dest: AudioNode, t: number, freq: number, gain: number, duration: number): void {
    // Coil spring modes: fundamental and a slightly inharmonic pair; brief downward chirp.
    this.resonator(dest, t, freq, 26, gain, duration);
    this.resonator(dest, t + 0.006, freq * 1.53, 20, gain * 0.5, duration * 0.8);
    this.resonator(dest, t + 0.012, freq * 2.31, 18, gain * 0.28, duration * 0.6);
    this.tone(dest, t, duration * 0.7, freq * 1.02, freq * 0.93, gain * 0.35, 'triangle');
  }

  private rattle(dest: AudioNode, t: number, p: AudioLayerParams, count: number, spread: number, gain: number): void {
    for (let i = 0; i < count; i++) {
      const dt = (i / count) * spread + Math.random() * (spread / count) * 0.8;
      this.resonator(dest, t + dt, p.mid * (0.9 + Math.random() * 0.3), 16, gain * (0.5 + Math.random() * 0.5), 0.02);
    }
  }

  // ------------------------------------------------------------ identity -> params

  private baseParams(id: AcousticIdentity): AudioLayerParams {
    // Body frequency from mass (heavier = lower), receiver class sets brightness and damping.
    const massT = clamp((Math.log(id.mass) - Math.log(500)) / (Math.log(15000) - Math.log(500)), 0, 1);
    let body = 300 - 210 * massT; // 300 Hz (500 g) .. 90 Hz (15 kg)
    let mid = 1100 - 500 * massT;
    let ring = 5600 - 1800 * massT;
    let duration = 0.05 + 0.05 * massT;
    let polymer = id.furniture === 'polymer' ? 0.18 : id.furniture === 'wood' ? 0.12 : 0;
    switch (id.receiver) {
      case 'aluminium-forged':
        mid *= 1.25;
        ring *= 1.08;
        duration *= 0.9;
        break;
      case 'steel-stamped':
        mid *= 1.6; // sheet-metal 'tin' mode
        ring *= 0.92;
        duration *= 1.25;
        break;
      case 'steel-milled':
      case 'steel-forged':
        body *= 0.9;
        mid *= 0.95;
        duration *= 0.85;
        break;
      case 'polymer':
        polymer += 0.45;
        mid *= 0.85;
        ring *= 0.8;
        duration *= 1.05;
        break;
    }
    const recipT = clamp(id.reciprocatingMass / 800, 0.1, 1.2);
    return { gain: 0.55 + 0.35 * recipT, body, mid, ring, friction: 0.5, spring: 0.5, polymer, duration };
  }

  private params(id: AcousticIdentity, event: AudioEventId, overrides?: Partial<AudioLayerParams>): AudioLayerParams {
    const p = { ...this.baseParams(id), ...(id.overrides?.[event] ?? {}), ...(overrides ?? {}) };
    return p;
  }

  // ------------------------------------------------------------ public play

  play(event: AudioEventId, identity: AcousticIdentity, opts: PlayOptions = {}): void {
    this.init();
    if (!this.ctx || !this.enabled) {
      this.caption(opts.caption);
      return;
    }
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.002;
    const dest = this.bus(opts.pan ?? 0, opts.distance ?? 0);
    const p = this.params(identity, event, opts.intensity !== undefined ? { gain: this.baseParams(identity).gain * opts.intensity } : undefined);
    const springF = identity.spring.frequency * 18; // audible coil modes
    const heavy = identity.reciprocatingMass > 450;
    this.caption(opts.caption);

    switch (event) {
      case 'charge_pull': {
        switch (identity.action) {
          case 'roller-delayed':
            this.friction(dest, t, 0.09, 950, 1650, 0.3 * p.gain);
            this.strike(dest, t + 0.08, { ...p, gain: p.gain * 0.45, ring: p.ring * 1.1 }, { bounce: false });
            break;
          case 'pump':
            this.strike(dest, t, { ...p, gain: p.gain * 0.5 }, { bounce: false });
            this.friction(dest, t + 0.02, 0.12, 820, 580, 0.42 * p.gain, 3.5);
            this.rattle(dest, t + 0.03, p, 4, 0.1, 0.08 * p.gain);
            break;
          case 'turn-bolt':
            // lift: cam click, then rearward draw
            this.strike(dest, t, { ...p, gain: p.gain * 0.4, ring: p.ring * 1.15 }, { bounce: false, bodyDecay: 0.04 });
            this.friction(dest, t + 0.07, 0.14, 900, 760, 0.34 * p.gain, 5);
            break;
          case 'revolver-da-sa':
            // hammer cock: pawl ratchet then sear engage
            [0, 0.045, 0.09].forEach((dt, i) => this.resonator(dest, t + dt, p.ring * (0.6 + i * 0.08), 22, 0.22 * p.gain, 0.02));
            this.strike(dest, t + 0.16, { ...p, gain: p.gain * 0.55 }, { bounce: false, bodyDecay: 0.05 });
            break;
          case 'short-recoil-tilting-barrel':
          case 'short-recoil-rotating-bolt':
            // slide over frame rails
            this.friction(dest, t, 0.09, 1250, 1900, 0.32 * p.gain, 5.5);
            this.springTwang(dest, t + 0.02, springF, 0.11 * p.gain, 0.06);
            break;
          case 'straight-blowback':
            this.friction(dest, t, 0.1, 900, 1300, 0.34 * p.gain);
            this.strike(dest, t + 0.1, { ...p, gain: p.gain * 0.5, body: p.body * 0.9 }, { bounce: true });
            break;
          default:
            // DI / piston rifles: handle unlatch, carrier drawn over rails, spring compresses
            this.strike(dest, t, { ...p, gain: p.gain * 0.32, ring: p.ring * 1.05 }, { bounce: false, bodyDecay: 0.035 });
            this.friction(dest, t + 0.02, 0.11, 1100, 1500, 0.34 * p.gain);
            this.springTwang(dest, t + 0.05, springF, 0.14 * p.gain * p.spring, 0.09);
            if (heavy) this.rattle(dest, t + 0.04, p, 3, 0.08, 0.06 * p.gain);
        }
        break;
      }
      case 'bolt_release':
        this.resonator(dest, t, p.ring * 0.9, 20, 0.2 * p.gain, 0.02);
        this.friction(dest, t + 0.01, 0.06, 1400, 2200, 0.3 * p.gain);
        break;
      case 'bolt_battery':
      case 'bolt_close':
      case 'pump_forward':
        this.strike(dest, t, { ...p, gain: p.gain * (heavy ? 0.85 : 0.7) }, { bodyDecay: p.duration * 1.3 });
        this.springTwang(dest, t + 0.02, springF * 0.95, 0.12 * p.gain * p.spring, 0.1);
        if (identity.action === 'roller-delayed') this.burst(dest, t - 0.001, 0.012, 3200, 3, 0.35 * p.gain);
        break;
      case 'pump_back':
        this.friction(dest, t, 0.11, 820, 600, 0.4 * p.gain, 3.5);
        this.rattle(dest, t + 0.02, p, 4, 0.1, 0.08 * p.gain);
        break;
      case 'bolt_lift':
        this.strike(dest, t, { ...p, gain: p.gain * 0.4, ring: p.ring * 1.15 }, { bounce: false, bodyDecay: 0.04 });
        break;
      case 'trigger_break':
        this.resonator(dest, t, 3800, 18, 0.24 * p.gain, 0.02);
        this.resonator(dest, t, 950, 12, 0.16 * p.gain, 0.03);
        break;
      case 'trigger_reset':
        this.resonator(dest, t, 4600, 20, 0.2 * p.gain, 0.02);
        this.resonator(dest, t, 1850, 15, 0.12 * p.gain, 0.025);
        break;
      case 'hammer_fall':
      case 'striker_fall': {
        const striker = event === 'striker_fall';
        this.burst(dest, t, 0.002, 5400, 5, 0.26 * p.gain, 'highpass');
        this.strike(dest, t + 0.003, { ...p, gain: p.gain * (striker ? 0.5 : 0.6), ring: p.ring * (striker ? 1.2 : 1.05) }, { bounce: false, bodyDecay: 0.045, ringDecay: 0.03 });
        break;
      }
      case 'mag_release':
        this.resonator(dest, t, 3200, 18, 0.26 * p.gain, 0.025);
        this.resonator(dest, t, 1400, 10, 0.16 * p.gain, 0.03);
        break;
      case 'mag_out':
        this.friction(dest, t, 0.09, 850, 600, 0.22 * p.gain, 3.5);
        if (p.polymer > 0.3) this.burst(dest, t + 0.02, 0.03, 500, 2, 0.2 * p.gain, 'lowpass', 'pink');
        break;
      case 'mag_seat':
        this.friction(dest, t, 0.06, 750, 1200, 0.24 * p.gain);
        this.burst(dest, t + 0.06, 0.012, 140, 1.5, 0.42 * p.gain, 'lowpass');
        this.strike(dest, t + 0.062, { ...p, gain: p.gain * 0.6, polymer: Math.max(p.polymer, 0.35) }, { bounce: false, bodyDecay: 0.07 });
        break;
      case 'selector':
        this.resonator(dest, t, 2600, 20, 0.16 * p.gain, 0.012);
        this.strike(dest, t + 0.004, { ...p, gain: p.gain * 0.35, ring: p.ring * 1.2 }, { bounce: false, bodyDecay: 0.03, ringDecay: 0.02 });
        break;
      case 'casing_eject':
        this.resonator(dest, t, 2900, 16, 0.14 * p.gain, 0.02);
        break;
      case 'casing_floor': {
        // drawn brass on a hard floor: three inharmonic modes, decaying bounces
        const bounces = [0, 0.095, 0.165, 0.215, 0.25];
        bounces.forEach((dt, i) => {
          const amp = 0.3 * Math.pow(0.6, i) * p.gain;
          const bt = t + dt;
          this.resonator(dest, bt, 3820 + i * 60, 32, amp * 0.5, 0.08 * Math.pow(0.85, i));
          this.resonator(dest, bt, 4920 + i * 60, 35, amp * 0.35, 0.06 * Math.pow(0.85, i));
          this.resonator(dest, bt, 6380 + i * 80, 40, amp * 0.25, 0.045 * Math.pow(0.85, i));
          this.burst(dest, bt, 0.003, 4900, 8, amp * 0.3);
        });
        break;
      }
      case 'pin_push':
        this.resonator(dest, t, 4800, 24, 0.3 * p.gain, 0.03);
        this.resonator(dest, t + 0.01, 1250, 12, 0.22 * p.gain, 0.04);
        this.friction(dest, t + 0.012, 0.05, 1600, 1200, 0.16 * p.gain, 6);
        break;
      case 'receiver_split':
        this.strike(dest, t, { ...p, gain: p.gain * 0.45 }, { bounce: true, bodyDecay: 0.08 });
        this.friction(dest, t + 0.03, 0.09, 700, 500, 0.14 * p.gain, 3);
        break;
      case 'component_out':
        this.friction(dest, t, 0.12, 1200, 800, 0.3 * p.gain, 5);
        this.resonator(dest, t + 0.12, 840, 10, 0.18 * p.gain, 0.05);
        break;
      case 'component_seat':
        this.friction(dest, t, 0.1, 800, 1200, 0.28 * p.gain, 5);
        this.strike(dest, t + 0.1, { ...p, gain: p.gain * 0.55 }, { bounce: false, bodyDecay: 0.06 });
        break;
      case 'cylinder_open':
        this.resonator(dest, t, p.ring * 0.7, 20, 0.22 * p.gain, 0.03);
        this.friction(dest, t + 0.02, 0.08, 1100, 900, 0.18 * p.gain, 5);
        this.strike(dest, t + 0.1, { ...p, gain: p.gain * 0.35 }, { bounce: false, bodyDecay: 0.04 });
        break;
      case 'cylinder_index':
        [0, 0.035, 0.07].forEach((dt, i) => this.resonator(dest, t + dt, p.ring * (0.62 + i * 0.07), 24, 0.2 * p.gain, 0.018));
        this.strike(dest, t + 0.11, { ...p, gain: p.gain * 0.4, ring: p.ring * 1.1 }, { bounce: false, bodyDecay: 0.035 });
        break;
      case 'ui_tick':
        this.resonator(dest, t, 2400, 30, 0.06, 0.005);
        break;
      case 'ui_click':
        this.resonator(dest, t, 2200, 16, 0.14, 0.012);
        this.resonator(dest, t, 650, 6, 0.1, 0.018);
        break;
      case 'ui_detent':
        this.resonator(dest, t, 1400 + (opts.intensity ?? 0.5) * 500, 24, 0.12, 0.008);
        break;
    }
  }

  /** UI feedback that does not belong to a firearm. */
  ui(kind: 'tick' | 'click' | 'detent', intensity = 0.5): void {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + 0.001;
    const dest = this.bus(0, 0);
    if (kind === 'tick') this.resonator(dest, t, 2400, 30, 0.05, 0.005);
    else if (kind === 'click') {
      this.resonator(dest, t, 2200, 16, 0.12, 0.012);
      this.resonator(dest, t, 650, 6, 0.09, 0.018);
    } else this.resonator(dest, t, 1400 + intensity * 500, 24, 0.1, 0.008);
  }
}

export const audio = new AudioEngine();

export function haptic(pattern: number | number[]): void {
  try {
    if (!('vibrate' in navigator)) return;
    const nav = navigator as Navigator & { userActivation?: { hasBeenActive: boolean } };
    if (nav.userActivation && !nav.userActivation.hasBeenActive) return;
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

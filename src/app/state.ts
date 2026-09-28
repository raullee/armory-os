import type { AcousticEnvironment } from '@/audio/AudioEngine';
import type { QualityTier } from '@/core/Viewer';

export interface Settings {
  audioEnabled: boolean;
  volume: number;
  environment: AcousticEnvironment;
  captions: boolean;
  gentleAudio: boolean;
  haptics: boolean;
  quality: QualityTier | 'auto';
  reducedMotion: 'auto' | 'on' | 'off';
  lastFirearm: string;
}

const KEY = 'armory-os:settings:v3';

const defaults: Settings = {
  audioEnabled: true,
  volume: 0.8,
  environment: 'studio',
  captions: false,
  gentleAudio: false,
  haptics: true,
  quality: 'auto',
  reducedMotion: 'auto',
  lastFirearm: 'm4a1',
};

type Listener = (s: Settings) => void;

class SettingsStore {
  private value: Settings;
  private listeners: Listener[] = [];

  constructor() {
    let stored: Partial<Settings> = {};
    try {
      stored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    } catch {
      stored = {};
    }
    this.value = { ...defaults, ...stored };
  }

  get(): Settings {
    return this.value;
  }

  set(patch: Partial<Settings>): void {
    this.value = { ...this.value, ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(this.value));
    } catch {
      /* private mode */
    }
    this.listeners.forEach((l) => l(this.value));
  }

  subscribe(l: Listener): () => void {
    this.listeners.push(l);
    return () => (this.listeners = this.listeners.filter((x) => x !== l));
  }

  /** Effective reduced-motion preference. */
  get reducedMotion(): boolean {
    const s = this.value.reducedMotion;
    if (s === 'on') return true;
    if (s === 'off') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  /** Effective quality tier from a cheap device heuristic. */
  get quality(): QualityTier {
    if (this.value.quality !== 'auto') return this.value.quality;
    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|Mobile/i.test(ua);
    const cores = navigator.hardwareConcurrency ?? 4;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    if (mobile && (cores <= 4 || mem <= 3)) return 'low';
    if (mobile || cores <= 4 || mem <= 4) return 'medium';
    return 'high';
  }
}

export const settings = new SettingsStore();

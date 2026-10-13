export type QualityTier = 'high' | 'balanced' | 'low';
export type QualityMode = 'auto' | QualityTier;

const SAMPLE_WINDOW = 60;
const ADJUST_COOLDOWN_MS = 2500;
const DOWNGRADE_AVG_MS = 24;
const UPGRADE_AVG_MS = 14;
const QUALITY_MODE_KEY = 'fc26-quality-mode';

function loadMode(): QualityMode {
  try {
    const raw = window.localStorage.getItem(QUALITY_MODE_KEY);
    if (raw === 'auto' || raw === 'high' || raw === 'balanced' || raw === 'low') return raw;
  } catch { /* storage unavailable */ }
  return 'auto';
}

class PerformanceService {
  private samples: number[] = [];
  private autoTier: QualityTier = 'high';
  private mode: QualityMode = typeof window !== 'undefined' ? loadMode() : 'auto';
  private lastAdjust = 0;

  reportFrame(costMs: number): void {
    if (this.mode !== 'auto') return;
    const safe = Number.isFinite(costMs) && costMs >= 0 ? costMs : 0;
    this.samples.push(safe);
    if (this.samples.length > SAMPLE_WINDOW) this.samples.shift();

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.lastAdjust < ADJUST_COOLDOWN_MS || this.samples.length < SAMPLE_WINDOW / 2) return;

    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    if (avg > DOWNGRADE_AVG_MS && this.autoTier !== 'low') {
      this.autoTier = this.autoTier === 'high' ? 'balanced' : 'low';
      this.lastAdjust = now;
      this.samples.length = 0;
    } else if (avg < UPGRADE_AVG_MS && this.autoTier !== 'high') {
      this.autoTier = this.autoTier === 'low' ? 'balanced' : 'high';
      this.lastAdjust = now;
      this.samples.length = 0;
    }
  }

  setMode(mode: QualityMode): void {
    this.mode = mode;
    this.samples.length = 0;
    try { window.localStorage.setItem(QUALITY_MODE_KEY, mode); } catch { /* ignore */ }
  }

  getMode(): QualityMode {
    return this.mode;
  }

  getTier(): QualityTier {
    return this.mode === 'auto' ? this.autoTier : this.mode;
  }

  getRenderScale(): number {
    const tier = this.getTier();
    if (tier === 'high') return 1;
    return tier === 'balanced' ? 0.8 : 0.65;
  }
}

export const performanceService = new PerformanceService();

export type QualityTier = 'high' | 'balanced' | 'low';

const SAMPLE_WINDOW = 60;
const ADJUST_COOLDOWN_MS = 2500;
const DOWNGRADE_AVG_MS = 24;
const UPGRADE_AVG_MS = 14;

class PerformanceService {
  private samples: number[] = [];
  private tier: QualityTier = 'high';
  private lastAdjust = 0;

  reportFrame(costMs: number): void {
    const safe = Number.isFinite(costMs) && costMs >= 0 ? costMs : 0;
    this.samples.push(safe);
    if (this.samples.length > SAMPLE_WINDOW) this.samples.shift();

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.lastAdjust < ADJUST_COOLDOWN_MS || this.samples.length < SAMPLE_WINDOW / 2) return;

    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    if (avg > DOWNGRADE_AVG_MS && this.tier !== 'low') {
      this.tier = this.tier === 'high' ? 'balanced' : 'low';
      this.lastAdjust = now;
      this.samples.length = 0;
    } else if (avg < UPGRADE_AVG_MS && this.tier !== 'high') {
      this.tier = this.tier === 'low' ? 'balanced' : 'high';
      this.lastAdjust = now;
      this.samples.length = 0;
    }
  }

  getTier(): QualityTier {
    return this.tier;
  }

  getRenderScale(): number {
    if (this.tier === 'high') return 1;
    return this.tier === 'balanced' ? 0.8 : 0.65;
  }
}

export const performanceService = new PerformanceService();

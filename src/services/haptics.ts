class HapticsEngine {
  private enabled = true;

  setEnabled(enabled: boolean) { this.enabled = enabled; }

  pulse(pattern: number | number[]) {
    if (!this.enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    try { navigator.vibrate(pattern); } catch { /* unsupported browser */ }
  }

  kick(power = 0.5) { this.pulse(Math.round(8 + power * 16)); }
  tackle() { this.pulse([10, 18, 24]); }
  goal() { this.pulse([35, 30, 70]); }
  whistle() { this.pulse(18); }
  penalty() { this.pulse([20, 25, 20]); }
}

export const haptics = new HapticsEngine();

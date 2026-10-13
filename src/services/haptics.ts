const HAPTICS_KEY = 'fc26-haptics';

function loadEnabled(): boolean {
  try {
    return window.localStorage.getItem(HAPTICS_KEY) !== '0';
  } catch {
    return true;
  }
}

class HapticsEngine {
  private enabled = typeof window !== 'undefined' ? loadEnabled() : true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try { window.localStorage.setItem(HAPTICS_KEY, enabled ? '1' : '0'); } catch { /* ignore */ }
  }

  isEnabled() { return this.enabled; }

  pulse(pattern: number | number[]) {
    if (!this.enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    try { navigator.vibrate(pattern); } catch { /* unsupported browser */ }
  }

  kick(power = 0.5) { this.pulse(Math.round(8 + power * 16)); }
  tackle() { this.pulse([10, 18, 24]); }
  goal() { this.pulse([35, 30, 70]); }
  whistle() { this.pulse(18); }
  penalty() { this.pulse([20, 25, 20]); }
  uiTap() { this.pulse(6); }
  packReveal(rare = false) { this.pulse(rare ? [25, 40, 25, 40, 90] : [15, 25, 30]); }
}

export const haptics = new HapticsEngine();

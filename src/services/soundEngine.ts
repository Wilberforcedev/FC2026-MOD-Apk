/**
 * Web Audio API Sound Synthesizer for FC 2026 Soccer
 * Works 100% offline without any external assets or network requests.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private crowdSource: AudioBufferSourceNode | null = null;
  private crowdGain: GainNode | null = null;
  private crowdFilter: BiquadFilterNode | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public init() {
    this.initContext();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(muted?: boolean) {
    const next = muted !== undefined ? muted : !this.isMuted;
    this.setMuted(next);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public startCrowdAmbient() {
    this.startStadiumAtmosphere();
  }

  public stopCrowdAmbient() {
    this.stopStadiumAtmosphere();
  }

  /**
   * Continuous procedural ambient stadium crowd generator
   */
  public startStadiumAtmosphere() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.crowdSource) return;

      // 4 seconds stereo loop of filtered pink/brown noise
      const bufferSize = this.ctx.sampleRate * 4;
      const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.95 * b1 + white * 0.08;
          b2 = 0.85 * b2 + white * 0.12;
          data[i] = (b0 + b1 + b2) * 0.25;
        }
      }

      this.crowdSource = this.ctx.createBufferSource();
      this.crowdSource.buffer = buffer;
      this.crowdSource.loop = true;

      this.crowdFilter = this.ctx.createBiquadFilter();
      this.crowdFilter.type = 'lowpass';
      this.crowdFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.crowdGain = this.ctx.createGain();
      this.crowdGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.crowdSource.connect(this.crowdFilter);
      this.crowdFilter.connect(this.crowdGain);
      this.crowdGain.connect(this.masterGain);

      this.crowdSource.start();
    } catch {
      // Audio autoplay policy handled gracefully
    }
  }

  public stopStadiumAtmosphere() {
    if (this.crowdSource) {
      try {
        this.crowdSource.stop();
        this.crowdSource.disconnect();
      } catch {
        // ignore
      }
      this.crowdSource = null;
    }
  }

  /**
   * Modulate crowd excitement dynamically (e.g. ball in box: excitement=1.0)
   */
  public setCrowdExcitement(intensity: number) {
    if (!this.ctx || !this.crowdFilter || !this.crowdGain) return;
    const clamped = Math.max(0, Math.min(1, intensity));
    const targetFreq = 400 + clamped * 1200;
    const targetGain = 0.18 + clamped * 0.35;
    this.crowdFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.2);
    this.crowdGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
  }

  /**
   * Referee Whistle sound
   */
  public playWhistle(type: 'short' | 'double' | 'triple' | 'long' = 'short') {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const playBeep = (startTime: number, duration: number) => {
      if (!this.ctx || !this.masterGain) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(2850, startTime);
      osc2.frequency.setValueAtTime(3200, startTime);

      // Tremolo
      const tremolo = this.ctx.createOscillator();
      const tremoloGain = this.ctx.createGain();
      tremolo.frequency.setValueAtTime(35, startTime);
      tremoloGain.gain.setValueAtTime(40, startTime);
      tremolo.connect(tremoloGain);
      tremoloGain.connect(osc1.frequency);
      tremolo.start(startTime);
      tremolo.stop(startTime + duration);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    };

    const now = this.ctx.currentTime;
    if (type === 'short') {
      playBeep(now, 0.22);
    } else if (type === 'double') {
      playBeep(now, 0.16);
      playBeep(now + 0.22, 0.35);
    } else if (type === 'long') {
      playBeep(now, 0.65);
    } else {
      playBeep(now, 0.16);
      playBeep(now + 0.22, 0.16);
      playBeep(now + 0.44, 0.5);
    }
  }

  /**
   * Ball Kick (Pass or Short Shot)
   */
  public playKick(power: number = 0.5) {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    const startFreq = 160 + power * 90;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

    gain.gain.setValueAtTime(0.1 + power * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * Rocket Power Shot Strike
   */
  public playPowerShot() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  /**
   * Tackling Slide sound
   */
  public playTackle() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.2);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  /**
   * Goal Post / Crossbar metallic ping
   */
  public playPostHit() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(880, now);
    osc2.frequency.setValueAtTime(1320, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  /**
   * Goal Net Ripple / Swish
   */
  public playNetRipple() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  /**
   * Massive Goal Celebration with Horn and Crowd Surge
   */
  public playGoalCelebration() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    this.playWhistle('short');

    // Stadium Horn fanfare chord (F-major / Bb triumph)
    const freqs = [349.23, 440.0, 523.25, 698.46];
    const now = this.ctx.currentTime;

    freqs.forEach((f) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + 0.1);

      g.gain.setValueAtTime(0.001, now + 0.1);
      g.gain.linearRampToValueAtTime(0.12, now + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now + 0.1);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.masterGain);

      osc.start(now + 0.1);
      osc.stop(now + 1.25);
    });

    // Surge crowd excitement
    this.setCrowdExcitement(1.0);
    setTimeout(() => {
      this.setCrowdExcitement(0.3);
    }, 4000);
  }

  /**
   * Crowd Gasp on miss
   */
  public playCrowdGasp() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.45);
    filter.Q.setValueAtTime(2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  /**
   * Crowd gasp on near miss / skill move
   */
  public playGasp() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.linearRampToValueAtTime(750, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }
}

export const soundEngine = new SoundEngine();

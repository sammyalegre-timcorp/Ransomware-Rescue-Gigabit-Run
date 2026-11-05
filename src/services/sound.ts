// Web Audio API procedural sound engine with high-intensity cyber synthwave background music

class CyberSoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private bgmInterval: ReturnType<typeof setInterval> | null = null;
  private bgmStep: number = 0;
  private bgmMasterGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SOUND EFFECTS ---

  public playTap(intensity: number = 0.5) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 380 + Math.min(intensity * 400, 500);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  public playCountdownTick(remaining: number) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + (5 - remaining) * 80, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {}
  }

  public playRaceStart() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [880, 1100, 1320, 1760].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      });
    } catch {}
  }

  public playFinishChime() {
    this.stopBgm(); // Stop race background music when race finishes
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0.25, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    } catch {}
  }

  public playClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  // --- HIGH-INTENSITY PROCEDURAL BACKGROUND MUSIC ---

  public startBgm() {
    if (this.isBgmPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.isBgmPlaying = true;
      this.bgmMasterGain = this.ctx.createGain();
      this.bgmMasterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.ctx.currentTime);
      this.bgmMasterGain.connect(this.ctx.destination);

      // Cyberpunk 16-step bassline & arpeggio scale: D minor (D, F, G, A, C)
      const bassNotes = [
        73.42, 73.42, 146.83, 73.42, // D2, D2, D3, D2
        87.31, 87.31, 174.61, 87.31, // F2, F2, F3, F2
        98.00, 98.00, 196.00, 98.00, // G2, G2, G3, G2
        110.0, 110.0, 220.00, 130.81 // A2, A2, A3, C3
      ];

      const arpNotes = [
        293.66, 349.23, 440.00, 523.25, // D4, F4, A4, C5
        587.33, 523.25, 440.00, 349.23, // D5, C5, A4, F4
        392.00, 440.00, 523.25, 587.33, // G4, A4, C5, D5
        659.25, 587.33, 523.25, 440.00  // E5, D5, C5, A4
      ];

      this.bgmStep = 0;
      const stepDuration = 115; // ~130 BPM on 16th notes

      this.bgmInterval = setInterval(() => {
        if (!this.ctx || !this.bgmMasterGain || this.isMuted) return;

        const now = this.ctx.currentTime;
        const step = this.bgmStep % 16;

        // 1. Synth Kick on beats 0, 4, 8, 12
        if (step % 4 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
          kickGain.gain.setValueAtTime(0.5, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          kickOsc.connect(kickGain);
          kickGain.connect(this.bgmMasterGain);
          kickOsc.start(now);
          kickOsc.stop(now + 0.15);
        }

        // 2. Electronic Snare/Clap on beats 4 and 12
        if (step === 4 || step === 12) {
          const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const whiteNoise = this.ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          const snareFilter = this.ctx.createBiquadFilter();
          snareFilter.type = 'highpass';
          snareFilter.frequency.setValueAtTime(1000, now);
          const snareGain = this.ctx.createGain();
          snareGain.gain.setValueAtTime(0.2, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          whiteNoise.connect(snareFilter);
          snareFilter.connect(snareGain);
          snareGain.connect(this.bgmMasterGain);
          whiteNoise.start(now);
        }

        // 3. Cyber Bass Synth Note on every 16th note
        const bassFreq = bassNotes[step];
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(700, now);
        bassFilter.frequency.exponentialRampToValueAtTime(200, now + 0.1);

        bassGain.gain.setValueAtTime(0.25, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.bgmMasterGain);

        bassOsc.start(now);
        bassOsc.stop(now + 0.1);

        // 4. Arpeggiator Lead Note
        const arpFreq = arpNotes[step];
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();

        arpOsc.type = 'square';
        arpOsc.frequency.setValueAtTime(arpFreq, now);

        arpGain.gain.setValueAtTime(0.08, now);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        arpOsc.connect(arpGain);
        arpGain.connect(this.bgmMasterGain);

        arpOsc.start(now);
        arpOsc.stop(now + 0.09);

        this.bgmStep++;
      }, stepDuration);
    } catch {}
  }

  public stopBgm() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmMasterGain && this.ctx) {
      try {
        this.bgmMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
    }
    this.isBgmPlaying = false;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmMasterGain && this.ctx) {
      try {
        this.bgmMasterGain.gain.setValueAtTime(muted ? 0 : 0.22, this.ctx.currentTime);
      } catch {}
    }
  }
}

export const soundEngine = new CyberSoundEngine();

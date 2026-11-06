/**
 * Procedural Web Audio Sound Generator
 * Generates organic chimes, tactile clicks, and romantic music box melodies.
 * 100% synthesized in real time via Web Audio API - zero external assets.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // start muted by default to respect browser autoplay policies
    this.initialized = false;
    this.isPlayingMelody = false;
    this.melodyTimer = null;
    this.melodyStep = 0;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  toggleMute() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.startRomanticMelody();
      this.playChime(523.25, 'sine', 0.2, 1.5);
    } else {
      this.stopRomanticMelody();
    }
    return this.isMuted;
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playHeartBurst() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Harmonic romantic chime chord (C major 9 / F major 7 warm love chord)
    const chord = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5
    chord.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 'sine', 0.15, 1.6);
      }, idx * 45);
    });
  }

  playBloomChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [329.63, 392.00, 493.88, 587.33, 659.25];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 'sine', 0.2, 1.2);
      }, idx * 60);
    });
  }

  playTransformSound() {
    this.playHeartBurst();
  }

  playChime(freq, type = 'sine', volume = 0.15, duration = 1.2) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * Delicate Music Box Romantic Melody (Canon / Lullaby pattern)
   */
  startRomanticMelody() {
    if (this.isPlayingMelody || !this.ctx) return;
    this.isPlayingMelody = true;

    // Soft romantic arpeggio notes (Frequencies in Hz)
    const melody = [
      523.25, 659.25, 783.99, 659.25, // C5, E5, G5, E5
      493.88, 587.33, 783.99, 587.33, // B4, D5, G5, D5
      440.00, 523.25, 659.25, 523.25, // A4, C5, E5, C5
      392.00, 493.88, 587.33, 493.88, // G4, B4, D5, B4
      349.23, 440.00, 523.25, 440.00, // F4, A4, C5, A4
      329.63, 392.00, 523.25, 392.00  // E4, G4, C5, G4
    ];

    const playNext = () => {
      if (!this.isPlayingMelody || this.isMuted) return;
      const freq = melody[this.melodyStep % melody.length];
      this.melodyStep++;

      // Warm music box bell tone
      this.playChime(freq, 'sine', 0.1, 1.4);

      // Octave bass note on downbeat
      if (this.melodyStep % 4 === 1) {
        this.playChime(freq / 2, 'triangle', 0.08, 2.0);
      }

      this.melodyTimer = setTimeout(playNext, 450);
    };

    playNext();
  }

  stopRomanticMelody() {
    this.isPlayingMelody = false;
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
  }
}

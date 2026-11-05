/**
 * Procedural Web Audio Sound Generator
 * Generates organic chimes, tactile clicks, and ambient synthesizer tones.
 * 100% synthesized in real time via Web Audio API - zero external assets.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // start muted by default to respect browser autoplay policies
    this.initialized = false;
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
      this.playChime(523.25, 'sine', 0.15); // C5 chime to confirm un-mute
    }
    return this.isMuted;
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Organic tactile click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playBloomChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Pentatonic ascending chime (E minor / botanical harmonics)
    const notes = [329.63, 392.00, 493.88, 587.33, 659.25]; // E4, G4, B4, D5, E5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 'sine', 0.25, 1.2);
      }, idx * 60);
    });
  }

  playTransformSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Shimmering digital-to-organic sweep
    const notes = [440, 554.37, 659.25, 830.61]; // A, C#, E, G#
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChime(freq, 'triangle', 0.18, 0.8);
      }, idx * 45);
    });
  }

  playChime(freq, type = 'sine', volume = 0.2, duration = 1.0) {
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
}

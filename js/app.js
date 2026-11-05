/**
 * A Seamless Love Experience
 * Scene 1: The ASCII Knight with Sealed Envelope Letter ("FOR YOU") in front
 * Interaction: Touch the letter -> Letter bursts with sparks and burns open with cellular fire simulation
 * Scene 2: Combined 3D Blooming Crimson Rose & Ivory Lily with golden fireflies & multilingual love words
 * Scene 3: Dreamy Floating Cloud Love Note for Kaushal & His Love
 */

import { AmbientParticles } from './ambient-particles.js';
import { AsciiKnight } from './ascii-knight.js';
import { AsciiEnvelope } from './ascii-envelope.js';
import { AsciiBouquet } from './ascii-bouquet.js';
import { AudioManager } from './audio-fx.js';

class LiveAsciiLoveApp {
  constructor() {
    this.currentScreen = 'knight'; // 'knight' or 'bouquet'
    this.isTransitioning = false;

    this.initElements();
    this.initAmbientParticles();
    this.initAudio();
    this.initRenderers();
    this.initInteractions();
    this.start();
  }

  initElements() {
    this.ambientCanvas = document.getElementById('ambient-canvas');
    this.knightScreen = document.getElementById('knight-screen');
    this.bouquetScreen = document.getElementById('bouquet-screen');

    this.knightCanvas = document.getElementById('knight-canvas');
    this.envelopeCanvas = document.getElementById('envelope-canvas');
    this.knightHint = document.getElementById('knight-hint');

    this.bouquetCanvas = document.getElementById('bouquet-canvas');
    this.cloudNote = document.getElementById('cloud-note');
    this.replayBtn = document.getElementById('btn-replay');
  }

  initAmbientParticles() {
    if (!this.ambientCanvas) return;
    this.ambientParticles = new AmbientParticles(this.ambientCanvas);
  }

  initAudio() {
    this.audioManager = new AudioManager();
  }

  initRenderers() {
    // 1. Knight background renderer
    if (this.knightCanvas) {
      this.knightRenderer = new AsciiKnight(this.knightCanvas);
    }

    // 2. Foreground Sealed Envelope with Burning / Opening physics
    if (this.envelopeCanvas) {
      this.envelopeRenderer = new AsciiEnvelope(this.envelopeCanvas, () => {
        // When envelope has completely burned away, transition to the blooming flowers!
        this.transitionToFlowers();
      });
    }

    // 3. Combined 3D Rose & Lily Bouquet
    if (this.bouquetCanvas) {
      this.bouquetRenderer = new AsciiBouquet(this.bouquetCanvas, () => {
        // When 3D Rose & Lily reach full bloom (~4.5s), pop up the Cloud Love Note!
        if (this.cloudNote) {
          this.cloudNote.classList.add('visible');
        }
      });
    }
  }

  initInteractions() {
    // Click or touch letter to open / burn
    const handleLetterOpen = () => {
      if (this.currentScreen !== 'knight' || this.isTransitioning) return;

      // 1. Play warm harmonic chime
      try {
        this.audioManager.init();
        this.audioManager.playHeartBurst();
      } catch (e) {}

      // 2. Hide hint text
      if (this.knightHint) {
        this.knightHint.style.opacity = '0';
        this.knightHint.style.pointerEvents = 'none';
      }

      // 3. Trigger envelope bursting & cellular fire simulation
      if (this.envelopeRenderer) {
        this.envelopeRenderer.triggerClick();
      }
    };

    // Attach click handlers
    if (this.envelopeCanvas) {
      this.envelopeCanvas.addEventListener('click', handleLetterOpen);
      this.envelopeCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleLetterOpen();
      }, { passive: false });
    }

    if (this.knightCanvas) {
      this.knightCanvas.addEventListener('click', handleLetterOpen);
    }

    if (this.knightHint) {
      this.knightHint.addEventListener('click', handleLetterOpen);
    }

    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && this.currentScreen === 'knight') {
        e.preventDefault();
        handleLetterOpen();
      }
    });

    // Handle resize
    window.addEventListener('resize', () => {
      if (this.envelopeRenderer) {
        this.envelopeRenderer.resize();
      }
    });

    // Replay interaction: return to knight + sealed letter
    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.restartExperience();
      });
    }
  }

  transitionToFlowers() {
    if (this.isTransitioning || this.currentScreen === 'bouquet') return;
    this.isTransitioning = true;
    this.currentScreen = 'bouquet';

    // Romantic chime on flower bloom
    try {
      this.audioManager.playBloomChime();
    } catch (e) {}

    // 1. Smoothly fade out knight screen
    if (this.knightScreen) {
      this.knightScreen.classList.remove('active');
    }

    setTimeout(() => {
      if (this.knightRenderer) this.knightRenderer.stop();
      if (this.envelopeRenderer) this.envelopeRenderer.stop();

      // 2. Smoothly fade in bouquet screen & start 3D Rose & Lily bloom
      if (this.bouquetScreen) {
        this.bouquetScreen.classList.add('active');
      }
      if (this.cloudNote) {
        this.cloudNote.classList.remove('visible');
      }
      if (this.bouquetRenderer) {
        this.bouquetRenderer.reset();
        this.bouquetRenderer.start();
      }
      this.isTransitioning = false;
    }, 600);
  }

  restartExperience() {
    this.isTransitioning = true;
    this.currentScreen = 'knight';

    if (this.cloudNote) {
      this.cloudNote.classList.remove('visible');
    }
    if (this.bouquetScreen) {
      this.bouquetScreen.classList.remove('active');
    }

    setTimeout(() => {
      if (this.bouquetRenderer) {
        this.bouquetRenderer.stop();
      }

      // Reset envelope and knight
      if (this.envelopeRenderer) {
        this.envelopeRenderer.reset();
      }
      if (this.knightHint) {
        this.knightHint.style.opacity = '';
        this.knightHint.style.pointerEvents = '';
      }

      if (this.knightScreen) {
        this.knightScreen.classList.add('active');
      }

      if (this.knightRenderer) {
        this.knightRenderer.start();
      }
      if (this.envelopeRenderer) {
        this.envelopeRenderer.start();
      }

      this.isTransitioning = false;
    }, 600);
  }

  start() {
    // 1. Start ambient drifting stardust & petals
    let lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (this.ambientParticles) {
        this.ambientParticles.update(dt);
        this.ambientParticles.render();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // 2. Start Scene 1: Knight in background + Sealed Letter in foreground
    if (this.knightRenderer) {
      this.knightRenderer.start();
    }
    if (this.envelopeRenderer) {
      this.envelopeRenderer.start();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new LiveAsciiLoveApp();
});

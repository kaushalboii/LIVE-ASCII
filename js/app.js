/**
 * A Minimal & Soft Love Experience
 * Screen 1: ASCII Knight with Flowing Red Cloak (from GIVEAWAY-ASCII)
 * Screen 2: 3D Blooming Rose & Lily Bouquet with Golden Fireflies (from GIVEAWAY-ASCII)
 * + Dreamy Floating Cloud Love Note for Kaushal & His Love
 */

import { AmbientParticles } from './ambient-particles.js';
import { AsciiKnight } from './ascii-knight.js';
import { AsciiBouquet } from './ascii-bouquet.js';
import { AudioManager } from './audio-fx.js';

class MinimalLoveRoseApp {
  constructor() {
    this.currentScreen = 'knight'; // 'knight' or 'bouquet'
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
    if (this.knightCanvas) {
      this.knightRenderer = new AsciiKnight(this.knightCanvas);
    }

    if (this.bouquetCanvas) {
      this.bouquetRenderer = new AsciiBouquet(this.bouquetCanvas, () => {
        // When 3D bouquet reaches full bloom, pop up the Cloud Love Note!
        if (this.cloudNote) {
          this.cloudNote.classList.add('visible');
        }
      });
    }
  }

  initInteractions() {
    const showBouquet = () => {
      if (this.currentScreen === 'bouquet') return;
      this.currentScreen = 'bouquet';

      // 1. Play romantic harmonic chime
      try {
        this.audioManager.init();
        this.audioManager.playChime(523.25, 'sine', 0.16, 2.5); // C5 harmonic chime
      } catch (e) {}

      // 2. Smoothly fade out knight screen
      if (this.knightScreen) {
        this.knightScreen.classList.remove('active');
      }

      setTimeout(() => {
        if (this.knightRenderer) {
          this.knightRenderer.stop();
        }

        // 3. Smoothly fade in bouquet screen & start 3D bouquet bloom
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
      }, 500);
    };

    // Click anywhere on knight screen or hint
    if (this.knightCanvas) {
      this.knightCanvas.addEventListener('click', showBouquet);
    }
    if (this.knightHint) {
      this.knightHint.addEventListener('click', showBouquet);
    }
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && this.currentScreen === 'knight') {
        e.preventDefault();
        showBouquet();
      }
    });

    // Replay interaction: return to knight
    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
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
          if (this.knightScreen) {
            this.knightScreen.classList.add('active');
          }
          if (this.knightRenderer) {
            this.knightRenderer.start();
          }
        }, 500);
      });
    }
  }

  start() {
    // Start ambient drifting petals
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

    // Start Screen 1 (Knight)
    if (this.knightRenderer) {
      this.knightRenderer.start();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new MinimalLoveRoseApp();
});

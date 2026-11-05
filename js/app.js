/**
 * A Minimal & Soft Love Rose
 * With After Effects Style ASCII Hand Gesture & Ambient Flank Petals
 * Pure seamless visuals on pitch black (#000000) — no boxes, no cards, no borders.
 */

import { AmbientParticles } from './ambient-particles.js';
import { AsciiHandRenderer } from './ascii-hand.js';
import { RoseSimulator } from './rose-sim.js';
import { AsciiEngine } from './ascii-engine.js';
import { AudioManager } from './audio-fx.js';

class MinimalLoveRoseApp {
  constructor() {
    this.currentScreen = 'hand'; // 'hand' or 'rose'
    this.initElements();
    this.initAmbientParticles();
    this.initHandRenderer();
    this.initRoseEngines();
    this.initInteractions();
    this.startLoop();
  }

  initElements() {
    this.ambientCanvas = document.getElementById('ambient-canvas');
    this.handScreen = document.getElementById('hand-screen');
    this.roseScreen = document.getElementById('rose-screen');
    this.handTrigger = document.getElementById('hand-trigger');
    this.handCanvas = document.getElementById('hand-canvas');
    this.whisperHint = document.querySelector('.whisper-hint');
    this.displayCanvas = document.getElementById('rose-canvas');
    this.replayBtn = document.getElementById('btn-replay');

    // Offscreen canvas for rendering the realistic rose before ASCII conversion
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 680;
    this.offscreenCanvas.height = 680;

    if (this.displayCanvas) {
      this.displayCanvas.width = 680;
      this.displayCanvas.height = 680;
    }
  }

  initAmbientParticles() {
    if (!this.ambientCanvas) return;
    this.ambientParticles = new AmbientParticles(this.ambientCanvas);
  }

  initHandRenderer() {
    if (!this.handCanvas) return;
    this.handRenderer = new AsciiHandRenderer(this.handCanvas);

    // Track mouse hover on hand
    if (this.handTrigger) {
      this.handTrigger.addEventListener('mouseenter', () => {
        if (this.handRenderer) this.handRenderer.isHovered = true;
      });
      this.handTrigger.addEventListener('mouseleave', () => {
        if (this.handRenderer) this.handRenderer.isHovered = false;
      });
    }
  }

  initRoseEngines() {
    this.audioManager = new AudioManager();

    // 1. Photorealistic botanical blooming rose
    this.roseSim = new RoseSimulator(this.offscreenCanvas);
    this.roseSim.speed = 0.07; // Calm, tender blooming speed
    this.roseSim.isPlaying = true;
    this.roseSim.loopMode = 'pingpong';
    this.roseSim.colorScheme = 'crimson';

    // 2. High-performance colored ASCII engine with luminous velvety glow
    this.asciiEngine = new AsciiEngine({
      columns: 96,
      charSet: 'standard',
      colorMode: 'crimsonglow',
      brightness: 1.25,
      contrast: 1.30,
      glow: true // Soft radiant velvety glow for rich visibility on large screens
    });
  }

  initInteractions() {
    const showRose = () => {
      if (this.currentScreen === 'rose') return;
      this.currentScreen = 'rose';

      // 1. Trigger impact tap & double shockwave on hand canvas
      if (this.handRenderer) {
        this.handRenderer.triggerClick();
      }

      // 2. Play romantic harmonic chime
      try {
        this.audioManager.init();
        this.audioManager.playChime(523.25, 'sine', 0.16, 2.5); // C5 harmonic chime
      } catch (e) {}

      // 3. Smoothly fade out hand gesture screen after click impact
      setTimeout(() => {
        if (this.handScreen) {
          this.handScreen.classList.remove('active');
        }

        // 4. Smoothly fade in rose screen
        setTimeout(() => {
          if (this.roseScreen) {
            this.roseScreen.classList.add('active');
          }
          if (this.roseSim) {
            this.roseSim.setBloomProgress(0); // Gracefully blossom from tight bud
            this.roseSim.isPlaying = true;
          }
        }, 380);
      }, 260);
    };

    if (this.handTrigger) {
      this.handTrigger.addEventListener('click', showRose);
      this.handTrigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showRose();
        }
      });
    }

    if (this.whisperHint) {
      this.whisperHint.addEventListener('click', showRose);
    }

    // Replay interaction
    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentScreen = 'hand';
        if (this.roseScreen) {
          this.roseScreen.classList.remove('active');
        }
        setTimeout(() => {
          if (this.handScreen) {
            this.handScreen.classList.add('active');
          }
        }, 380);
      });
    }

    // Gentle ripple/touch on rose canvas
    if (this.displayCanvas) {
      this.displayCanvas.addEventListener('click', () => {
        if (this.currentScreen === 'rose' && this.roseSim) {
          try {
            this.audioManager.playChime(659.25, 'sine', 0.09, 1.8); // E5 gentle chime
          } catch (e) {}
          this.roseSim.bloomProgress = (this.roseSim.bloomProgress + 0.22) % 1.0;
        }
      });
    }
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Always update & render ambient drifting petals on desktop flanks
      if (this.ambientParticles) {
        this.ambientParticles.update(dt);
        this.ambientParticles.render();
      }

      // 2. When hand screen is active, animate the continuous After Effects hand & button
      if (this.currentScreen === 'hand' && this.handRenderer) {
        this.handRenderer.update(dt);
        this.handRenderer.render();
      }

      // 3. When rose screen is active, simulate and blit ASCII frame
      if (this.currentScreen === 'rose' && this.roseSim && this.asciiEngine && this.displayCanvas) {
        this.roseSim.update(dt);
        this.roseSim.render();

        const frameData = this.asciiEngine.processFrame(this.offscreenCanvas);
        this.asciiEngine.renderToCanvas(this.displayCanvas, frameData);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new MinimalLoveRoseApp();
});

/**
 * A Seamless Love Experience
 * Scene 1: The ASCII Knight (on the right) + Sealed Envelope ("FOR YOU", in bottom-left) + Quote
 * Interaction: Touch the letter -> Letter bursts with sparks and burns open
 * Scene 2: The Multilingual Love Heart (with Tamil & global languages) builds in center
 * Scene 3: Heart glides to top-left corner -> Pure Mathematical ASCII Rose blooms in center with light rays
 * Scene 4: Dreamy Floating Cloud Love Note for Kaushal & His Love
 */

import { AmbientParticles } from './ambient-particles.js';
import { AsciiKnight } from './ascii-knight.js';
import { AsciiEnvelope } from './ascii-envelope.js';
import { AsciiHeart } from './ascii-heart.js';
import { AsciiRose } from './ascii-rose.js';
import { AudioManager } from './audio-fx.js';

class LiveAsciiLoveApp {
  constructor() {
    this.currentScreen = 'knight'; // 'knight' or 'flower'
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
    this.flowerScreen = document.getElementById('flower-screen');

    this.knightCanvas = document.getElementById('knight-canvas');
    this.envelopeCanvas = document.getElementById('envelope-canvas');
    this.knightHint = document.getElementById('knight-hint');

    this.heartCanvas = document.getElementById('heart-canvas');
    this.roseCanvas = document.getElementById('rose-canvas');
    this.cloudNote = document.getElementById('cloud-note');
    this.cornerSignature = document.getElementById('corner-signature');
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
    // 1. Knight on the right side
    if (this.knightCanvas) {
      this.knightRenderer = new AsciiKnight(this.knightCanvas);
    }

    // 2. Sealed Envelope in bottom-left
    if (this.envelopeCanvas) {
      this.envelopeRenderer = new AsciiEnvelope(this.envelopeCanvas, () => {
        // When envelope completes burning open, transition to the Multilingual Heart!
        this.transitionToHeart();
      });
    }

    // 3. Multilingual Love Heart (Tamil + all languages)
    if (this.heartCanvas) {
      this.heartRenderer = new AsciiHeart(this.heartCanvas, () => {
        // When heart finishes building and glides to corner, bloom the pure ASCII Rose!
        this.bloomRose();
      });
    }

    // 4. Living Colored ASCII Rose (Blooms organically, then unfurls into 2 roses)
    if (this.roseCanvas) {
      this.roseRenderer = new AsciiRose(this.roseCanvas, () => {
        // When Rose completes blooming duo roses, ensure Note & Signature are visible!
        if (this.cloudNote) {
          this.cloudNote.classList.add('visible');
        }
        if (this.cornerSignature) {
          this.cornerSignature.classList.add('visible');
        }
      });
    }
  }

  initInteractions() {
    const handleLetterOpen = () => {
      if (this.currentScreen !== 'knight' || this.isTransitioning) return;

      // 1. Play warm harmonic love chime
      try {
        this.audioManager.init();
        this.audioManager.playHeartBurst();
      } catch (e) {}

      // 2. Hide hint and quote gently
      if (this.knightHint) {
        this.knightHint.style.opacity = '0';
        this.knightHint.style.pointerEvents = 'none';
      }

      // 3. Trigger envelope ignition in bottom-left
      if (this.envelopeRenderer) {
        this.envelopeRenderer.triggerClick();
      }
    };

    // Attach click / touch handlers
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

    // Tap flower screen during heart build to fast-forward to roses
    if (this.flowerScreen) {
      this.flowerScreen.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'btn-replay' || e.target.closest('#btn-replay'))) return;
        if (this.heartRenderer && !this.heartRenderer.isDocked) {
          this.heartRenderer.fastForward();
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && this.currentScreen === 'knight') {
        e.preventDefault();
        handleLetterOpen();
      }
    });

    window.addEventListener('resize', () => {
      if (this.knightRenderer) this.knightRenderer.resize();
      if (this.envelopeRenderer) this.envelopeRenderer.resize();
      if (this.heartRenderer) this.heartRenderer.resize();
      if (this.roseRenderer) this.roseRenderer.resize();
    });

    // Replay interaction
    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.restartExperience();
      });
    }
  }

  transitionToHeart() {
    if (this.isTransitioning || this.currentScreen === 'flower') return;
    this.isTransitioning = true;
    this.currentScreen = 'flower';

    try {
      this.audioManager.playBloomChime();
    } catch (e) {}

    // 1. Fade out knight screen
    if (this.knightScreen) {
      this.knightScreen.classList.remove('active');
    }

    setTimeout(() => {
      if (this.knightRenderer) this.knightRenderer.stop();
      if (this.envelopeRenderer) this.envelopeRenderer.stop();

      // 2. Fade in flower screen
      if (this.flowerScreen) {
        this.flowerScreen.classList.add('active');
      }
      if (this.cloudNote) {
        this.cloudNote.classList.remove('visible');
      }
      if (this.cornerSignature) {
        this.cornerSignature.classList.remove('visible');
      }

      // 3. Start Multilingual Love Heart in center
      if (this.heartRenderer) {
        this.heartRenderer.reset();
        this.heartRenderer.start();
      }

      this.isTransitioning = false;
    }, 600);
  }

  bloomRose() {
    // When the Multilingual Heart glides to the left edge as a logo:
    try {
      this.audioManager.playBloomChime();
    } catch (e) {}

    // 1. Bloom the realistic ASCII Rose in center (Blooms 1st rose, then unfurls 2 intertwined roses)
    if (this.roseRenderer) {
      this.roseRenderer.reset();
      this.roseRenderer.start();
    }

    // 2. Reveal the minimal love note card & signature right after!
    setTimeout(() => {
      if (this.cloudNote) {
        this.cloudNote.classList.add('visible');
      }
      if (this.cornerSignature) {
        this.cornerSignature.classList.add('visible');
      }
    }, 500);
  }

  restartExperience() {
    this.isTransitioning = true;
    this.currentScreen = 'knight';

    if (this.cloudNote) {
      this.cloudNote.classList.remove('visible');
    }
    if (this.cornerSignature) {
      this.cornerSignature.classList.remove('visible');
    }
    if (this.flowerScreen) {
      this.flowerScreen.classList.remove('active');
    }

    setTimeout(() => {
      if (this.roseRenderer) this.roseRenderer.stop();
      if (this.heartRenderer) this.heartRenderer.stop();

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
    // Start ambient drifting petals & stardust
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

    // Start Scene 1: Knight on right + Letter in bottom-left
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

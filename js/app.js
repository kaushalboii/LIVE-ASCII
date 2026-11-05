/**
 * A Minimal & Soft Love Rose
 * With After Effects Style ASCII Hand Gesture (From Reference Video)
 * Clean, poetic, elegant and quiet intimacy.
 */

import { AsciiHandRenderer } from './ascii-hand.js';
import { RoseSimulator } from './rose-sim.js';
import { AsciiEngine } from './ascii-engine.js';
import { AudioManager } from './audio-fx.js';

class MinimalLoveRoseApp {
  constructor() {
    this.currentScreen = 'intro'; // 'intro' or 'rose'
    this.initCanvases();
    this.initEngines();
    this.initAmbientParticles();
    this.initInteraction();
    this.startLoop();
  }

  initCanvases() {
    // 1. Hand Canvas
    this.handCanvas = document.getElementById('hand-canvas');

    // 2. Offscreen photoreal rose canvas
    this.realCanvas = document.createElement('canvas');
    this.realCanvas.width = 700;
    this.realCanvas.height = 700;

    // 3. Rose display canvas
    this.displayCanvas = document.getElementById('rose-canvas');
    this.displayCanvas.width = 700;
    this.displayCanvas.height = 700;
  }

  initEngines() {
    this.audioManager = new AudioManager();

    // 1. Exact ASCII Hand Gesture from reference video
    if (this.handCanvas) {
      this.handRenderer = new AsciiHandRenderer(this.handCanvas);
    }

    // 2. Blooming Rose Simulation
    this.roseSim = new RoseSimulator(this.realCanvas);
    this.roseSim.speed = 0.06; // calm, unhurried blooming pace
    this.roseSim.isPlaying = true;
    this.roseSim.loopMode = 'pingpong';

    // 3. Soft colored ASCII engine
    this.asciiEngine = new AsciiEngine({
      columns: 95,
      charSet: 'standard',
      colorMode: 'crimsonglow',
      glow: false // soft matte appearance, no harsh bloom
    });
  }

  initInteraction() {
    const introScreen = document.getElementById('intro-screen');
    const roseScreen = document.getElementById('rose-screen');
    const trigger = document.getElementById('hand-trigger');
    const replayBtn = document.getElementById('btn-replay');
    const soundBtn = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');

    if (trigger && this.handRenderer) {
      trigger.addEventListener('mouseenter', () => {
        this.handRenderer.isHovered = true;
      });
      trigger.addEventListener('mouseleave', () => {
        this.handRenderer.isHovered = false;
      });
    }

    const showRose = () => {
      if (this.currentScreen === 'rose') return;

      // 1. Trigger hand finger tap down animation
      if (this.handRenderer) {
        this.handRenderer.triggerClick();
      }

      // 2. Soft chime
      this.audioManager.init();
      this.audioManager.playChime(523.25, 'sine', 0.12, 2.0);

      // 3. Graceful fade transition after finger tap
      setTimeout(() => {
        this.currentScreen = 'rose';
        introScreen.classList.remove('active');
        setTimeout(() => {
          roseScreen.classList.add('active');
          this.roseSim.setBloomProgress(0); // bloom gracefully
        }, 300);
      }, 200);
    };

    if (trigger) {
      trigger.addEventListener('click', showRose);
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') showRose();
      });
    }

    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        this.currentScreen = 'intro';
        roseScreen.classList.remove('active');
        setTimeout(() => {
          introScreen.classList.add('active');
        }, 300);
      });
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = this.audioManager.toggleMute();
        soundIcon.innerHTML = isMuted ? 'sound &bull; off' : 'sound &bull; on';
        soundBtn.classList.toggle('active', !isMuted);
      });
    }
  }

  initAmbientParticles() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const count = 20;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 1 + Math.random() * 2,
        speedX: -0.2 + Math.random() * 0.4,
        speedY: 0.3 + Math.random() * 0.6,
        alpha: 0.1 + Math.random() * 0.25
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 29, 72, ${p.alpha})`;
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(animate);
    };

    animate();
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Screen 1: Render the animated ASCII Hand
      if (this.currentScreen === 'intro' && this.handRenderer) {
        this.handRenderer.update(dt);
        this.handRenderer.render();
      }

      // Screen 2: Render the living colored ASCII rose
      if (this.currentScreen === 'rose') {
        this.roseSim.update(dt);
        this.roseSim.render();

        const frameData = this.asciiEngine.processFrame(this.realCanvas);
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

/**
 * A Minimal & Soft Love Rose
 * Clean, poetic, elegant and quiet intimacy.
 */

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
    // Offscreen photoreal rose canvas
    this.realCanvas = document.createElement('canvas');
    this.realCanvas.width = 700;
    this.realCanvas.height = 700;

    // Display canvas
    this.displayCanvas = document.getElementById('rose-canvas');
    this.displayCanvas.width = 700;
    this.displayCanvas.height = 700;
  }

  initEngines() {
    this.audioManager = new AudioManager();
    this.roseSim = new RoseSimulator(this.realCanvas);
    this.roseSim.speed = 0.06; // calm, unhurried blooming pace
    this.roseSim.isPlaying = true;
    this.roseSim.loopMode = 'pingpong';

    // Soft colored ASCII engine
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
    const trigger = document.getElementById('trigger-bloom');
    const replayBtn = document.getElementById('btn-replay');
    const soundBtn = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');

    const showRose = () => {
      if (this.currentScreen === 'rose') return;
      this.currentScreen = 'rose';

      // Soft chime
      this.audioManager.init();
      this.audioManager.playChime(523.25, 'sine', 0.12, 2.0);

      // Smooth fade transition
      introScreen.classList.remove('active');
      setTimeout(() => {
        roseScreen.classList.add('active');
        this.roseSim.setBloomProgress(0); // bloom gracefully
      }, 300);
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

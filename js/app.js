/**
 * A Rose For You 🌹 — Pure ASCII Love Gift
 * 1. Screen 1: The 2D ASCII Hand ("Click to show the love")
 * 2. On Click: Floating hearts burst, music box melody starts.
 * 3. Screen 2: Living Colored ASCII Rose blooms with a small intimate love note.
 */

import { RoseSimulator } from './rose-sim.js';
import { AsciiEngine } from './ascii-engine.js';
import { AudioManager } from './audio-fx.js';

class PureAsciiLoveRoseApp {
  constructor() {
    this.currentScreen = 'hand'; // 'hand' or 'rose'
    this.initCanvases();
    this.initEngines();
    this.initAmbientPetals();
    this.initLoveNote();
    this.initTransitions();
    this.startLoop();
  }

  initCanvases() {
    // Offscreen Real Rose simulation canvas (800x800)
    this.realCanvas = document.createElement('canvas');
    this.realCanvas.width = 800;
    this.realCanvas.height = 800;

    // Hero display canvas
    this.displayCanvas = document.getElementById('hero-canvas');
    this.displayCanvas.width = 800;
    this.displayCanvas.height = 800;
  }

  initEngines() {
    this.audioManager = new AudioManager();
    this.roseSim = new RoseSimulator(this.realCanvas);
    this.roseSim.speed = 0.08;
    this.roseSim.isPlaying = true;
    this.roseSim.loopMode = 'pingpong'; // blooms and closes continuously

    // Living Colored ASCII Engine
    this.asciiEngine = new AsciiEngine({
      columns: 110,
      charSet: 'standard',
      colorMode: 'crimsonglow', // Velvet Crimson radiance
      glow: true
    });
  }

  initTransitions() {
    const handScreen = document.getElementById('ascii-hand-screen');
    const roseScreen = document.getElementById('rose-love-screen');
    const handTrigger = document.getElementById('ascii-hand-trigger');
    const showLoveBtn = document.getElementById('btn-show-love');
    const replayBtn = document.getElementById('btn-replay-hand');
    const audioBtn = document.getElementById('btn-audio-toggle');
    const musicLabel = document.getElementById('music-label');

    const showRose = () => {
      this.currentScreen = 'rose';

      // 1. Play heart burst sound and start sweet melody
      this.audioManager.init();
      this.audioManager.toggleMute();
      if (musicLabel) musicLabel.textContent = 'Pause';
      if (audioBtn) audioBtn.classList.add('active');
      this.audioManager.playHeartBurst();

      // 2. Switch screens
      if (handScreen) handScreen.classList.remove('active');
      if (roseScreen) {
        roseScreen.classList.add('active');
        this.roseSim.setBloomProgress(0); // bloom from bud
      }

      this.showToast('With all my love... 💖');
    };

    if (handTrigger) handTrigger.addEventListener('click', showRose);
    if (showLoveBtn) showLoveBtn.addEventListener('click', showRose);

    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        this.currentScreen = 'hand';
        if (roseScreen) roseScreen.classList.remove('active');
        if (handScreen) handScreen.classList.add('active');
        this.audioManager.playClick();
      });
    }

    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = this.audioManager.toggleMute();
        if (musicLabel) {
          musicLabel.textContent = isMuted ? 'Music' : 'Pause';
        }
        audioBtn.classList.toggle('active', !isMuted);
      });
    }
  }

  initAmbientPetals() {
    const canvas = document.getElementById('ambient-petals-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const petals = [];
    const count = Math.min(26, Math.floor(window.innerWidth / 50));

    for (let i = 0; i < count; i++) {
      petals.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 8 + Math.random() * 12,
        speedX: -0.4 + Math.random() * 0.8,
        speedY: 0.5 + Math.random() * 1.1,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        alpha: 0.15 + Math.random() * 0.35
      });
    }

    const animatePetals = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let p of petals) {
        p.x += p.speedX + Math.sin(p.angle) * 0.3;
        p.y += p.speedY;
        p.angle += p.rotSpeed;

        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.alpha;

        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-p.size * 0.8, -p.size * 0.6, -p.size, p.size * 0.4, 0, p.size);
        ctx.bezierCurveTo(p.size, p.size * 0.4, p.size * 0.8, -p.size * 0.6, 0, 0);
        ctx.fill();

        ctx.restore();
      }

      requestAnimationFrame(animatePetals);
    };

    animatePetals();
  }

  initLoveNote() {
    const params = new URLSearchParams(window.location.search);
    const recipient = params.get('for') || params.get('to');
    const note = params.get('msg') || params.get('note');
    const sender = params.get('from');

    if (recipient) {
      document.getElementById('display-recipient').textContent = `A Rose For ${recipient} 🌹`;
      document.getElementById('letter-title').textContent = `For ${recipient}, My Love`;
    }
    if (note) {
      document.getElementById('letter-text').textContent = `"${note}"`;
    }
    if (sender) {
      document.getElementById('display-sender').textContent = `${sender} 💖`;
    }

    // Modal
    const modal = document.getElementById('edit-modal');
    const editBtn = document.getElementById('btn-edit-note');
    const closeBtn = document.getElementById('modal-close-btn');
    const saveBtn = document.getElementById('btn-save-note');

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (modal) modal.classList.add('active');
        this.audioManager.playClick();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (modal) modal.classList.remove('active');
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const toVal = document.getElementById('input-recipient')?.value.trim();
        const msgVal = document.getElementById('input-message')?.value.trim();
        const fromVal = document.getElementById('input-sender')?.value.trim();

        const url = new URL(window.location.href.split('?')[0]);
        if (toVal) url.searchParams.set('for', toVal);
        if (msgVal) url.searchParams.set('msg', msgVal);
        if (fromVal) url.searchParams.set('from', fromVal);

        navigator.clipboard.writeText(url.toString());
        this.showToast('Copied personalized love link! 💖');
        this.audioManager.playHeartBurst();

        if (toVal) {
          document.getElementById('display-recipient').textContent = `A Rose For ${toVal} 🌹`;
          document.getElementById('letter-title').textContent = `For ${toVal}, My Love`;
        }
        if (msgVal) {
          document.getElementById('letter-text').textContent = `"${msgVal}"`;
        }
        if (fromVal) {
          document.getElementById('display-sender').textContent = `${fromVal} 💖`;
        }

        if (modal) modal.classList.remove('active');
      });
    }
  }

  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast show';
    setTimeout(() => {
      toast.className = 'toast';
    }, 2800);
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (this.currentScreen === 'rose') {
        // 1. Simulate the blooming rose
        this.roseSim.update(dt);
        this.roseSim.render();

        // 2. Render directly as pure Living Colored ASCII Rose!
        const frameData = this.asciiEngine.processFrame(this.realCanvas);
        this.asciiEngine.renderToCanvas(this.displayCanvas, frameData);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new PureAsciiLoveRoseApp();
});

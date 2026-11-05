/**
 * A Rose For You 🌹 — Romantic Experience & ASCII Engine
 * 1. Screen 1: ASCII Art Hand saying "Click to show the love"
 * 2. On click: Heart burst & romantic melody plays, reveals the blooming rose + small love note.
 * 3. Rose can be toggled between Photoreal and Living Colored ASCII!
 */

import { RoseSimulator } from './rose-sim.js';
import { AsciiEngine } from './ascii-engine.js';
import { HandInteractionController } from './hand-interaction.js';
import { AudioManager } from './audio-fx.js';

class RomanticRoseApp {
  constructor() {
    this.currentScreen = 'hand'; // 'hand' or 'rose'
    this.initCanvases();
    this.initEngines();
    this.initHandInteraction();
    this.initAmbientPetals();
    this.initLoveLetter();
    this.initScreenTransitions();
    this.initControls();
    this.startLoop();
  }

  initCanvases() {
    // 1. Offscreen Real Rose Canvas
    this.realCanvas = document.createElement('canvas');
    this.realCanvas.width = 800;
    this.realCanvas.height = 800;

    // 2. Offscreen ASCII Rose Canvas
    this.asciiCanvas = document.createElement('canvas');
    this.asciiCanvas.width = 800;
    this.asciiCanvas.height = 800;

    // 3. Main Hero Display Canvas
    this.displayCanvas = document.getElementById('hero-canvas');
    this.displayCanvas.width = 800;
    this.displayCanvas.height = 800;
  }

  initEngines() {
    this.audioManager = new AudioManager();
    this.roseSim = new RoseSimulator(this.realCanvas);
    this.roseSim.speed = 0.07;

    this.asciiEngine = new AsciiEngine({
      columns: 110,
      charSet: 'standard',
      colorMode: 'truecolor',
      glow: true
    });
  }

  initScreenTransitions() {
    const handScreen = document.getElementById('ascii-hand-screen');
    const roseScreen = document.getElementById('rose-love-screen');
    const handTrigger = document.getElementById('ascii-hand-trigger');
    const showLoveBtn = document.getElementById('btn-show-love');
    const backHandBtn = document.getElementById('btn-back-hand');

    const triggerShowLove = (e) => {
      if (this.currentScreen === 'rose') return;
      this.currentScreen = 'rose';

      // 1. Trigger audio melody and heart burst
      this.audioManager.init();
      this.audioManager.toggleMute(); // starts the melody
      const musicLabel = document.getElementById('music-label');
      if (musicLabel) musicLabel.textContent = 'Pause Music';
      const btnAudio = document.getElementById('btn-audio-toggle');
      if (btnAudio) btnAudio.classList.add('active');

      this.audioManager.playHeartBurst();

      // 2. Spawn ripple on hero canvas
      this.handController.createRipple(this.displayCanvas.width / 2, this.displayCanvas.height / 2);

      // 3. Switch screens
      if (handScreen) handScreen.classList.remove('active');
      if (roseScreen) {
        roseScreen.classList.add('active');
        // Restart bloom from tight bud
        this.roseSim.setBloomProgress(0);
        this.roseSim.isPlaying = true;
      }

      this.showToast('With all my love... 💖');
    };

    if (handTrigger) handTrigger.addEventListener('click', triggerShowLove);
    if (showLoveBtn) showLoveBtn.addEventListener('click', triggerShowLove);

    if (backHandBtn) {
      backHandBtn.addEventListener('click', () => {
        this.currentScreen = 'hand';
        if (roseScreen) roseScreen.classList.remove('active');
        if (handScreen) handScreen.classList.add('active');
        this.audioManager.playClick();
      });
    }
  }

  initHandInteraction() {
    this.handController = new HandInteractionController({
      container: document.getElementById('hero-canvas-wrapper'),
      realCanvas: this.realCanvas,
      asciiCanvas: this.asciiCanvas,
      outputCanvas: this.displayCanvas,
      onModeChange: () => {},
      onAudioTrigger: (type) => {
        if (type === 'bloom') {
          this.audioManager.playHeartBurst();
        } else {
          this.audioManager.playClick();
        }
        this.updateViewIndicator();
      }
    });

    // Touch / Click button
    const handClickBtn = document.getElementById('btn-hand-click');
    if (handClickBtn) {
      handClickBtn.addEventListener('click', () => {
        this.handController.createRipple(this.displayCanvas.width / 2, this.displayCanvas.height / 2);
        this.handController.toggleAscii();
        this.updateViewIndicator();
      });
    }
  }

  updateViewIndicator() {
    const isAscii = this.handController.isAsciiRevealed;
    const indicator = document.getElementById('view-indicator');
    const toggleText = document.getElementById('view-toggle-text');

    if (indicator) {
      indicator.innerHTML = isAscii
        ? '<span>✨ Living ASCII Rose</span>'
        : '<span>🌹 Photoreal Rose</span>';
    }
    if (toggleText) {
      toggleText.textContent = isAscii ? 'Show Photoreal' : 'Show ASCII';
    }
  }

  initControls() {
    // Play / Pause
    const btnPlay = document.getElementById('btn-play-pause');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.roseSim.isPlaying = !this.roseSim.isPlaying;
        btnPlay.innerHTML = this.roseSim.isPlaying
          ? '<span class="icon">⏸</span> Pause'
          : '<span class="icon">▶</span> Bloom';
        this.audioManager.playClick();
      });
    }

    // Color Theme
    const rosePalette = document.getElementById('rose-palette');
    if (rosePalette) {
      rosePalette.addEventListener('change', (e) => {
        this.roseSim.colorScheme = e.target.value;
        this.audioManager.playBloomChime();
      });
    }

    // Music Toggle
    const btnAudio = document.getElementById('btn-audio-toggle');
    const musicLabel = document.getElementById('music-label');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const isMuted = this.audioManager.toggleMute();
        if (musicLabel) {
          musicLabel.textContent = isMuted ? 'Play Music' : 'Pause Music';
        }
        btnAudio.classList.toggle('active', !isMuted);
      });
    }

    // Scroll to Love Letter
    document.getElementById('btn-open-letter')?.addEventListener('click', () => {
      document.getElementById('love-letter-card')?.scrollIntoView({ behavior: 'smooth' });
      this.audioManager.playHeartBurst();
    });
  }

  // --- AMBIENT FALLING ROSE PETALS ---
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
    const count = Math.min(28, Math.floor(window.innerWidth / 45));

    for (let i = 0; i < count; i++) {
      petals.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 8 + Math.random() * 12,
        speedX: -0.5 + Math.random() * 1.0,
        speedY: 0.6 + Math.random() * 1.2,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        alpha: 0.2 + Math.random() * 0.4
      });
    }

    const animatePetals = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let p of petals) {
        p.x += p.speedX + Math.sin(p.angle) * 0.4;
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

        // Draw delicate heart/petal shape
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

  // --- LOVE LETTER & PERSONALIZATION ---
  initLoveLetter() {
    const params = new URLSearchParams(window.location.search);
    const recipient = params.get('for') || params.get('to');
    const note = params.get('msg') || params.get('note');
    const sender = params.get('from');

    if (recipient) {
      document.getElementById('display-recipient').textContent = `A Rose For ${recipient} 🌹`;
      document.getElementById('letter-title').textContent = `For ${recipient}, My Love`;
    }

    if (note) {
      document.getElementById('letter-text').textContent = note;
    }

    if (sender) {
      document.getElementById('display-sender').textContent = `${sender} 💖`;
    }

    const modal = document.getElementById('personalize-modal');
    const openBtn = document.getElementById('btn-customize-link');
    const closeBtn = document.getElementById('modal-close-btn');
    const genBtn = document.getElementById('btn-generate-love-link');
    const shareBtn = document.getElementById('btn-share-link');

    const openModal = () => {
      if (modal) modal.classList.add('active');
      this.audioManager.playClick();
    };

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
    };

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    const copyUrl = (url) => {
      navigator.clipboard.writeText(url);
      this.showToast('Copied personalized love link! 💖');
      this.audioManager.playHeartBurst();
    };

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        copyUrl(window.location.href);
      });
    }

    if (genBtn) {
      genBtn.addEventListener('click', () => {
        const toVal = document.getElementById('input-recipient')?.value.trim();
        const msgVal = document.getElementById('input-message')?.value.trim();
        const fromVal = document.getElementById('input-sender')?.value.trim();

        const url = new URL(window.location.href.split('?')[0]);
        if (toVal) url.searchParams.set('for', toVal);
        if (msgVal) url.searchParams.set('msg', msgVal);
        if (fromVal) url.searchParams.set('from', fromVal);

        copyUrl(url.toString());
        closeModal();

        if (toVal) {
          document.getElementById('display-recipient').textContent = `A Rose For ${toVal} 🌹`;
          document.getElementById('letter-title').textContent = `For ${toVal}, My Love`;
        }
        if (msgVal) {
          document.getElementById('letter-text').textContent = msgVal;
        }
        if (fromVal) {
          document.getElementById('display-sender').textContent = `${fromVal} 💖`;
        }
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

      // Only calculate frames when rose screen is visible or transitioning
      if (this.currentScreen === 'rose') {
        this.roseSim.update(dt);
        this.roseSim.render();

        const frameData = this.asciiEngine.processFrame(this.realCanvas);
        this.asciiEngine.renderToCanvas(this.asciiCanvas, frameData);

        this.handController.update(dt);
        this.handController.composite(this.realCanvas, this.asciiCanvas);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new RomanticRoseApp();
});

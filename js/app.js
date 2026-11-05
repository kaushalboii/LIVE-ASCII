/**
 * Live ASCII Rose & Creative Studio - Main Application Entrypoint
 * Coordinates the realistic blooming rose, ASCII conversion engine,
 * interactive hand-click transitions, and creative studio tools.
 */

import { RoseSimulator } from './rose-sim.js';
import { AsciiEngine } from './ascii-engine.js';
import { HandInteractionController } from './hand-interaction.js';
import { AudioManager } from './audio-fx.js';
import { AsciiStudio } from './studio.js';

class LiveAsciiApp {
  constructor() {
    this.initCanvases();
    this.initEngines();
    this.initHandInteraction();
    this.initUI();
    this.initStudio();
    this.startLoop();
  }

  initCanvases() {
    // 1. Offscreen Real Rose Canvas (800x800)
    this.realCanvas = document.createElement('canvas');
    this.realCanvas.width = 800;
    this.realCanvas.height = 800;

    // 2. Offscreen ASCII Rose Canvas (800x800)
    this.asciiCanvas = document.createElement('canvas');
    this.asciiCanvas.width = 800;
    this.asciiCanvas.height = 800;

    // 3. Main Hero Display Canvas (Visible on page)
    this.displayCanvas = document.getElementById('hero-canvas');
    this.displayCanvas.width = 800;
    this.displayCanvas.height = 800;
  }

  initEngines() {
    this.audioManager = new AudioManager();
    this.roseSim = new RoseSimulator(this.realCanvas);
    this.asciiEngine = new AsciiEngine({
      columns: 110,
      charSet: 'standard',
      colorMode: 'truecolor',
      glow: true
    });
  }

  initHandInteraction() {
    this.handController = new HandInteractionController({
      container: document.getElementById('hero-canvas-wrapper'),
      realCanvas: this.realCanvas,
      asciiCanvas: this.asciiCanvas,
      outputCanvas: this.displayCanvas,
      onModeChange: (mode) => {
        document.querySelectorAll('.mode-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.mode === mode);
        });
      },
      onAudioTrigger: (type) => {
        if (type === 'bloom') {
          this.audioManager.playTransformSound();
        } else {
          this.audioManager.playClick();
        }
      }
    });

    // Dedicated Hand Click Trigger Button in UI
    const handClickBtn = document.getElementById('btn-hand-click');
    if (handClickBtn) {
      handClickBtn.addEventListener('click', () => {
        this.handController.createRipple(this.displayCanvas.width / 2, this.displayCanvas.height / 2);
        this.handController.toggleAscii();
      });
    }

    // Interaction mode buttons (Click, Split, Lens)
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.handController.setInteractionMode(mode);
        this.audioManager.playClick();
      });
    });
  }

  initUI() {
    // Rose Bloom Playback Controls
    const btnPlay = document.getElementById('btn-play-pause');
    const bloomScrubber = document.getElementById('bloom-scrubber');
    const bloomSpeed = document.getElementById('bloom-speed');
    const rosePalette = document.getElementById('rose-palette');
    const loopMode = document.getElementById('loop-mode');

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.roseSim.isPlaying = !this.roseSim.isPlaying;
        btnPlay.innerHTML = this.roseSim.isPlaying
          ? '<span class="icon">⏸</span> Pause Bloom'
          : '<span class="icon">▶</span> Play Bloom';
        this.audioManager.playClick();
      });
    }

    if (bloomScrubber) {
      bloomScrubber.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.roseSim.setBloomProgress(val);
      });
    }

    if (bloomSpeed) {
      bloomSpeed.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.roseSim.speed = val;
        document.getElementById('speed-val').textContent = `${val.toFixed(2)}x`;
      });
    }

    if (rosePalette) {
      rosePalette.addEventListener('change', (e) => {
        this.roseSim.colorScheme = e.target.value;
        this.audioManager.playBloomChime();
      });
    }

    if (loopMode) {
      loopMode.addEventListener('change', (e) => {
        this.roseSim.loopMode = e.target.value;
      });
    }

    // ASCII Settings Controls
    const asciiResolution = document.getElementById('ascii-resolution');
    const charSetSelect = document.getElementById('ascii-charset');
    const colorModeSelect = document.getElementById('ascii-colormode');
    const toggleGlow = document.getElementById('toggle-glow');
    const toggleInvert = document.getElementById('toggle-invert');

    if (asciiResolution) {
      asciiResolution.addEventListener('input', (e) => {
        const cols = parseInt(e.target.value, 10);
        this.asciiEngine.setResolution(cols);
        document.getElementById('res-val').textContent = `${cols} cols`;
      });
    }

    if (charSetSelect) {
      charSetSelect.addEventListener('change', (e) => {
        this.asciiEngine.setCharSet(e.target.value);
      });
    }

    if (colorModeSelect) {
      colorModeSelect.addEventListener('change', (e) => {
        this.asciiEngine.setColorMode(e.target.value);
        this.audioManager.playClick();
      });
    }

    if (toggleGlow) {
      toggleGlow.addEventListener('change', (e) => {
        this.asciiEngine.glow = e.target.checked;
      });
    }

    if (toggleInvert) {
      toggleInvert.addEventListener('change', (e) => {
        this.asciiEngine.invert = e.target.checked;
      });
    }

    // Audio Mute/Unmute Toggle
    const btnAudio = document.getElementById('btn-audio-toggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const isMuted = this.audioManager.toggleMute();
        btnAudio.innerHTML = isMuted
          ? '<span class="icon">🔇</span> Sound Off'
          : '<span class="icon">🔊</span> Sound On';
      });
    }

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        const wrapper = document.getElementById('hero-canvas-wrapper');
        if (!document.fullscreenElement) {
          wrapper.requestFullscreen().catch(err => console.warn(err));
        } else {
          document.exitFullscreen().catch(err => console.warn(err));
        }
      });
    }

    // Export Hero ASCII Frame
    document.getElementById('btn-export-rose-png')?.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `rose-ascii-${Math.round(this.roseSim.bloomProgress * 100)}pct.png`;
      link.href = this.displayCanvas.toDataURL('image/png');
      link.click();
      this.studio.showToast('Downloaded Rose Frame as PNG!');
      this.audioManager.playBloomChime();
    });

    document.getElementById('btn-copy-rose-txt')?.addEventListener('click', () => {
      const frameData = this.asciiEngine.processFrame(this.realCanvas);
      const text = this.asciiEngine.toPlainText(frameData);
      navigator.clipboard.writeText(text);
      this.studio.showToast('Copied Rose ASCII to clipboard!');
      this.audioManager.playBloomChime();
    });
  }

  initStudio() {
    this.studio = new AsciiStudio(this.asciiEngine, this.audioManager);
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // 1. Update & Render Realistic Rose to realCanvas
      this.roseSim.update(dt);
      this.roseSim.render();

      // Update scrubber UI position smoothly if playing
      const scrubber = document.getElementById('bloom-scrubber');
      if (scrubber && this.roseSim.isPlaying) {
        scrubber.value = Math.round(this.roseSim.bloomProgress * 100);
      }
      const stageText = document.getElementById('bloom-stage-text');
      if (stageText) {
        const pct = Math.round(this.roseSim.bloomProgress * 100);
        let label = 'Tight Velvety Bud';
        if (pct > 20 && pct <= 45) label = 'Sepals Opening';
        else if (pct > 45 && pct <= 75) label = 'Petals Unfolding';
        else if (pct > 75) label = 'Magnificent Full Bloom';
        stageText.textContent = `${pct}% — ${label}`;
      }

      // 2. Convert Realistic Rose to Colored ASCII on asciiCanvas
      const frameData = this.asciiEngine.processFrame(this.realCanvas);
      this.asciiEngine.renderToCanvas(this.asciiCanvas, frameData);

      // 3. Hand interaction controller updates & composites to display canvas
      this.handController.update(dt);
      this.handController.composite(this.realCanvas, this.asciiCanvas);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LiveAsciiApp();
});

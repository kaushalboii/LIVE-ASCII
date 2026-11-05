/**
 * Realistic Living ASCII Blooming Rose Engine
 * Combines RoseSimulator (photorealistic botanical rose physics)
 * with AsciiEngine (true-color 24-bit glowing colored ASCII rasterization).
 * 
 * Features:
 * - Starts as a single delicate bud and blooms into a full crimson blossom.
 * - Organically unfurls into TWO intertwined roses side by side (Kaushal & Her).
 * - Rich velvety crimson petals, realistic sepals, stems, thorns, and dewdrops.
 * - High-contrast luminous glow on pure pitch black background (#000000).
 * - Notifies onBloomComplete when the duo roses finish blossoming.
 */

import { RoseSimulator } from './rose-sim.js';
import { AsciiEngine } from './ascii-engine.js';

export class AsciiRose {
  constructor(canvas, onBloomComplete = null) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.onBloomComplete = onBloomComplete;

    this.isRunning = false;
    this.animId = null;
    this.hasTriggeredBloom = false;

    // High-resolution offscreen canvas for rendering the realistic rose simulation
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 680;
    this.offscreenCanvas.height = 680;

    // 1. Realistic procedural blooming rose simulation
    this.roseSim = new RoseSimulator(this.offscreenCanvas);
    this.roseSim.speed = 0.32; // ~3.1s from bud to full blossom
    this.roseSim.isPlaying = true;
    this.roseSim.colorScheme = 'crimson';
    this.setupCallback();

    // 2. High-performance colored ASCII art engine
    this.asciiEngine = new AsciiEngine({
      columns: 96,
      charSet: 'standard',
      colorMode: 'crimsonglow',
      brightness: 1.25,
      contrast: 1.30,
      glow: true
    });
  }

  setupCallback() {
    this.roseSim.onDuoReady = () => {
      if (!this.hasTriggeredBloom) {
        this.hasTriggeredBloom = true;
        if (this.onBloomComplete) {
          this.onBloomComplete();
        }
      }
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.hasTriggeredBloom = false;
    this.roseSim.resetBloom();
    this.setupCallback();

    let lastTime = performance.now();

    const loop = (now) => {
      if (!this.isRunning) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // 1. Step simulation physics & render photorealistic frame to offscreen canvas
      this.roseSim.update(dt);
      this.roseSim.render();

      // 2. Convert offscreen frame to true-color glowing ASCII art directly onto target canvas
      const frameData = this.asciiEngine.processFrame(this.offscreenCanvas);
      this.asciiEngine.renderToCanvas(this.canvas, frameData);

      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.canvas) {
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  reset() {
    this.stop();
    this.hasTriggeredBloom = false;
    if (this.roseSim) {
      this.roseSim.resetBloom();
      this.setupCallback();
    }
  }

  resize() {
    // Sized responsively by CSS wrapper
  }
}

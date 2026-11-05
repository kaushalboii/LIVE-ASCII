/**
 * Photorealistic ASCII Hand Gesture Renderer
 * Recreates the exact After Effects style ASCII pointing hand from the reference video:
 * - Anatomical human forearm, wrist, palm, and extended pointing index finger
 * - Exact circular click target with upward arrow (↑) above fingertip
 * - Electric cyan-blue accent rim lighting along the forearm and palm
 * - Dense ASCII matrix of 'O', 'X', '1', '/', '*', '.', '#' characters
 * - Faint dot grid background matching After Effects
 * - Interactive tap/click animation with fingertip shockwave
 */

export class AsciiHandRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.isClicking = false;
    this.clickProgress = 0;
    this.isHovered = false;

    // Offscreen high-res canvas for rendering the hand shape before ASCII conversion
    this.handCanvas = document.createElement('canvas');
    this.handCanvas.width = 440;
    this.handCanvas.height = 620;
    this.handCtx = this.handCanvas.getContext('2d');

    // Glyph matrix setup matching the video: O, X, 1, /, etc.
    this.glyphs = [' ', '.', ':', '/', '1', 'X', 'O', '#', '@'];
    this.cols = 62;
    this.rows = 84;

    // Sampling canvas
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCanvas.width = this.cols;
    this.sampleCanvas.height = this.rows;
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });
  }

  triggerClick() {
    this.isClicking = true;
    this.clickProgress = 0;
  }

  update(dt = 0.016) {
    this.time += dt;

    if (this.isClicking) {
      this.clickProgress += dt * 3.5;
      if (this.clickProgress >= 1.0) {
        this.isClicking = false;
        this.clickProgress = 0;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw subtle background dot grid (matching the reference video's AE background)
    this.drawDotGrid(ctx, w, h);

    // 2. Render smooth anatomical hand onto offscreen canvas
    this.renderHandShape();

    // 3. Sample offscreen canvas and blit ASCII glyph matrix with white body & blue rim lighting
    this.renderAsciiMatrix(ctx, w, h);

    // 4. Render click target circle with upward arrow (↑) right above the index finger
    this.renderClickTarget(ctx, w, h);
  }

  drawDotGrid(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    const spacing = 16;
    for (let x = spacing / 2; x < w; x += spacing) {
      for (let y = spacing / 2; y < h; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  renderHandShape() {
    const ctx = this.handCtx;
    const w = this.handCanvas.width;
    const h = this.handCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Gentle breathing sway
    const swayY = Math.sin(this.time * 2) * 3;
    let tapDisplacement = 0;
    if (this.isClicking) {
      tapDisplacement = Math.sin(this.clickProgress * Math.PI) * 18;
    } else if (this.isHovered) {
      tapDisplacement = 5;
    }

    ctx.save();
    ctx.translate(w / 2, h + swayY);

    // --- 1. FOREARM & WRIST ---
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(-38, -150);
    ctx.quadraticCurveTo(-42, -210, -46, -240); // wrist left
    ctx.lineTo(48, -240); // wrist right
    ctx.quadraticCurveTo(44, -210, 40, -150);
    ctx.lineTo(44, 0);
    ctx.closePath();

    const armGrad = ctx.createLinearGradient(-46, 0, 48, 0);
    armGrad.addColorStop(0, '#00b4d8'); // Electric blue accent along left edge (from video)
    armGrad.addColorStop(0.18, '#ffffff');
    armGrad.addColorStop(0.65, '#e2e8f0');
    armGrad.addColorStop(1, '#334155');
    ctx.fillStyle = armGrad;
    ctx.fill();

    // Distinct cyan neon accent stroke along the left forearm contour
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(-38, -150);
    ctx.lineTo(-46, -240);
    ctx.stroke();
    ctx.restore();

    // --- 2. PALM & THENAR EMINENCE ---
    ctx.beginPath();
    ctx.moveTo(-46, -240);
    ctx.quadraticCurveTo(-66, -290, -62, -350); // Thenar muscle (thumb base)
    ctx.lineTo(58, -350); // Pinky knuckle base
    ctx.quadraticCurveTo(54, -290, 48, -240);
    ctx.closePath();

    const palmGrad = ctx.createRadialGradient(-5, -295, 20, 0, -295, 80);
    palmGrad.addColorStop(0, '#ffffff');
    palmGrad.addColorStop(0.45, '#f1f5f9');
    palmGrad.addColorStop(0.8, '#94a3b8');
    palmGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = palmGrad;
    ctx.fill();

    // Blue accent continues along lower thumb base
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-46, -240);
    ctx.quadraticCurveTo(-66, -290, -62, -330);
    ctx.stroke();
    ctx.restore();

    // --- 3. CURLED THUMB ---
    ctx.beginPath();
    ctx.moveTo(-62, -310);
    ctx.quadraticCurveTo(-86, -330, -74, -370);
    ctx.quadraticCurveTo(-50, -380, -40, -340);
    ctx.closePath();
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();

    // --- 4. CURLED FINGERS (Middle, Ring, Pinky curled into palm) ---
    // Pinky
    this.drawCurledFinger(ctx, 36, -350, 18, 46, '#94a3b8');
    // Ring finger
    this.drawCurledFinger(ctx, 14, -354, 20, 52, '#cbd5e1');
    // Middle finger
    this.drawCurledFinger(ctx, -9, -356, 22, 56, '#e2e8f0');

    // --- 5. EXTENDED POINTING INDEX FINGER ---
    const fingerBaseX = -32;
    const fingerBaseY = -355;
    const fingerW = 26;
    const fingerLen = 160 - tapDisplacement; // Taps down on hover/click

    ctx.beginPath();
    ctx.moveTo(fingerBaseX, fingerBaseY);
    ctx.lineTo(fingerBaseX - 2, fingerBaseY - fingerLen * 0.4);
    ctx.lineTo(fingerBaseX + 1, fingerBaseY - fingerLen + 14);
    // Smooth fingertip curve
    ctx.quadraticCurveTo(
      fingerBaseX + fingerW * 0.5, fingerBaseY - fingerLen,
      fingerBaseX + fingerW - 1, fingerBaseY - fingerLen + 14
    );
    ctx.lineTo(fingerBaseX + fingerW, fingerBaseY - fingerLen * 0.4);
    ctx.lineTo(fingerBaseX + fingerW, fingerBaseY);
    ctx.closePath();

    const fingerGrad = ctx.createLinearGradient(
      fingerBaseX, fingerBaseY - fingerLen,
      fingerBaseX + fingerW, fingerBaseY
    );
    fingerGrad.addColorStop(0, '#ffffff');
    fingerGrad.addColorStop(0.35, '#f8fafc');
    fingerGrad.addColorStop(0.75, '#cbd5e1');
    fingerGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = fingerGrad;
    ctx.fill();

    // Finger knuckle crease lines
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(fingerBaseX + 2, fingerBaseY - fingerLen * 0.35);
    ctx.lineTo(fingerBaseX + fingerW - 2, fingerBaseY - fingerLen * 0.35);
    ctx.moveTo(fingerBaseX + 2, fingerBaseY - fingerLen * 0.68);
    ctx.lineTo(fingerBaseX + fingerW - 2, fingerBaseY - fingerLen * 0.68);
    ctx.stroke();

    ctx.restore();
  }

  drawCurledFinger(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y - h, w, h, [w * 0.5, w * 0.5, 5, 5]);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  renderAsciiMatrix(targetCtx, targetW, targetH) {
    // 1. Draw hand canvas into sample canvas
    this.sampleCtx.clearRect(0, 0, this.cols, this.rows);
    this.sampleCtx.drawImage(this.handCanvas, 0, 0, this.cols, this.rows);

    const imgData = this.sampleCtx.getImageData(0, 0, this.cols, this.rows);
    const data = imgData.data;

    const cellW = targetW / this.cols;
    const cellH = targetH / this.rows;

    targetCtx.font = `600 ${cellH * 1.05}px "JetBrains Mono", monospace`;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';

    const glyphCount = this.glyphs.length - 1;

    for (let y = 0; y < this.rows; y++) {
      const rowOffset = y * this.cols * 4;
      const posY = y * cellH + cellH * 0.5;

      for (let x = 0; x < this.cols; x++) {
        const offset = rowOffset + x * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const a = data[offset + 3] / 255;

        if (a < 0.08) continue;

        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const charIdx = Math.min(glyphCount, Math.floor(lum * glyphCount));
        const char = this.glyphs[charIdx];

        if (char === ' ') continue;

        const posX = x * cellW + cellW * 0.5;

        // Electric cyan-blue accent along left edge
        if (b > r + 30 && b > 100) {
          targetCtx.fillStyle = '#00e5ff';
          targetCtx.shadowColor = '#00e5ff';
          targetCtx.shadowBlur = 8;
        } else {
          // Pure monochrome white/silver ASCII hand
          const val = Math.min(255, Math.floor(lum * 255 + 35));
          targetCtx.fillStyle = `rgb(${val}, ${val}, ${val})`;
          targetCtx.shadowColor = 'transparent';
          targetCtx.shadowBlur = 0;
        }

        targetCtx.fillText(char, posX, posY);
      }
    }
  }

  renderClickTarget(ctx, w, h) {
    // Exact circular target with upward arrow (↑) matching Frame 00:01
    const swayY = Math.sin(this.time * 2) * 3;
    let tapDisplacement = 0;
    if (this.isClicking) {
      tapDisplacement = Math.sin(this.clickProgress * Math.PI) * 18;
    } else if (this.isHovered) {
      tapDisplacement = 5;
    }

    const tipX = w * 0.45;
    const tipY = h * 0.16 + swayY + tapDisplacement * 0.4;

    ctx.save();

    // Subtle pulsing ring
    const pulse = Math.sin(this.time * 4) * 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(tipX, tipY, 16 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Upward arrow icon (↑) inside the circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY - 7);
    ctx.lineTo(tipX - 6, tipY);
    ctx.lineTo(tipX - 2.5, tipY);
    ctx.lineTo(tipX - 2.5, tipY + 7);
    ctx.lineTo(tipX + 2.5, tipY + 7);
    ctx.lineTo(tipX + 2.5, tipY);
    ctx.lineTo(tipX + 6, tipY);
    ctx.closePath();
    ctx.fill();

    // Expanding shockwave ring on click
    if (this.isClicking) {
      const ringR = this.clickProgress * 70;
      const ringAlpha = 1.0 - this.clickProgress;
      ctx.strokeStyle = `rgba(0, 240, 255, ${ringAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tipX, tipY, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

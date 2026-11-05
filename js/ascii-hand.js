/**
 * High-Definition ASCII Hand Gesture Renderer
 * Recreates the exact After Effects style ASCII pointing/clicking hand
 * from the reference video:
 * - Anatomical human forearm, palm, and extended pointing index finger
 * - Dense ASCII matrix of 'O', 'X', '1', '/', '*', '.', '#' characters
 * - Electric cyan-blue edge rim lighting along the forearm
 * - Interactive tap/click animation and ambient breathing sway
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
    this.handCanvas.width = 400;
    this.handCanvas.height = 560;
    this.handCtx = this.handCanvas.getContext('2d');

    // Glyph matrix setup matching the video: O, X, 1, /, etc.
    this.glyphs = [' ', '.', ':', '/', '1', 'X', 'O', '#', '@'];
    this.cols = 54;
    this.rows = 74;

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
      this.clickProgress += dt * 4;
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

    // 1. Draw subtle background dot grid (matching the video's After Effects background)
    this.drawDotGrid(ctx, w, h);

    // 2. Render smooth anatomical hand onto offscreen canvas
    this.renderHandShape();

    // 3. Sample offscreen canvas and blit ASCII glyph matrix with white body & blue rim lighting
    this.renderAsciiMatrix(ctx, w, h);
  }

  drawDotGrid(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    const spacing = 18;
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

    // Breathing sway
    const swayY = Math.sin(this.time * 2) * 3;
    // Click displacement (finger bends down slightly on click)
    let tapDisplacement = 0;
    if (this.isClicking) {
      tapDisplacement = Math.sin(this.clickProgress * Math.PI) * 16;
    } else if (this.isHovered) {
      tapDisplacement = 4;
    }

    ctx.save();
    ctx.translate(w / 2, h + swayY);

    // 1. Forearm & Wrist (extending up from bottom)
    ctx.beginPath();
    ctx.moveTo(-38, 0);
    ctx.lineTo(-34, -140);
    ctx.quadraticCurveTo(-38, -200, -42, -230); // wrist left
    ctx.lineTo(44, -230); // wrist right
    ctx.quadraticCurveTo(40, -200, 36, -140);
    ctx.lineTo(40, 0);
    ctx.closePath();

    const armGrad = ctx.createLinearGradient(-40, 0, 40, 0);
    armGrad.addColorStop(0, '#00b4d8'); // Blue accent along left edge (like the video!)
    armGrad.addColorStop(0.18, '#ffffff');
    armGrad.addColorStop(0.7, '#d1d5db');
    armGrad.addColorStop(1, '#4b5563');
    ctx.fillStyle = armGrad;
    ctx.fill();

    // Blue accent stroke on left forearm
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-38, 0);
    ctx.lineTo(-34, -140);
    ctx.lineTo(-42, -230);
    ctx.stroke();
    ctx.restore();

    // 2. Palm
    ctx.beginPath();
    ctx.moveTo(-42, -230);
    ctx.quadraticCurveTo(-60, -280, -56, -340); // Thenar (thumb base)
    ctx.lineTo(54, -340); // Pinky knuckle
    ctx.quadraticCurveTo(52, -280, 44, -230);
    ctx.closePath();

    const palmGrad = ctx.createRadialGradient(0, -280, 15, 0, -280, 75);
    palmGrad.addColorStop(0, '#ffffff');
    palmGrad.addColorStop(0.5, '#e2e8f0');
    palmGrad.addColorStop(0.85, '#94a3b8');
    palmGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = palmGrad;
    ctx.fill();

    // 3. Curled Thumb
    ctx.beginPath();
    ctx.moveTo(-56, -300);
    ctx.quadraticCurveTo(-80, -320, -70, -360);
    ctx.quadraticCurveTo(-48, -370, -38, -330);
    ctx.closePath();
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();

    // 4. Curled Fingers (Middle, Ring, Pinky curled into palm)
    // Pinky
    this.drawCurledFinger(ctx, 32, -340, 16, 42, '#94a3b8');
    // Ring finger
    this.drawCurledFinger(ctx, 12, -344, 18, 48, '#cbd5e1');
    // Middle finger
    this.drawCurledFinger(ctx, -8, -346, 20, 52, '#e2e8f0');

    // 5. Extended Pointing Index Finger (Pointing straight up!)
    const fingerBaseX = -28;
    const fingerBaseY = -345;
    const fingerW = 24;
    const fingerLen = 145 - tapDisplacement; // flexes down when clicking

    ctx.beginPath();
    ctx.moveTo(fingerBaseX, fingerBaseY);
    ctx.lineTo(fingerBaseX - 2, fingerBaseY - fingerLen * 0.4);
    ctx.lineTo(fingerBaseX + 1, fingerBaseY - fingerLen + 12);
    // Fingertip curve
    ctx.quadraticCurveTo(
      fingerBaseX + fingerW * 0.5, fingerBaseY - fingerLen,
      fingerBaseX + fingerW - 1, fingerBaseY - fingerLen + 12
    );
    ctx.lineTo(fingerBaseX + fingerW, fingerBaseY - fingerLen * 0.4);
    ctx.lineTo(fingerBaseX + fingerW, fingerBaseY);
    ctx.closePath();

    const fingerGrad = ctx.createLinearGradient(
      fingerBaseX, fingerBaseY - fingerLen,
      fingerBaseX + fingerW, fingerBaseY
    );
    fingerGrad.addColorStop(0, '#ffffff');
    fingerGrad.addColorStop(0.3, '#f8fafc');
    fingerGrad.addColorStop(0.7, '#cbd5e1');
    fingerGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = fingerGrad;
    ctx.fill();

    // Knuckle creases
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fingerBaseX + 2, fingerBaseY - fingerLen * 0.35);
    ctx.lineTo(fingerBaseX + fingerW - 2, fingerBaseY - fingerLen * 0.35);
    ctx.moveTo(fingerBaseX + 2, fingerBaseY - fingerLen * 0.68);
    ctx.lineTo(fingerBaseX + fingerW - 2, fingerBaseY - fingerLen * 0.68);
    ctx.stroke();

    // Fingertip glowing indicator circle (like the video's click target)
    const tipX = fingerBaseX + fingerW * 0.5;
    const tipY = fingerBaseY - fingerLen - 14;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Upward arrow inside the click circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY - 6);
    ctx.lineTo(tipX - 5, tipY);
    ctx.lineTo(tipX - 2, tipY);
    ctx.lineTo(tipX - 2, tipY + 6);
    ctx.lineTo(tipX + 2, tipY + 6);
    ctx.lineTo(tipX + 2, tipY);
    ctx.lineTo(tipX + 5, tipY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }

  drawCurledFinger(ctx, x, y, w, h, color) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y - h, w, h, [w * 0.5, w * 0.5, 4, 4]);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1.5;
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

        if (a < 0.08) continue; // skip transparent background

        // Luminance
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const charIdx = Math.min(glyphCount, Math.floor(lum * glyphCount));
        const char = this.glyphs[charIdx];

        if (char === ' ') continue;

        const posX = x * cellW + cellW * 0.5;

        // Check if pixel is part of the blue accent rim (blue dominant over red)
        if (b > r + 30 && b > 100) {
          targetCtx.fillStyle = '#00e5ff';
          targetCtx.shadowColor = '#00e5ff';
          targetCtx.shadowBlur = 6;
        } else {
          // Pure monochrome white/silver ASCII hand
          const val = Math.min(255, Math.floor(lum * 255 + 40));
          targetCtx.fillStyle = `rgb(${val}, ${val}, ${val})`;
          targetCtx.shadowColor = 'transparent';
          targetCtx.shadowBlur = 0;
        }

        targetCtx.fillText(char, posX, posY);
      }
    }
  }
}

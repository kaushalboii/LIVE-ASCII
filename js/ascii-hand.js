/**
 * Exact Adobe After Effects ASCII Hand Breakdown & Interactive Button
 * Accurately recreates the @easebysrish After Effects breakdown video:
 * - Exact 30x56 character matrix from the reference video
 * - Character palette: '●' (dense filled circles), 'X', '1', '/'
 * - Electric cyan/cobalt blue square accent blocks ('■') along the knuckles and left rim silhouette
 * - Top bubble: "Click to show the love"
 * - Subtitle: "Ae Breakdown" with After Effects purple badge
 * - Bold title: "ASCII"
 * - Target Button: Circular button with upward arrow (↑) surrounded by ASCII glyph halo
 * - Continuous video-like clicking gesture animation loop (hand ascends, taps button, emits shockwave)
 * - Immediate responsive physical press upon real mouse/touch click
 * - Pure black canvas with faint dot matrix background
 */

const HAND_GRID = [
  '                        /     ',
  '                      111     ',
  '                      1X11    ',
  '                      1XXX    ',
  '                      1X●X    ',
  '                      /X●X1   ',
  '                      /XXXX   ',
  '                      /XXXX   ',
  '                  /////XXXX/  ',
  '              /111111111XXX1  ',
  '              1●X1XBBX1XXX1/  ',
  '             /1X●●XBBBB1●XX1  ',
  '             /1XX●●XBBB1X●X1/ ',
  '             /11XX●XBBBXX●XX1 ',
  '             /11X●●XBBB●●●XXX ',
  '              1X●●XXBBB1X●●X1 ',
  '              /1X●●XBBBX1XXX1 ',
  '              ///1XX1/111XXXX ',
  '              //111XX/11X●XX1 ',
  '              //1XX●X111XXXX1 ',
  '               /1XX●XXX1XXXX1/',
  '              //1XXXXX11X●X11/',
  '              /11XXXXX11XXX1//',
  '              /1XXXX●X11XXX11/',
  '              11X●●●●●●●●XX1/ ',
  '              /1XXXXXX●●●XX1/ ',
  '              /1XXX11XXXXX11/ ',
  '              //11///1XXX1/// ',
  '              ///11/////1//// ',
  '              /BB1X1////////  ',
  '              /BB11////11///  ',
  '              /BB////11/11//  ',
  '              /BB/11///1XX1/  ',
  '              /BB/1X1//1XX1/  ',
  '              /BBB/////1XXX1  ',
  '               BBB////1XXXX1  ',
  '               BBBB//1XXXX1/  ',
  '               /BBBB1XXXXXX// ',
  '                BBBB1XXXXX1// ',
  '                BBBBXXXXXX1// ',
  '                /BBB1XXX111/11',
  '                 1BB111BBBB  /',
  '                 BBBB /BBBB11/',
  '                 BBBBXX●●●●X1/',
  '                 /BB1XX●●●●XX1',
  '                  BB1XX●●●●●XX',
  '                  BB1XX●●●●●X1',
  '                  BB11X●●●●●XX',
  '                  BB/1XX●●●●X1',
  '                  BB/1XX●●●XX1',
  '                  BB/1XX●●XXX1',
  '                  BBB11XXXXX1X',
  '                  BBB/1XXX111X',
  '                  BBB/1X111111',
  '                  BBB/11111111',
  '                  /BB /1111///'
];

export class AsciiHandRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.isClicking = false;
    this.clickProgress = 0;
    this.isHovered = false;

    this.cols = 30;
    this.rows = HAND_GRID.length;
    this.cell = 10;

    // Set internal resolution for crisp rendering
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.width = 380;
    this.height = 660;
    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
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
    const w = this.width;
    const h = this.height;

    // 1. Clear canvas to pure pitch black (#000000)
    ctx.clearRect(0, 0, w, h);

    // 2. Faint After Effects dot matrix background
    this.drawDotGrid(ctx, w, h);

    // 3. Continuous Video-like Click Gesture Animation Loop (cycle: 2.1s)
    const cycle = (this.time % 2.1) / 2.1;
    let autoLift = 0;
    let isAutoTapping = false;
    let autoRipple = 0;

    if (cycle < 0.38) {
      // Approach: Hand glides upward smoothly toward the button
      const p = cycle / 0.38;
      const ease = (1 - Math.cos(p * Math.PI)) * 0.5;
      autoLift = ease * 18;
    } else if (cycle < 0.50) {
      // Impact: Index fingertip physically presses into the button
      const p = (cycle - 0.38) / 0.12;
      autoLift = 18 - Math.sin(p * Math.PI) * 4;
      isAutoTapping = true;
    } else if (cycle < 0.74) {
      // Shockwave expands, hand lingers momentarily
      const p = (cycle - 0.50) / 0.24;
      autoRipple = p;
      autoLift = 18 * (1 - p * 0.45);
    } else {
      // Smooth descent back to baseline
      const p = (cycle - 0.74) / 0.26;
      autoLift = 18 * 0.55 * (1 - p);
    }

    // Manual click impact overrides
    let clickLift = 0;
    if (this.isClicking) {
      clickLift = Math.sin(this.clickProgress * Math.PI) * 22;
      if (this.clickProgress < 0.55) isAutoTapping = true;
    }

    const totalLift = Math.max(autoLift, clickLift);

    // Micro organic idle sway
    const swayX = Math.sin(this.time * 2.0) * 1.5;
    const swayY = Math.cos(this.time * 2.5) * 1.2;

    // Layout coordinates
    // Top headers: Pill bubble, Ae Breakdown, ASCII title
    this.drawHeaders(ctx, w);

    // Button coordinates (aligned with index finger tip)
    const handWidth = this.cols * this.cell;
    const startX = (w - handWidth) / 2 + swayX;
    const baseY = 180;
    const startY = baseY - totalLift + swayY;

    // Index finger tip is at col 23.5, row 0 in HAND_GRID
    const fingerTipX = startX + 23.5 * this.cell;
    const buttonY = baseY - 24; // Button rests right at peak of finger reach

    // 4. Render Target Button with Upward Arrow (↑) and ASCII halo
    this.drawTargetButton(ctx, fingerTipX, buttonY, isAutoTapping, autoRipple);

    // 5. Render 30x56 After Effects ASCII Hand
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${this.cell - 1}px "JetBrains Mono", monospace`;

    for (let y = 0; y < this.rows; y++) {
      const row = HAND_GRID[y];
      const posY = startY + y * this.cell + this.cell * 0.5;

      for (let x = 0; x < this.cols; x++) {
        const char = row[x];
        if (!char || char === ' ') continue;

        const posX = startX + x * this.cell + this.cell * 0.5;

        // Digital matrix shimmer matching After Effects ASCII plugin
        const shimmer = 0.84 + 0.16 * Math.sin(this.time * 4.2 + x * 0.35 + y * 0.25);

        if (char === 'B') {
          // Electric cyan/cobalt blue solid tile
          const sq = this.cell * 0.90;
          const flare = isAutoTapping ? 1.35 : (this.isHovered ? 1.15 : 1.0);
          const bluePulse = 0.88 + 0.12 * Math.sin(this.time * 3.5 + y * 0.3);
          ctx.save();
          ctx.fillStyle = `rgba(0, 163, 255, ${Math.min(1, shimmer * bluePulse * flare)})`;
          ctx.shadowColor = '#00d4ff';
          ctx.shadowBlur = isAutoTapping ? 18 : 8;
          ctx.fillRect(posX - sq * 0.5, posY - sq * 0.5, sq, sq);
          ctx.restore();
        } else if (char === '●') {
          // Pure white dense filled circle (fingertips and core joints)
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
          ctx.shadowBlur = isAutoTapping ? 8 : 4;
          ctx.fillText('●', posX, posY);
          ctx.restore();
        } else if (char === 'X') {
          // Bright silver matrix X
          ctx.save();
          ctx.fillStyle = `rgba(240, 243, 250, ${shimmer * 0.95})`;
          ctx.shadowBlur = 0;
          ctx.fillText('X', posX, posY);
          ctx.restore();
        } else if (char === '1') {
          // Midtone 1
          ctx.save();
          ctx.fillStyle = `rgba(195, 202, 215, ${shimmer * 0.82})`;
          ctx.shadowBlur = 0;
          ctx.fillText('1', posX, posY);
          ctx.restore();
        } else if (char === '/') {
          // Sparse edge shading /
          ctx.save();
          ctx.fillStyle = `rgba(130, 138, 155, ${shimmer * 0.65})`;
          ctx.shadowBlur = 0;
          ctx.fillText('/', posX, posY);
          ctx.restore();
        }
      }
    }
  }

  drawDotGrid(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    const spacing = 16;
    for (let x = spacing / 2; x < w; x += spacing) {
      for (let y = spacing / 2; y < h; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 0.85, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawHeaders(ctx, w) {
    ctx.save();

    // 1. Top Pill Bubble: "Click to show the love"
    const pillW = 160;
    const pillH = 26;
    const pillX = (w - pillW) / 2;
    const pillY = 32;

    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 13);
    ctx.fillStyle = 'rgba(22, 24, 30, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#f0f3f8';
    ctx.font = '500 11px "Inter", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Click to show the love', w / 2, pillY + pillH / 2);

    // 2. Subtitle: [Ae] Breakdown
    const subY = 78;
    // Purple Ae box
    const aeBoxW = 20;
    const aeBoxH = 16;
    const aeBoxX = w / 2 - 46;
    const aeBoxY = subY - 8;

    ctx.beginPath();
    ctx.roundRect(aeBoxX, aeBoxY, aeBoxW, aeBoxH, 3);
    ctx.fillStyle = '#6b21a8'; // After Effects deep purple
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 9px "Inter", sans-serif';
    ctx.fillText('Ae', aeBoxX + aeBoxW / 2, aeBoxY + aeBoxH / 2 + 0.5);

    // "Breakdown" text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Breakdown', aeBoxX + aeBoxW + 6, subY);

    // 3. Bold "ASCII" title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px "Inter", "JetBrains Mono", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 6;
    ctx.fillText('ASCII', w / 2, 114);

    ctx.restore();
  }

  drawTargetButton(ctx, cx, cy, isTapping, rippleProg) {
    ctx.save();

    // Subtle ASCII constellation halo surrounding the target button (from video)
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('/', cx - 18, cy - 16);
    ctx.fillText('X', cx - 24, cy - 4);
    ctx.fillText('●', cx - 12, cy - 4);
    ctx.fillText('1', cx - 24, cy + 12);
    ctx.fillText('●', cx - 14, cy + 12);
    ctx.fillText('●', cx - 4, cy + 12);

    // Button scale and glow
    const scale = isTapping ? 0.90 : 1.0;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const r = 16;

    // Button background
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = isTapping ? '#00f0ff' : '#ffffff';
    ctx.shadowColor = isTapping ? '#00f0ff' : 'rgba(255, 255, 255, 0.85)';
    ctx.shadowBlur = isTapping ? 24 : 12;
    ctx.fill();

    // Upward arrow (↑) inside circle
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(-5, -1);
    ctx.lineTo(-2, -1);
    ctx.lineTo(-2, 6);
    ctx.lineTo(2, 6);
    ctx.lineTo(2, -1);
    ctx.lineTo(5, -1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Continuous video-like shockwave ring radiating outward on tap
    if (rippleProg > 0) {
      const ringR = 16 + rippleProg * 65;
      const alpha = (1.0 - rippleProg) * 0.85;

      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Manual user click expanding shockwave
    if (this.isClicking) {
      const ringR = 16 + this.clickProgress * 95;
      const alpha = 1.0 - this.clickProgress;

      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 3.0;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/**
 * Photorealistic After Effects ASCII Hand Renderer
 * Recreates the exact After Effects style ASCII pointing hand & button click animation
 * from the @easebysrish reference video:
 * - Exact 30x56 character matrix from the reference breakdown video
 * - Character palette: '●' (dense filled circles), 'X', '1', '/'
 * - Electric cyan/cobalt blue square accent blocks ('■') along the knuckles and left rim silhouette
 * - Glowing interactive target pill button [ ✦ CLICK TO SHOW THE LOVE ↑ ]
 * - Physical button depress animation (scale & dip) upon finger impact
 * - Radiating electric cyan shockwave rings and knuckle neon flaring
 * - Continuous 60 FPS video-like gesture cycle
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

    this.canvas.width = 360;
    this.canvas.height = 620;
  }

  triggerClick() {
    this.isClicking = true;
    this.clickProgress = 0;
  }

  update(dt = 0.016) {
    this.time += dt;

    if (this.isClicking) {
      this.clickProgress += dt * 3.4;
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

    // 1. Clear background to pure black (#000000)
    ctx.clearRect(0, 0, w, h);

    // 2. Faint After Effects dot matrix background
    this.drawDotGrid(ctx, w, h);

    // 3. CONTINUOUS VIDEO-LIKE CLICKING GESTURE ANIMATION LOOP (cycle: 2.0s)
    const cycle = (this.time % 2.0) / 2.0;
    let autoLift = 0;
    let isAutoTapping = false;
    let autoRipple = 0;
    let btnScale = 1.0;
    let btnDepress = 0;

    if (cycle < 0.36) {
      // Approach: Hand rises up smoothly toward the button
      const p = cycle / 0.36;
      autoLift = (1 - Math.cos(p * Math.PI)) * 0.5 * 18;
    } else if (cycle < 0.48) {
      // Impact: Fingertip presses into button! Button visibly depresses
      const p = (cycle - 0.36) / 0.12;
      const pressCurve = Math.sin(p * Math.PI);
      autoLift = 18 - pressCurve * 3;
      btnDepress = pressCurve * 4;
      btnScale = 1.0 - pressCurve * 0.08;
      isAutoTapping = true;
    } else if (cycle < 0.74) {
      // Shockwave expands, button bounces elastically, hand eases
      const p = (cycle - 0.48) / 0.26;
      autoRipple = p;
      btnScale = 1.0 + Math.sin(p * Math.PI) * 0.03;
      autoLift = 18 * (1 - p * 0.55);
    } else {
      // Smooth return to resting baseline
      const p = (cycle - 0.74) / 0.26;
      autoLift = 18 * 0.45 * (1 - p);
    }

    // User manual click overrides
    let tapDisplacement = 0;
    if (this.isClicking) {
      const clickP = Math.sin(this.clickProgress * Math.PI);
      tapDisplacement = clickP * 18;
      btnScale = 1.0 - clickP * 0.12;
      btnDepress = clickP * 6;
      isAutoTapping = true;
    }

    // Gentle organic swaying
    const swayX = Math.cos(this.time * 1.5) * 1.5;
    const swayY = Math.sin(this.time * 2.0) * 2.0;

    // Center the hand horizontally (hand center is column 18.5)
    const startX = Math.round(w / 2 - 18.5 * this.cell + swayX);
    // Vertical placement: place hand so target button is comfortably framed near top
    const startY = Math.round(75 + swayY - autoLift - tapDisplacement);

    // Fingertip coordinates (tip of pointing index finger)
    const tipX = startX + 23.5 * this.cell;
    const tipY = startY + 0.5 * this.cell;

    // Button coordinates: centered directly above the index finger & hand
    const btnW = 210;
    const btnH = 34;
    const btnX = tipX;
    const btnY = 50 + swayY * 0.5 + btnDepress;

    // 4. Render the Glowing Interactive Pill Button
    this.drawTargetButton(ctx, btnX, btnY, btnW, btnH, btnScale, isAutoTapping, autoRipple);

    // 5. Render ASCII matrix characters and blue blocks
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
        const shimmer = 0.82 + 0.18 * Math.sin(this.time * 4.2 + x * 0.4 + y * 0.3);

        if (char === 'B') {
          // Electric cyan/cobalt blue solid tile
          const sq = this.cell * 0.88;
          const flare = isAutoTapping ? 1.35 : 1.0;
          const bluePulse = 0.88 + 0.12 * Math.sin(this.time * 3.5 + y * 0.3);
          ctx.save();
          ctx.fillStyle = `rgba(46, 136, 255, ${Math.min(1, shimmer * bluePulse * flare)})`;
          ctx.shadowColor = '#00d4ff';
          ctx.shadowBlur = isAutoTapping ? 16 : 8;
          ctx.fillRect(posX - sq * 0.5, posY - sq * 0.5, sq, sq);
          ctx.restore();
        } else if (char === '●') {
          // Pure white dense filled circle
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
          ctx.shadowBlur = isAutoTapping ? 8 : 4;
          ctx.fillText('●', posX, posY);
          ctx.restore();
        } else if (char === 'X') {
          // Bright matrix X
          ctx.save();
          ctx.fillStyle = `rgba(240, 242, 248, ${shimmer * 0.95})`;
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
        ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawTargetButton(ctx, cx, cy, w, h, scale, isTapping, rippleProg) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const r = h / 2;
    const x = -w / 2;
    const y = -h / 2;

    // Frosted glass background
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = isTapping ? 'rgba(0, 180, 255, 0.18)' : 'rgba(12, 14, 20, 0.75)';
    ctx.fill();

    // Glowing electric neon border
    ctx.strokeStyle = isTapping ? '#00f0ff' : 'rgba(0, 220, 255, 0.72)';
    ctx.lineWidth = isTapping ? 2.2 : 1.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = isTapping ? 22 : 12;
    ctx.stroke();

    // Button Typography: [ ✦ CLICK TO SHOW THE LOVE ↑ ]
    ctx.shadowBlur = isTapping ? 10 : 0;
    ctx.fillStyle = isTapping ? '#ffffff' : '#f0f4f8';
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.letterSpacing = '1.8px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦ CLICK TO SHOW THE LOVE ↑', 0, 1);

    ctx.restore();

    // Continuous video-like shockwave rings radiating outward on click
    if (rippleProg > 0) {
      const ringW = w * 0.5 + rippleProg * 70;
      const ringH = h * 0.5 + rippleProg * 45;
      const alpha = (1.0 - rippleProg) * 0.85;

      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(cx, cy, ringW, ringH, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Manual user click expanding shockwave
    if (this.isClicking) {
      const ringR = this.clickProgress * 95;
      const alpha = 1.0 - this.clickProgress;

      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 3.0;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

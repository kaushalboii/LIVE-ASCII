/**
 * Photorealistic After Effects ASCII Hand Renderer
 * Recreates the exact After Effects style ASCII pointing hand from @easebysrish reference video:
 * - Exact 30x56 character matrix from the reference breakdown video
 * - Character palette: '●' (dense filled circles), 'X', '1', '/'
 * - Electric cyan/cobalt blue square accent blocks ('■') along the knuckles and left rim silhouette
 * - Smooth breathing sway and digital character shimmer
 * - Circular click target with upward arrow (↑)
 * - Fingertip tap displacement & shockwave ring upon click
 * - Pure black canvas with faint dot matrix background
 */

const HAND_GRID = [
  '                        /     ',
  '          /           111     ',
  '        X●●●/         1X11    ',
  '        ●●X●●         1XXX    ',
  '       /●●●●●         1X●X    ',
  '        ●●●●●         /X●X1   ',
  '        1●●●          /XXXX   ',
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

    // Set internal resolution
    this.canvas.width = 340;
    this.canvas.height = 580;
  }

  triggerClick() {
    this.isClicking = true;
    this.clickProgress = 0;
  }

  update(dt = 0.016) {
    this.time += dt;

    if (this.isClicking) {
      this.clickProgress += dt * 3.2;
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

    // 3. Motion dynamics: gentle sway + tap displacement
    const swayY = Math.sin(this.time * 2.2) * 3.5;
    const swayX = Math.cos(this.time * 1.4) * 1.5;
    let tapDisplacement = 0;
    if (this.isClicking) {
      tapDisplacement = Math.sin(this.clickProgress * Math.PI) * 14;
    } else if (this.isHovered) {
      tapDisplacement = 4;
    }

    // Origin to center the 30x56 grid
    const totalGridW = this.cols * this.cell;
    const totalGridH = this.rows * this.cell;
    const startX = Math.round((w - totalGridW) / 2 + swayX);
    const startY = Math.round((h - totalGridH) / 2 + swayY - tapDisplacement);

    // 4. Render ASCII matrix characters and blue blocks
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

        // Digital shimmer effect matching After Effects ASCII rendering
        const shimmer = 0.82 + 0.18 * Math.sin(this.time * 3.8 + x * 0.35 + y * 0.25);

        if (char === 'B') {
          // Electric cyan/cobalt blue solid tile
          const sq = this.cell * 0.88;
          const bluePulse = 0.88 + 0.12 * Math.sin(this.time * 3.2 + y * 0.3);
          ctx.save();
          ctx.fillStyle = `rgba(46, 136, 255, ${shimmer * bluePulse})`;
          ctx.shadowColor = '#00d4ff';
          ctx.shadowBlur = 8;
          ctx.fillRect(posX - sq * 0.5, posY - sq * 0.5, sq, sq);
          ctx.restore();
        } else if (char === '●') {
          // Pure white dense filled circle
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
          ctx.shadowBlur = 4;
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

    // 5. Draw Target Circle with Upward Arrow (↑)
    this.drawTargetCircle(ctx, startX, startY);
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

  drawTargetCircle(ctx, startX, startY) {
    // The target circle ( ↑ ) sits above the hand at columns 11-13, rows 3-5
    const circleX = startX + 12 * this.cell;
    const circleY = startY + 4 * this.cell;

    ctx.save();

    // Pulsing circle ring
    const pulse = Math.sin(this.time * 3.8) * 1.5;
    const r = 14 + pulse;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(circleX, circleY, r, 0, Math.PI * 2);
    ctx.stroke();

    // Upward arrow icon (↑)
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(circleX, circleY - 6);
    ctx.lineTo(circleX - 5, circleY);
    ctx.lineTo(circleX - 2, circleY);
    ctx.lineTo(circleX - 2, circleY + 6);
    ctx.lineTo(circleX + 2, circleY + 6);
    ctx.lineTo(circleX + 2, circleY);
    ctx.lineTo(circleX + 5, circleY);
    ctx.closePath();
    ctx.fill();

    // Expanding shockwave ring upon click
    if (this.isClicking) {
      const tipX = startX + 24 * this.cell;
      const tipY = startY + 2 * this.cell;
      const ringR = this.clickProgress * 75;
      const alpha = 1.0 - this.clickProgress;

      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(tipX, tipY, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Second ring from circle
      ctx.beginPath();
      ctx.arc(circleX, circleY, ringR * 0.85, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

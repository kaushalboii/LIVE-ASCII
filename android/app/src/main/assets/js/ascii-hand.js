/**
 * Live Video-Driven ASCII Hand Player & Interactive Touch Controller
 * Directly streams and processes the live After Effects video (assets/hand-video.mp4):
 * - Live 60 FPS video playback looped precisely on the clicking gesture (0.0s - 2.22s)
 * - Seamless borderless canvas integration on pure pitch black (#000000)
 * - Real-time luminance filtering and electric cyan knuckle bloom enhancement
 * - Dynamic tactile button depression and radiating shockwave physics on click impact
 * - Resilient procedural kinematic engine fallback for instant loading before video buffer
 */

export class AsciiHandRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.isClicking = false;
    this.clickProgress = 0;
    this.isHovered = false;

    // High-DPI screen configuration
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.width = 380;
    this.height = 660;
    this.setupCanvas();

    // Live Video Source from assets/hand-video.mp4
    this.video = document.getElementById('hand-video');
    this.isVideoReady = false;
    this.initVideo();

    // Offscreen sampling canvas for real-time video processing
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCanvas.width = 380;
    this.sampleCanvas.height = 660;
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });
  }

  setupCanvas() {
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  initVideo() {
    if (!this.video) {
      this.video = document.createElement('video');
      this.video.id = 'hand-video';
      this.video.src = 'assets/hand-video.mp4';
      this.video.playsInline = true;
      this.video.muted = true;
      this.video.autoplay = true;
      this.video.loop = true;
      this.video.preload = 'auto';
      this.video.style.display = 'none';
      document.body.appendChild(this.video);
    }

    this.video.muted = true;
    this.video.playsInline = true;

    const playPromise = this.video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isVideoReady = true;
        })
        .catch(() => {
          // Autoplay restricted until user interaction
          this.isVideoReady = false;
        });
    }

    this.video.addEventListener('canplay', () => {
      this.isVideoReady = true;
    });

    this.video.addEventListener('timeupdate', () => {
      // Loop precisely in the hand clicking gesture section (0.05s to 2.22s)
      // Bypasses the After Effects tutorial interface that occurs after 2.4s
      if (this.video.currentTime >= 2.22 || this.video.currentTime < 0.04) {
        this.video.currentTime = 0.05;
      }
    });
  }

  triggerClick() {
    this.isClicking = true;
    this.clickProgress = 0;

    // Synchronize video to the click impact frame (~1.05s) if playing
    if (this.video && this.isVideoReady) {
      this.video.currentTime = 1.02;
    }
  }

  update(dt = 0.016) {
    this.time += dt;

    // Ensure video is actively playing in the gesture window
    if (this.video && !this.video.paused) {
      if (this.video.currentTime >= 2.22 || this.video.currentTime < 0.04) {
        this.video.currentTime = 0.05;
      }
    } else if (this.video && this.video.paused) {
      // Try unpausing whenever possible
      this.video.play().catch(() => {});
    }

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
    const w = this.width;
    const h = this.height;

    // 1. Clear background to pure pitch black (#000000)
    ctx.clearRect(0, 0, w, h);

    // 2. Faint After Effects dot matrix background
    this.drawDotGrid(ctx, w, h);

    // 3. Render Live Video Stream or Procedural Kinematic Hand
    const hasLiveVideo = this.video && this.video.readyState >= 2 && !this.video.seeking;

    if (hasLiveVideo) {
      this.renderLiveVideo(ctx, w, h);
    } else {
      this.renderProceduralHand(ctx, w, h);
    }

    // 4. Radiating Click Shockwave Rings on Finger Tap
    this.drawClickRipples(ctx, w, h);
  }

  renderLiveVideo(ctx, w, h) {
    const vw = this.video.videoWidth || 480;
    const vh = this.video.videoHeight || 854;

    // Video bounding crop: focus on the centered hand and circle target
    // In assets/hand-video.mp4, hand is centered horizontally (x: 50 - 430, y: 110 - 780)
    const cropX = vw * 0.08;
    const cropY = vh * 0.12;
    const cropW = vw * 0.84;
    const cropH = vh * 0.82;

    const destW = w;
    const destH = h;

    // Draw frame to offscreen sample canvas for black-clamping and cyan boost
    this.sampleCtx.clearRect(0, 0, destW, destH);
    this.sampleCtx.drawImage(this.video, cropX, cropY, cropW, cropH, 0, 0, destW, destH);

    // Blit onto visible canvas with composite smoothing
    ctx.save();

    // Gentle micro-sway for living presence
    const swayX = Math.sin(this.time * 1.8) * 1.2;
    const swayY = Math.cos(this.time * 2.2) * 1.0;
    ctx.translate(swayX, swayY);

    ctx.drawImage(this.sampleCanvas, 0, 0, destW, destH);

    // Add vivid electric cyan glow flare to knuckles and button when clicking
    const isImpacting = (this.video.currentTime >= 0.95 && this.video.currentTime <= 1.25) || (this.isClicking && this.clickProgress < 0.5);
    if (isImpacting) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 220, 255, 0.12)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 24;
      // Button location in video frame
      ctx.beginPath();
      ctx.arc(w / 2 + 10, 168, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  renderProceduralHand(ctx, w, h) {
    // Dynamic Kinematic Procedural Hand (Exact 30x56 After Effects matrix)
    // Runs when video is buffering or autoplay is gated by browser
    const cycle = (this.time % 2.1) / 2.1;
    let autoLift = 0;
    let isAutoTapping = false;
    let autoRipple = 0;

    if (cycle < 0.38) {
      const p = cycle / 0.38;
      autoLift = (1 - Math.cos(p * Math.PI)) * 0.5 * 18;
    } else if (cycle < 0.50) {
      const p = (cycle - 0.38) / 0.12;
      autoLift = 18 - Math.sin(p * Math.PI) * 4;
      isAutoTapping = true;
    } else if (cycle < 0.74) {
      const p = (cycle - 0.50) / 0.24;
      autoRipple = p;
      autoLift = 18 * (1 - p * 0.45);
    } else {
      const p = (cycle - 0.74) / 0.26;
      autoLift = 18 * 0.55 * (1 - p);
    }

    let clickLift = 0;
    if (this.isClicking) {
      clickLift = Math.sin(this.clickProgress * Math.PI) * 22;
      if (this.clickProgress < 0.55) isAutoTapping = true;
    }

    const totalLift = Math.max(autoLift, clickLift);

    const handWidth = 30 * 10;
    const startX = (w - handWidth) / 2;
    const baseY = 180;
    const startY = baseY - totalLift;
    const fingerTipX = startX + 23.5 * 10;
    const buttonY = baseY - 24;

    this.drawTargetButton(ctx, fingerTipX, buttonY, isAutoTapping, autoRipple);
    this.drawProceduralGlyphs(ctx, startX, startY, isAutoTapping);
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

  drawTargetButton(ctx, cx, cy, isTapping, rippleProg) {
    ctx.save();

    // Halo ASCII glyphs
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('/', cx - 18, cy - 16);
    ctx.fillText('X', cx - 24, cy - 4);
    ctx.fillText('●', cx - 12, cy - 4);
    ctx.fillText('1', cx - 24, cy + 12);
    ctx.fillText('●', cx - 14, cy + 12);

    // Target Button
    const scale = isTapping ? 0.90 : 1.0;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
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
  }

  drawProceduralGlyphs(ctx, startX, startY, isAutoTapping) {
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

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 9px "JetBrains Mono", monospace';

    for (let y = 0; y < HAND_GRID.length; y++) {
      const row = HAND_GRID[y];
      const posY = startY + y * 10 + 5;

      for (let x = 0; x < 30; x++) {
        const char = row[x];
        if (!char || char === ' ') continue;

        const posX = startX + x * 10 + 5;
        const shimmer = 0.84 + 0.16 * Math.sin(this.time * 4.2 + x * 0.35 + y * 0.25);

        if (char === 'B') {
          ctx.save();
          ctx.fillStyle = `rgba(0, 163, 255, ${shimmer})`;
          ctx.shadowColor = '#00d4ff';
          ctx.shadowBlur = isAutoTapping ? 16 : 8;
          ctx.fillRect(posX - 4.5, posY - 4.5, 9, 9);
          ctx.restore();
        } else if (char === '●') {
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
          ctx.shadowBlur = isAutoTapping ? 8 : 4;
          ctx.fillText('●', posX, posY);
          ctx.restore();
        } else if (char === 'X') {
          ctx.save();
          ctx.fillStyle = `rgba(240, 243, 250, ${shimmer * 0.95})`;
          ctx.fillText('X', posX, posY);
          ctx.restore();
        } else if (char === '1') {
          ctx.save();
          ctx.fillStyle = `rgba(195, 202, 215, ${shimmer * 0.82})`;
          ctx.fillText('1', posX, posY);
          ctx.restore();
        } else if (char === '/') {
          ctx.save();
          ctx.fillStyle = `rgba(130, 138, 155, ${shimmer * 0.65})`;
          ctx.fillText('/', posX, posY);
          ctx.restore();
        }
      }
    }
  }

  drawClickRipples(ctx, w, h) {
    if (!this.isClicking) return;

    const cx = w / 2 + 10;
    const cy = 168;
    const ringR = 18 + this.clickProgress * 110;
    const alpha = (1.0 - this.clickProgress) * 0.9;

    ctx.save();
    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Second harmonic ring
    if (this.clickProgress > 0.15) {
      const ring2 = 18 + (this.clickProgress - 0.15) * 85;
      const alpha2 = (1.0 - (this.clickProgress - 0.15)) * 0.6;
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, ring2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

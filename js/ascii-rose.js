/**
 * Lush Organic 3D ASCII Rose Engine
 * Beautiful botanical English Rose with soft blooming petals,
 * organic foliage, glowing dewdrop highlights, and golden fireflies.
 * (No harsh crosshair lines - pure organic elegance)
 */

export class AsciiRose {
  constructor(canvas, onBloomComplete = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onBloomComplete = onBloomComplete;

    this.isRunning = false;
    this.animId = null;
    this.hasTriggeredBloom = false;
    this.startTime = 0;

    this.FONT_SIZE = 11;
    this.FPS = 30;

    this.initPalettes();
    this.resize();
  }

  clamp(v, lo = 0.0, hi = 1.0) {
    return Math.max(lo, Math.min(hi, v));
  }

  mix(a, b, k) {
    return [
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k,
      a[2] + (b[2] - a[2]) * k
    ];
  }

  initPalettes() {
    this.BUCKETS = [" ", ".'`", ":;,-~", "!/\\|()[]{}<>?+=", "tfjrxnuvczil", "XYUJCLQ0OZmwqpdbkhao", "#MW&8%B", "@$"];
    this.LEVELS = [0.05, 0.12, 0.24, 0.38, 0.52, 0.68, 0.84];

    // Rich velvety crimson palette
    this.ROSE_PAL = {
      deep:  [0.55, 0.01, 0.08], // Deep velvet wine red
      mid:   [0.96, 0.08, 0.22], // Vivid crimson rose
      tip:   [1.00, 0.40, 0.55], // Soft rose petal tips
      sheen: [1.00, 0.82, 0.88]  // Silky dewdrop highlight
    };

    this.STEM_PAL = [0.18, 0.52, 0.20];
    this.LEAF_D = [0.08, 0.38, 0.14];
    this.LEAF_L = [0.32, 0.76, 0.30];
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);

    const probe = document.createElement("canvas").getContext("2d");
    probe.font = `bold ${this.FONT_SIZE}px "Menlo", Consolas, "JetBrains Mono", monospace`;
    this.CW = Math.max(6, Math.round(probe.measureText("M").width));
    this.CH = Math.round(this.FONT_SIZE * 1.18);

    this.COLS = Math.floor(w / this.CW);
    this.ROWS = Math.floor(h / this.CH);
    this.N = this.COLS * this.ROWS;

    this.W = this.COLS * this.CW;
    this.H = this.ROWS * this.CH;

    // Center coordinates
    this.CX = this.W / 2.0;
    this.CY = this.H * 0.42;

    this.buildRoseModel();
  }

  buildRoseModel() {
    // 3D Mathematical Parametric Layers of Rose Petals
    const size = Math.min(this.W, this.H) * 0.24;
    this.petalLayers = [
      // Outer whorl (5 broad reflexing petals)
      { count: 5, rScale: 1.05, wScale: 0.48, lScale: 1.00, thBase: 18, thOpen: 72, curl: 38, off: 0.0, layerIdx: 0 },
      // Mid-outer whorl (5 cupped petals)
      { count: 5, rScale: 0.85, wScale: 0.42, lScale: 0.86, thBase: 12, thOpen: 56, curl: 28, off: 0.5, layerIdx: 1 },
      // Mid-inner whorl (4 tight spiral petals)
      { count: 4, rScale: 0.62, wScale: 0.35, lScale: 0.70, thBase: 8,  thOpen: 40, curl: 20, off: 0.25, layerIdx: 2 },
      // Inner spiral core (3 nestled whorl petals)
      { count: 3, rScale: 0.40, wScale: 0.28, lScale: 0.52, thBase: 5,  thOpen: 24, curl: 12, off: 0.75, layerIdx: 3 }
    ];

    // Background stardust motes & fireflies
    this.fireflies = Array.from({ length: 42 }, () => ({
      x: Math.random() * this.W,
      y: Math.random() * this.H,
      speed: 15 + Math.random() * 35,
      phase: Math.random() * 6.28,
      size: 0.5 + Math.random() * 0.5
    }));
  }

  render(tNow, dt) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const bloomProgress = this.clamp(tNow / 2.8);
    const openness = this.clamp(Math.pow(bloomProgress, 1.4));
    const cx = this.CX;
    const cy = this.CY;
    const baseSize = Math.min(this.W, this.H) * 0.23 * (0.4 + 0.6 * bloomProgress);

    // Grid buffers for ASCII rasterization
    const lum = new Float32Array(this.N);
    const cr = new Float32Array(this.N);
    const cg = new Float32Array(this.N);
    const cb = new Float32Array(this.N);

    const setPixel = (r, c, l, red, green, blue) => {
      if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return;
      const idx = r * this.COLS + c;
      if (l > lum[idx]) {
        lum[idx] = l;
        cr[idx] = red;
        cg[idx] = green;
        cb[idx] = blue;
      }
    };

    // 1. Draw Organic Stem with Gentle Wave
    const stemTop = cy + baseSize * 0.35;
    const stemBottom = this.H * 0.94;
    const stemSteps = 45;

    for (let i = 0; i < stemSteps; i++) {
      const u = i / (stemSteps - 1);
      const sy = stemTop + (stemBottom - stemTop) * u;
      const sx = cx + 18 * Math.sin(u * 2.5 + tNow * 0.5);
      const row = Math.floor(sy / this.CH);
      const col = Math.floor(sx / this.CW);

      const light = 0.55 + 0.35 * Math.cos(u * 3);
      setPixel(row, col, 0.72, this.STEM_PAL[0] * light, this.STEM_PAL[1] * light, this.STEM_PAL[2] * light);
      setPixel(row, col + 1, 0.55, this.STEM_PAL[0] * 0.8, this.STEM_PAL[1] * 0.8, this.STEM_PAL[2] * 0.8);

      // Thorns
      if (i === 16 || i === 28) {
        const side = i === 16 ? 1 : -1;
        setPixel(row, col + side * 2, 0.65, 0.75, 0.18, 0.12);
      }
    }

    // 2. Draw Mathematical Leaves
    const leaves = [
      { yFrac: 0.42, side: -1, len: baseSize * 0.95, ang: -0.65 },
      { yFrac: 0.64, side: 1,  len: baseSize * 0.90, ang: 0.60 }
    ];

    for (const lf of leaves) {
      const ly0 = stemTop + (stemBottom - stemTop) * lf.yFrac;
      const lx0 = cx + 18 * Math.sin(lf.yFrac * 2.5 + tNow * 0.5);
      const leafSteps = 24;

      for (let k = 0; k < leafSteps; k++) {
        const u = k / (leafSteps - 1);
        const lProg = this.clamp((tNow - 0.4) / 1.8);
        if (u > lProg) continue;

        const wProfile = Math.sin(Math.PI * Math.pow(u, 0.65)) * (baseSize * 0.28);
        const curAng = lf.ang + 0.35 * Math.sin(u * 2.2);
        const px = lx0 + lf.side * Math.cos(curAng) * lf.len * u;
        const py = ly0 + Math.sin(curAng) * lf.len * u + 14 * u * u;

        const rCenter = Math.floor(py / this.CH);
        const cCenter = Math.floor(px / this.CW);

        const wCols = Math.max(1, Math.floor(wProfile / this.CW));
        for (let dw = -wCols; dw <= wCols; dw++) {
          const edgeDist = Math.abs(dw) / Math.max(1, wCols);
          const lLight = (0.75 - 0.35 * edgeDist) * (0.8 + 0.2 * Math.cos(u * 8));
          const colMix = this.mix(this.LEAF_D, this.LEAF_L, 0.5 + 0.5 * (1 - edgeDist));
          setPixel(rCenter, cCenter + dw, lLight, colMix[0], colMix[1], colMix[2]);
        }
      }
    }

    // 3. Draw 5 Green Sepals around Rose Base
    const sepalSteps = 16;
    for (let s = 0; s < 5; s++) {
      const sAng = (s * Math.PI * 2 / 5) + 0.3;
      const sLen = baseSize * 0.55;
      for (let k = 0; k < sepalSteps; k++) {
        const u = k / (sepalSteps - 1);
        const sx = cx + Math.cos(sAng) * sLen * u;
        const sy = cy + baseSize * 0.28 + Math.sin(sAng) * sLen * 0.4 * u + 12 * u * u;
        const row = Math.floor(sy / this.CH);
        const col = Math.floor(sx / this.CW);
        setPixel(row, col, 0.68 * (1 - 0.3 * u), 0.20, 0.58, 0.24);
      }
    }

    // 4. Draw Layered Rose Petals (From outer to inner)
    const petals = [];
    for (const wh of this.petalLayers) {
      for (let k = 0; k < wh.count; k++) {
        const phi = (k + wh.off) * (Math.PI * 2 / wh.count) + 0.2;
        const pSize = baseSize * wh.rScale;
        const L = pSize * wh.lScale;
        const W = pSize * wh.wScale;
        const theta = (wh.thBase + wh.thOpen * openness) * (Math.PI / 180);
        const curl = (wh.curl * Math.pow(openness, 1.3)) * (Math.PI / 180);

        petals.push({ phi, L, W, theta, curl, layerIdx: wh.layerIdx });
      }
    }

    // Sort petals so inner layers render with proper occlusion
    petals.sort((a, b) => b.layerIdx - a.layerIdx);

    for (const p of petals) {
      const steps = 18;
      for (let i = 0; i < steps; i++) {
        const u = i / (steps - 1);
        const pTh = p.theta + p.curl * u * u;
        const radDist = p.L * Math.sin(pTh) * u;
        const zDist = p.L * Math.cos(pTh) * u;

        const px = cx + Math.cos(p.phi) * radDist;
        const py = cy - zDist * 0.85 + Math.sin(p.phi) * radDist * 0.35;

        const wProfile = p.W * Math.sin(Math.PI * Math.pow(u, 0.65));
        const wCols = Math.max(1, Math.floor(wProfile / this.CW));

        const r0 = Math.floor(py / this.CH);
        const c0 = Math.floor(px / this.CW);

        for (let dw = -wCols; dw <= wCols; dw++) {
          const q = Math.abs(dw) / Math.max(1, wCols);
          let l = (0.75 + 0.35 * Math.pow(1 - q, 0.6)) * (0.75 + 0.35 * u);
          if (p.layerIdx >= 2) l *= 0.85; // Deep velvety shadows in center

          let col = this.mix(this.ROSE_PAL.deep, this.ROSE_PAL.mid, u * 2.0);
          col = this.mix(col, this.ROSE_PAL.tip, (u - 0.45) * 1.8 + (1 - q) * 0.4);
          if (u > 0.85 && q < 0.3) {
            col = this.mix(col, this.ROSE_PAL.sheen, 0.45);
          }

          setPixel(r0, c0 + dw, this.clamp(l), col[0], col[1], col[2]);
        }
      }
    }

    // 5. Draw Golden Fireflies & Celestial Aura
    for (const ff of this.fireflies) {
      ff.y -= ff.speed * dt;
      ff.x += 8 * Math.sin(tNow * 1.2 + ff.phase) * dt;
      if (ff.y < 0) {
        ff.y = this.H;
        ff.x = Math.random() * this.W;
      }
      const fr = Math.floor(ff.y / this.CH);
      const fc = Math.floor(ff.x / this.CW);
      const pulse = 0.5 + 0.5 * Math.sin(tNow * 4 + ff.phase);
      if (pulse > 0.35) {
        setPixel(fr, fc, pulse * 0.95, 1.0, 0.88, 0.42);
      }
    }

    // 6. Draw to Canvas using Character Buckets
    this.ctx.font = `bold ${this.FONT_SIZE}px "Menlo", Consolas, "JetBrains Mono", monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const idx = r * this.COLS + c;
        const L = lum[idx];
        if (L < 0.05) continue;

        let level = 0;
        while (level < this.LEVELS.length && L >= this.LEVELS[level]) level++;
        if (level === 0) continue;

        const bucket = this.BUCKETS[level] || "@";
        const char = bucket[(c * 3 + r * 7) % bucket.length];

        const red = Math.min(255, Math.floor(cr[idx] * 255));
        const green = Math.min(255, Math.floor(cg[idx] * 255));
        const blue = Math.min(255, Math.floor(cb[idx] * 255));

        const px = (c + 0.5) * this.CW;
        const py = (r + 0.5) * this.CH;

        this.ctx.fillStyle = `rgb(${red},${green},${blue})`;
        this.ctx.fillText(char, px, py);
      }
    }

    // Full bloom callback (~2.8s)
    if (tNow >= 2.8 && !this.hasTriggeredBloom) {
      this.hasTriggeredBloom = true;
      if (this.onBloomComplete) {
        this.onBloomComplete();
      }
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.hasTriggeredBloom = false;
    this.startTime = performance.now();
    let lastTime = this.startTime;

    const tick = (now) => {
      if (!this.isRunning) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = (now - this.startTime) / 1000;
      this.render(t, dt);
      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  reset() {
    this.stop();
    this.hasTriggeredBloom = false;
    this.startTime = performance.now();
  }
}

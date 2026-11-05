/**
 * Pure Mathematical ASCII Rose Engine
 * Derived directly from the user's Python script (lines 580 to 950).
 * 
 * Features:
 * - Mathematical parametric sampling of blooming English rose:
 *   - Inner spiral whorl core
 *   - 4 concentric petal layers with mathematical curl profiles
 *   - Calyx cup & receptacle
 *   - Sinuous curved stem with thorns
 *   - Serrated leaves with curved veins
 *   - Radiating sepals
 * - Volumetric celestial radial light rays (RAYF, RAYM)
 * - Drifting stardust motes and twinkling background stars
 * - Crimson fire ramp (RLUT) with sparkling highlights (*)
 * - Heat bloom formation & glowing rim
 * - onBloomComplete callback to pop up the Cloud Love Note
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

    this.FONT_SIZE = 12;
    this.FPS = 30;

    this.initLuts();
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

  sc(c, k) {
    return [c[0] * k, c[1] * k, c[2] * k];
  }

  ease(t) {
    t = this.clamp(t);
    return t * t * (3 - 2 * t);
  }

  initLuts() {
    const rampLut = (stops, n = 64) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        const v = i / (n - 1);
        for (let k = 0; k < stops.length - 1; k++) {
          const [a, ca] = stops[k];
          const [b, cb] = stops[k + 1];
          if (v <= b) {
            out.push(this.mix(ca, cb, (v - a) / (b - a)));
            break;
          }
        }
      }
      return out;
    };

    const REDS = [
      [0.00, [0.12, 0.00, 0.02]],
      [0.22, [0.42, 0.02, 0.06]],
      [0.45, [0.78, 0.05, 0.12]],
      [0.68, [0.96, 0.12, 0.18]],
      [0.88, [1.00, 0.32, 0.34]],
      [1.00, [1.00, 0.65, 0.62]]
    ];
    this.RLUT = rampLut(REDS);

    const BLUES = [
      [0.00, [0.01, 0.03, 0.16]],
      [0.25, [0.03, 0.14, 0.52]],
      [0.50, [0.10, 0.38, 0.95]],
      [0.75, [0.50, 0.78, 1.00]],
      [1.00, [1.00, 1.00, 1.00]]
    ];
    this.BLUE = rampLut(BLUES);

    const FIRE = [
      [0.00, [0.30, 0.01, 0.00]],
      [0.18, [0.78, 0.05, 0.01]],
      [0.38, [1.00, 0.24, 0.02]],
      [0.60, [1.00, 0.52, 0.05]],
      [0.80, [1.00, 0.80, 0.26]],
      [1.00, [1.00, 0.98, 0.82]]
    ];
    this.FLUT = rampLut(FIRE);

    this.RCH = "-=+*#%&@8";
    this.BGRAMP = ".:-=+*#";
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
    probe.font = `bold ${this.FONT_SIZE}px "Courier New", Consolas, "JetBrains Mono", monospace`;
    this.CW = Math.max(7, Math.round(probe.measureText("M").width));
    this.CH = Math.round(this.FONT_SIZE * 1.25);

    this.COLS = Math.floor(w / this.CW);
    this.ROWS = Math.floor(h / this.CH);

    this.W = this.COLS * this.CW;
    this.H = this.ROWS * this.CH;
    this.S = this.H / 640.0;

    this.RX = this.W / 2.0;
    this.RR = 0.185 * this.H;
    this.RY = 0.33 * this.H;
    this.STEM_Y1 = 0.92 * this.H;
    this.HEAD_B = this.RY + 1.38 * this.RR;
    this.TOP_Y = this.RY - 1.1 * this.RR;
    this.STEM_HW = 0.85 * this.CW;

    this.LAYERS = [
      [1.00, 5, 0.00, 0.17],
      [0.82, 5, 0.90, 0.16],
      [0.65, 4, 1.70, 0.15],
      [0.49, 3, 2.40, 0.13]
    ];
    this.LBASE = [0.34, 0.40, 0.46, 0.52];
    this.SPIR_R = 0.30;

    this.SEPALS = [
      [-0.55, 1.00, 212, 1.00, 0.13, -0.10],
      [-0.22, 1.10, 245, 0.90, 0.11, -0.08],
      [0.55, 1.00, -32, 1.00, 0.13, 0.10],
      [0.22, 1.10, -65, 0.90, 0.11, 0.08],
      [0.00, 1.15, 270, 0.72, 0.10, 0.00]
    ];

    this.LEAVES = [
      [2.10, 150, 1.55, 0.36, 0.16],
      [2.70, 28, 1.45, 0.33, -0.14],
      [3.10, 155, 1.10, 0.26, 0.12]
    ];

    this.THORNS = [
      [0.60 * this.H, 1],
      [0.69 * this.H, -1],
      [0.77 * this.H, 1]
    ];

    this.GREEN_D = [0.04, 0.18, 0.06];
    this.GREEN_L = [0.18, 0.56, 0.22];

    this.HS = Array.from({ length: this.ROWS }, () => Array.from({ length: this.COLS }, () => Math.random()));
    this.HS2 = Array.from({ length: this.ROWS }, () => Array.from({ length: this.COLS }, () => Math.random()));

    this.buildRose();
    this.initBackgroundEffects();
  }

  stemX(y) {
    return this.RX + 0.016 * this.H * Math.sin((y - this.RY) / (0.17 * this.H));
  }

  leafHit(x, y, ax, ay, ang, L, Wd, bend) {
    const D2R = Math.PI / 180;
    const ca = Math.cos(ang * D2R);
    const sa = Math.sin(ang * D2R);
    const dx = x - ax;
    const dy = y - ay;
    const s = (dx * ca - dy * sa) / L;
    if (s < 0 || s > 1) return null;
    const v = dx * sa + dy * ca - bend * L * s * s;
    const w = Wd * Math.sin(Math.PI * Math.pow(s, 0.7)) * (1 + 0.07 * Math.sin(s * 38));
    if (w <= 0.3 || Math.abs(v) > w) return null;
    return [s, v / w];
  }

  layerB(k, th) {
    const [R, n, ph, amp] = this.LAYERS[k];
    const s = ((th + ph) * n / (2 * Math.PI)) % 1.0;
    const ss = s < 0 ? s + 1.0 : s;
    return [R * (1 - amp * (1 - Math.pow(ss, 0.55))), ss];
  }

  roseSample(x, y) {
    const dx = x - this.RX;
    const dy = y - this.RY;

    for (const [ax, ay, ang, L, Wd, bend] of this.SEPALS) {
      const h = this.leafHit(x, y, this.RX + ax * this.RR, this.RY + ay * this.RR, ang, L * this.RR, Wd * this.RR, bend);
      if (h) return ["sepal", h[0], h[1]];
    }

    const ex = dx / this.RR;
    const ey = dy / (this.RR * 0.84);
    const uu = Math.hypot(ex, ey);
    if (uu <= 1.18) {
      const th = Math.atan2(ey, ex);
      const Rth = 1 + 0.045 * Math.cos(5 * th + 0.7) + 0.03 * Math.cos(8 * th + 2.1);
      const u = uu / Rth;
      if (u <= 1.0) {
        if (u < this.SPIR_R) {
          return ["spiral", u / this.SPIR_R, th];
        }
        for (let k = this.LAYERS.length - 1; k >= 0; k--) {
          const [b] = this.layerB(k, th);
          if (u <= b) {
            return ["petal", k, u, th];
          }
        }
      }
    }

    const cx2 = dx / (this.RR * 0.78);
    const cy2 = (dy - this.RR * 0.70) / (this.RR * 0.74);
    if (cx2 * cx2 + cy2 * cy2 <= 1) {
      return ["cup", cx2, cy2];
    }

    const rx_ = dx / (this.RR * 0.20);
    const ry_ = (dy - this.RR * 1.42) / (this.RR * 0.18);
    if (rx_ * rx_ + ry_ * ry_ <= 1) {
      return ["recept", rx_, ry_];
    }

    if (this.HEAD_B - 0.1 * this.RR <= y && y <= this.STEM_Y1) {
      const sxv = this.stemX(y);
      if (Math.abs(x - sxv) <= this.STEM_HW) {
        return ["stem", (x - sxv) / this.STEM_HW, y];
      }
      for (const [ty, sg] of this.THORNS) {
        const f = (y - ty) / (0.028 * this.H);
        if (0 <= f && f <= 1) {
          const e = (x - sxv) * sg - this.STEM_HW;
          if (0 <= e && e <= 2.6 * this.CW * f) {
            return ["thorn", sg];
          }
        }
      }
      for (const [ay, ang, L, Wd, bend] of this.LEAVES) {
        const ayy = this.RY + ay * this.RR;
        const h = this.leafHit(x, y, this.stemX(ayy), ayy, ang, L * this.RR, Wd * this.RR, bend);
        if (h) return ["leaf", h[0], h[1]];
      }
    }

    return null;
  }

  rch(I) {
    const idx = Math.floor(this.clamp(0.20 + 0.80 * I) * (this.RCH.length - 0.01));
    return this.RCH[idx];
  }

  contrast(I) {
    return this.clamp(0.52 + (I - 0.45) * 1.45);
  }

  roseStyle(smp, hs, hs2) {
    const kind = smp[0];

    if (kind === "spiral") {
      const [, u, th] = smp;
      const p = u * 2.6 + th / (2 * Math.PI);
      const f = p - Math.floor(p);
      let I = 0.26 + 0.62 * Math.pow(f, 1.3);
      if (f < 0.16) I *= 0.25 + f * 4.7;
      I *= 0.60 + 0.40 * u;
      I *= 0.74 + 0.52 * (0.5 + 0.5 * Math.cos(th + 2.36));
      I = this.contrast(this.clamp(I * (0.94 + 0.12 * hs)));
      return [this.rch(I), this.RLUT[Math.floor(I * 63)]];
    }

    if (kind === "petal") {
      const [, k, u, th] = smp;
      const [b, s] = this.layerB(k, th);
      const w = u / b;
      let I = this.LBASE[k] + 0.30 * Math.pow(w, 2.0);
      if (w > 0.88) I += 0.34 * (w - 0.88) / 0.12;
      const bn = (k + 1 < this.LAYERS.length) ? this.layerB(k + 1, th)[0] : this.SPIR_R;
      const g = u - bn;
      if (g < 0.10) I *= 0.25 + 7.5 * Math.max(0.0, g);
      if (s < 0.16) I *= 0.40 + 3.75 * s;
      else if (s > 0.92) I += 0.12;
      const lit = 0.5 + 0.5 * Math.cos(th + 2.36);
      I *= 0.72 + 0.56 * lit;
      I = this.contrast(this.clamp(I * (0.94 + 0.12 * hs)));
      if (hs2 > 0.985 && w > 0.5) {
        return ["*", [1.0, 0.75, 0.70]];
      }
      return [this.rch(I), this.RLUT[Math.floor(I * 63)]];
    }

    if (kind === "cup") {
      const [, cx2, cy2] = smp;
      const seam = Math.abs(Math.sin((cx2 * 1.6 + cy2 * 0.4) * Math.PI * 1.5));
      let I = 0.36 + 0.20 * (-cx2) + 0.08 * (-cy2);
      I *= 0.55 + 0.45 * Math.pow(seam, 0.6);
      I *= 1 - 0.35 * (cx2 * cx2 + cy2 * cy2) * 0.8;
      I = this.contrast(this.clamp(I * (0.9 + 0.2 * hs)));
      return [this.rch(I), this.RLUT[Math.floor(I * 63)]];
    }

    if (kind === "recept") {
      return ["@", this.mix([0.06, 0.22, 0.08], [0.16, 0.48, 0.20], this.clamp(0.5 - 0.5 * smp[1]))];
    }

    if (kind === "stem") {
      const v = smp[1];
      const col = this.mix(this.GREEN_D, this.GREEN_L, this.clamp(0.5 - 0.5 * v));
      return [hs < 0.85 ? "|" : ":", col];
    }

    if (kind === "thorn") {
      return [smp[1] > 0 ? ">" : "<", [0.70, 0.15, 0.10]];
    }

    // Leaf
    const s = smp[1];
    const v = smp[2];
    if (Math.abs(v) < 0.10) {
      return [":", [0.25, 0.70, 0.32]];
    }
    const vein = ((s * 7.0 - Math.abs(v) * 1.5) % 1.0 + 1.0) % 1.0;
    if (vein < 0.10 && kind === "leaf") {
      return [":", [0.20, 0.58, 0.26]];
    }
    let t_ = Math.pow(this.clamp(1 - Math.abs(v)), 1.2) * 0.8 + 0.2 * hs;
    t_ *= 0.8 + 0.4 * (0.5 + 0.5 * v);
    const chars = "#%&";
    const ch = chars[Math.floor(hs * 3) % 3];
    return [ch, this.mix(this.GREEN_D, this.GREEN_L, this.clamp(t_))];
  }

  buildRose() {
    this.RAWR = [];
    for (let r = 0; r < this.ROWS; r++) {
      const y = (r + 0.5) * this.CH;
      for (let c = 0; c < this.COLS; c++) {
        const x = (c + 0.5) * this.CW;
        const smp = this.roseSample(x, y);
        if (smp !== null) {
          this.RAWR.push([r, c, smp, this.HS[r][c], this.HS2[r][c], x, y]);
        }
      }
    }

    this.ROSEMASK = new Set(this.RAWR.map(e => `${e[0]},${e[1]}`));
    this.EDGE = new Set();
    this.HALO = new Set();

    for (const [r, c] of this.RAWR.map(e => [e[0], e[1]])) {
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!this.ROSEMASK.has(`${r + dr},${c + dc}`)) {
          this.EDGE.add(`${r},${c}`);
        }
      }
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const key = `${r + dr},${c + dc}`;
          if (!this.ROSEMASK.has(key)) {
            this.HALO.add(key);
          }
        }
      }
    }

    this.ROSEC = [];
    const T_FORM = 3.6;
    for (const [r, c, smp, hs, hs2, x, y] of this.RAWR) {
      const [ch, col] = this.roseStyle(smp, hs, hs2);
      const key = this.clamp((y - this.TOP_Y) / (this.STEM_Y1 - this.TOP_Y));
      const tk = 0.2 + key * T_FORM + Math.random() * 0.45;
      const isEdge = this.EDGE.has(`${r},${c}`);
      this.ROSEC.push([tk, r, c, ch, col, x, y, isEdge, hs]);
    }
  }

  initBackgroundEffects() {
    this.NB = 720;
    this.RAYF = new Float32Array(this.NB);
    this.RAYM = new Float32Array(this.NB);

    this.BGE = [];
    for (let r = 0; r < this.ROWS; r++) {
      const y = (r + 0.5) * this.CH;
      for (let c = 0; c < this.COLS; c++) {
        if (this.ROSEMASK.has(`${r},${c}`)) continue;
        const x = (c + 0.5) * this.CW;
        const dx = x - this.RX;
        const dy = y - this.RY;
        const a = Math.atan2(dy, dx);
        const dn = Math.hypot(dx, dy) / (0.55 * this.H);
        const ab = Math.floor(((a + Math.PI) / (2 * Math.PI)) * this.NB) % this.NB;
        const isHalo = this.HALO.has(`${r},${c}`);
        this.BGE.push([r, c, ab, dn, isHalo]);
      }
    }

    this.MOTES = Array.from({ length: 48 }, () => [
      Math.random() * this.W,
      Math.random() * this.H,
      (0.01 + Math.random() * 0.035) * this.H,
      Math.random() * 6.28,
      0.5 + Math.random() * 0.5
    ]);

    this.STARS = [];
    for (let i = 0; i < 65; i++) {
      const rr = Math.floor(Math.random() * this.ROWS);
      const cc = Math.floor(Math.random() * this.COLS);
      if (!this.ROSEMASK.has(`${rr},${cc}`)) {
        this.STARS.push([rr, cc, Math.random() * 6.28, 0.6 + Math.random() * 1.6]);
      }
    }
  }

  bgTables(tt) {
    for (let i = 0; i < this.NB; i++) {
      const a = -Math.PI + (i + 0.5) * (2 * Math.PI / this.NB);
      const r1 = Math.pow(0.5 + 0.5 * Math.sin(a * 23 + 1.6 * Math.sin(a * 3 + tt * 0.15) + tt * 0.10), 6);
      const r2 = Math.pow(0.5 + 0.5 * Math.sin(a * 47 - tt * 0.12 + 1.5 * Math.sin(a * 5 - tt * 0.10)), 9);
      const r3 = Math.pow(0.5 + 0.5 * Math.sin(a * 11 + tt * 0.08), 4);
      this.RAYF[i] = 0.55 * r1 + 0.50 * r2 + 0.20 * r3;

      let mn = 0.0;
      for (let k = 0; k < 8; k++) {
        const d = Math.abs(((a - k * Math.PI / 4 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
        if (d < 0.3) {
          mn += (k % 2 === 0 ? 1.0 : 0.65) * Math.exp(-Math.pow(d / 0.045, 2)) * (0.88 + 0.12 * Math.sin(tt * 0.9 + k * 1.3));
        }
      }
      this.RAYM[i] = mn;
    }
  }

  bgEval(e, gt) {
    const [r, c, ab, dn, halo] = e;
    const core = Math.exp(-dn * 2.8);
    const glow = Math.exp(-dn * 1.3);
    let I = (0.95 * core + 0.16 * glow +
             0.62 * this.RAYF[ab] * Math.exp(-dn * 1.9) +
             0.85 * this.RAYM[ab] * Math.exp(-dn * 1.05)) * gt;
    if (halo) I *= 0.22;
    if (I < 0.05) return null;
    I = Math.min(I, 1.3);
    const ch = this.BGRAMP[Math.min(this.BGRAMP.length - 1, Math.floor(I * this.BGRAMP.length * 0.8))];
    const lutIdx = Math.floor(this.clamp(I) * 63);
    return [ch, this.BLUE[lutIdx]];
  }

  render(t, dt) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const grid = {};
    const gt = this.ease((t - 1.2) / 3.0);

    // 1. Dynamic background volumetric rays
    if (gt > 0.003) {
      this.bgTables(t);
      for (const e of this.BGE) {
        const res = this.bgEval(e, gt);
        if (res) {
          grid[`${e[0]},${e[1]}`] = res;
        }
      }
    }

    // 2. Stars
    const base = 0.20 + 0.80 * gt;
    for (const [rr, cc, ph, sp] of this.STARS) {
      const v = 0.5 + 0.5 * Math.sin(t * sp + ph);
      if (v > 0.35) {
        const a = base * (v - 0.35) / 0.65;
        const ch = v > 0.9 ? "*" : v > 0.7 ? "+" : ".";
        const col = this.mix([0.70, 0.85, 1.0], [0.95, 0.98, 1.0], v);
        grid[`${rr},${cc}`] = [ch, this.sc(col, 0.3 + 0.7 * a)];
      }
    }

    // 3. Drifting motes
    if (gt > 0.02) {
      for (const p of this.MOTES) {
        p[1] -= p[2] * dt;
        p[0] += 6 * this.S * Math.sin(t * 0.8 + p[3]) * dt;
        if (p[1] < -4) {
          p[1] = this.H + 4;
          p[0] = Math.random() * this.W;
        }
        const rr = Math.floor(p[1] / this.CH);
        const cc = Math.floor(p[0] / this.CW);
        if (0 <= rr && rr < this.ROWS && 0 <= cc && cc < this.COLS && !this.ROSEMASK.has(`${rr},${cc}`)) {
          const v = gt * p[4] * (0.5 + 0.5 * Math.sin(t * 1.7 + p[3]));
          if (v > 0.12) {
            const ch = v < 0.5 ? "." : ":";
            const col = this.mix([0.55, 0.75, 1.0], [0.95, 0.98, 1.0], p[4]);
            grid[`${rr},${cc}`] = [ch, this.sc(col, 0.4 + 0.6 * v)];
          }
        }
      }
    }

    // 4. The Blooming Rose Petals & Foliage
    const rim = 0.65 * gt;
    for (const [tk, r, c, ch, col, x, y, ed, hs] of this.ROSEC) {
      if (t < tk) continue;
      const heat = 1.0 - (t - tk);
      let cellCol = col;
      let cellCh = ch;

      if (heat > 0) {
        const hh = Math.pow(heat, 1.4);
        const lutIdx = Math.floor(this.clamp(0.35 + 0.65 * hh) * 63);
        cellCol = this.mix(cellCol, this.FLUT[lutIdx], this.clamp(hh * 1.15));
        if (hh > 0.5) cellCh = "@";
      } else if (ed && rim > 0.01) {
        cellCol = this.mix(cellCol, [0.72, 0.88, 1.0], rim);
        if (hs > 0.9 && Math.sin(t * 3 + hs * 40) > 0.85) {
          cellCh = "*";
          cellCol = [0.90, 0.96, 1.0];
        }
      }
      grid[`${r},${c}`] = [cellCh, cellCol];
    }

    // 5. Draw to canvas
    this.ctx.font = `bold ${this.FONT_SIZE}px "Courier New", Consolas, "JetBrains Mono", monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    for (const [key, val] of Object.entries(grid)) {
      const [r, c] = key.split(',').map(Number);
      const [char, col] = val;
      const px = (c + 0.5) * this.CW;
      const py = (r + 0.5) * this.CH;

      const cr = Math.min(255, Math.max(0, Math.floor(col[0] * 255)));
      const cg = Math.min(255, Math.max(0, Math.floor(col[1] * 255)));
      const cb = Math.min(255, Math.max(0, Math.floor(col[2] * 255)));

      this.ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      this.ctx.fillText(char, px, py);
    }

    // Full bloom check (~4.5s)
    if (t >= 4.5 && !this.hasTriggeredBloom) {
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

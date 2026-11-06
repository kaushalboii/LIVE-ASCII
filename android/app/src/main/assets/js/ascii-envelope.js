/**
 * Pure ASCII Interactive Envelope & Fire Burn Engine
 * Ported from Python/Tkinter ASCII simulation to HTML5 Canvas.
 * 
 * Features:
 * - Sealed kraft envelope with diagonal airmail border (Red / Ivory / Royal Blue)
 * - Authentic 5x3 font glyphs spelling "FOR YOU"
 * - Parametric heart wax seal: (X^2 + Y^2 - 1)^3 - X^2 * Y^3 <= 0
 * - Click interaction: expanding ripple rings and radial sparks
 * - Cellular fire simulation (HEAT diffusion grid)
 * - Burning envelope front with flying ember sparks and rising smoke motes
 * - onBurnComplete callback to transition into the blooming flowers
 */

export class AsciiEnvelope {
  constructor(canvas, onBurnComplete = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onBurnComplete = onBurnComplete;

    this.isRunning = false;
    this.isBurning = false;
    this.burnStartTime = 0;
    this.animId = null;

    // Grid config
    this.FONT_SIZE = 12;
    this.FPS = 30;
    this.ROWS = 36;
    this.COLS = 64;
    this.CW = 8;
    this.CH = 14;

    this.sparks = [];
    this.smoke = [];
    this.bits = [];
    this.frame = 0;
    this.hasTriggeredComplete = false;

    // Perlin / Value noise tables
    this._P = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._P[i], this._P[j]] = [this._P[j], this._P[i]];
    }
    this._N = Array.from({ length: 256 }, () => Math.random() * 2 - 1);

    // Heat grid
    this.HEAT = [];
    this.st = { burst: false, click: false, hot: false };

    this.initLuts();
    this.initGlyphs();
    this.resize();
  }

  initLuts() {
    const mix = (a, b, k) => [
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k,
      a[2] + (b[2] - a[2]) * k
    ];

    const rampLut = (stops, n = 64) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        const v = i / (n - 1);
        for (let k = 0; k < stops.length - 1; k++) {
          const [a, ca] = stops[k];
          const [b, cb] = stops[k + 1];
          if (v <= b) {
            out.push(mix(ca, cb, (v - a) / (b - a)));
            break;
          }
        }
      }
      return out;
    };

    this.FIRE_STOPS = [
      [0.00, [0.35, 0.01, 0.00]],
      [0.18, [0.85, 0.08, 0.01]],
      [0.38, [1.00, 0.32, 0.02]],
      [0.60, [1.00, 0.65, 0.08]],
      [0.80, [1.00, 0.88, 0.32]],
      [1.00, [1.00, 0.98, 0.88]]
    ];
    this.LUT = rampLut(this.FIRE_STOPS);

    this.FSET = {
      1: ".'", 2: ":.", 3: "^'", 4: "^*", 5: "*(",
      6: "(+)", 7: "%&", 8: "#%", 9: "#@", 10: "@"
    };
  }

  initGlyphs() {
    this.GLYPH = {
      "F": ["###", "#..", "##.", "#..", "#.."],
      "O": ["###", "#.#", "#.#", "#.#", "###"],
      "R": ["##.", "#.#", "##.", "#.#", "#.#"],
      "Y": ["#.#", "#.#", ".#.", ".#.", ".#."],
      "U": ["#.#", "#.#", "#.#", "#.#", "###"],
      " ": ["...", "...", "...", "...", "..."],
    };

    const TEXT = "FOR YOU";
    this.TXT = ["", "", "", "", ""];
    for (let i = 0; i < TEXT.length; i++) {
      const ch = TEXT[i];
      for (let k = 0; k < 5; k++) {
        this.TXT[k] += (this.GLYPH[ch] ? this.GLYPH[ch][k] : "...") + (i < TEXT.length - 1 ? "." : "");
      }
    }
    this.TW = this.TXT[0].length;
  }

  vn(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const x1 = (xi + 1) & 255;
    const y1 = (yi + 1) & 255;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = this._N[this._P[(this._P[xi] + yi) & 255]];
    const b = this._N[this._P[(this._P[x1] + yi) & 255]];
    const c = this._N[this._P[(this._P[xi] + y1) & 255]];
    const d = this._N[this._P[(this._P[x1] + y1) & 255]];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  nz(t, a = 1.0) {
    return (Math.sin(t * 2.1 * a) + 0.7 * Math.sin(t * 3.3 * a + 1.7) + 0.4 * Math.sin(t * 5.7 * a + 0.6)) / 2.1;
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

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    this.ctx.scale(dpr, dpr);

    // Font metrics
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = `bold ${this.FONT_SIZE}px "Courier New", Consolas, "JetBrains Mono", monospace`;
    this.CW = Math.max(7, Math.round(probe.measureText("M").width));
    this.CH = Math.round(this.FONT_SIZE * 1.25);

    this.COLS = Math.floor(w / this.CW);
    this.ROWS = Math.floor(h / this.CH);

    this.W = this.COLS * this.CW;
    this.H = this.ROWS * this.CH;
    this.S = this.H / 640.0;

    // Center and sizing for Envelope in the Bottom-Left
    if (this.W > 720) {
      this.CX = Math.min(260, this.W * 0.18);
      this.ECY = this.H * 0.70;
      const maxEW = Math.min(this.W * 0.28, 330);
      this.EW = Math.max(220, maxEW);
    } else {
      this.CX = this.W * 0.5;
      this.ECY = this.H * 0.77;
      this.EW = Math.min(this.W * 0.72, 250);
    }
    this.EH = 0.64 * this.EW;

    this.EX0 = this.CX - this.EW / 2;
    this.EX1 = this.CX + this.EW / 2;
    this.EY0 = this.ECY - this.EH / 2;
    this.EY1 = this.ECY + this.EH / 2;

    this.FLAP_H = 0.48 * this.EH;
    this.TIPY = this.EY0 + this.FLAP_H;
    this.HR = 0.155 * this.EH;
    this.HCY = this.TIPY - 0.22 * this.HR;

    this.XPL = this.CX - 0.17 * this.EW;
    this.XPR = this.CX + 0.17 * this.EW;
    this.YPL = this.EY0 + this.FLAP_H * (1 - (0.17 * this.EW) / (this.EW / 2));
    this.IGX = this.CX;
    this.IGY = this.HCY;

    // Ink placement
    this.TC0 = Math.floor(this.CX / this.CW - this.TW / 2);
    this.TR0 = Math.floor((this.HCY + 1.25 * this.HR) / this.CH) + 1;

    // Precompute random hash tables
    this.HS = Array.from({ length: this.ROWS }, () => Array.from({ length: this.COLS }, () => Math.random()));
    this.HS2 = Array.from({ length: this.ROWS }, () => Array.from({ length: this.COLS }, () => Math.random()));

    // Heat grid
    this.HEAT = Array.from({ length: this.ROWS + 2 }, () => new Float32Array(this.COLS));

    this.buildEnvelopeGrid();
  }

  heartF(hx, hy, s) {
    const X = hx / s;
    const Y = (hy - 0.25) / s + 0.25;
    return Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y;
  }

  inSeal(x, y) {
    const hx_ = (x - this.CX) / this.HR;
    const hy_ = (this.HCY - y) / this.HR;
    return -1.4 < hx_ && hx_ < 1.4 && -1.3 < hy_ && hy_ < 1.6 && this.heartF(hx_, hy_, 1.0) <= 0;
  }

  ink(r, c) {
    const px = Math.floor((c - this.TC0) / 1.0);
    const py = r - this.TR0;
    return c >= this.TC0 && px >= 0 && px < this.TW && py >= 0 && py < 5 && this.TXT[py][px] === "#";
  }

  envStyle(r, c, x, y, hs, hs2) {
    if (x < this.EX0 || x > this.EX1 || y < this.EY0 || y > this.EY1) {
      return null;
    }

    const hx_ = (x - this.CX) / this.HR;
    const hy_ = (this.HCY - y) / this.HR;

    // 1. Heart wax seal
    if (-1.4 < hx_ && hx_ < 1.4 && -1.3 < hy_ && hy_ < 1.6 && this.heartF(hx_, hy_, 1.0) <= 0) {
      const k = this.clamp(0.5 - 0.30 * hx_ + 0.28 * hy_);
      if (this.heartF(hx_, hy_, 0.90) > 0) {
        return ["#", [0.55, 0.08, 0.18]];
      }
      if (this.heartF(hx_, hy_, 0.70) > 0) {
        const ch = "&%#"[Math.floor(hs * 3) % 3];
        return [ch, this.mix([0.88, 0.22, 0.38], [1.0, 0.65, 0.78], k)];
      }
      if (Math.pow(hx_ + 0.40, 2) + Math.pow(hy_ - 0.60, 2) < 0.045) {
        return ["*", [1.0, 0.95, 0.98]];
      }
      const ch = hs2 > 0.82 ? "@" : "%";
      return [ch, this.mix([0.82, 0.12, 0.28], [1.0, 0.45, 0.62], k)];
    }

    // 2. Inked letters "FOR YOU"
    if (this.ink(r, c)) {
      return ["@", [0.22, 0.10, 0.06]];
    }
    if (this.ink(r - 1, c - 1)) {
      return ["%", [0.48, 0.28, 0.14]];
    }

    // 3. Flap folds
    const fh = this.FLAP_H * (1 - Math.abs(x - this.CX) / (this.EW / 2));
    const dfl = this.EY0 + fh - y;
    if (Math.abs(dfl) < 0.45 * this.CH) {
      return [x < this.CX ? "\\" : "/", [0.18, 0.10, 0.06]];
    }

    let side = false;
    if (dfl < 0) {
      if (x <= this.XPL) {
        const yl = this.EY1 + (this.YPL - this.EY1) * (x - this.EX0) / (this.XPL - this.EX0);
        if (Math.abs(y - yl) < 0.45 * this.CH) {
          return ["/", [0.18, 0.10, 0.06]];
        }
        side = y < yl;
      } else if (x >= this.XPR) {
        const yr = this.YPL + (this.EY1 - this.YPL) * (x - this.XPR) / (this.EX1 - this.XPR);
        if (Math.abs(y - yr) < 0.45 * this.CH) {
          return ["\\", [0.18, 0.10, 0.06]];
        }
        side = y < yr;
      }
    }

    // 4. Airmail diagonal stripes border
    const STRIPE = [
      [0.82, 0.16, 0.18], // Red
      [0.96, 0.92, 0.82], // Ivory
      [0.18, 0.32, 0.72]  // Royal Blue
    ];
    if (x < this.EX0 + 1.4 * this.CW || x > this.EX1 - 1.4 * this.CW ||
        y < this.EY0 + 0.95 * this.CH || y > this.EY1 - 0.95 * this.CH) {
      const idx = Math.floor(((c + r) % 6) / 2);
      return ["/", STRIPE[idx]];
    }

    // 5. Kraft paper texture
    const PAPER = "#%&@8";
    const FLAPC = [0.88, 0.72, 0.50];
    const BODYC = [0.76, 0.58, 0.38];
    const SIDEC = [0.70, 0.52, 0.32];
    const BOTC  = [0.82, 0.65, 0.44];

    const base = dfl >= 0 ? FLAPC : (side ? SIDEC : BOTC);
    let k = (1.06 - 0.20 * (y - this.EY0) / this.EH) * (0.88 + 0.24 * hs2);
    if (dfl < 0 && dfl > -1.4 * this.CH) {
      k *= 0.72 + 0.20 * (-dfl) / (1.4 * this.CH);
    } else if (dfl > 0.45 * this.CH && dfl < 1.4 * this.CH) {
      k *= 1.07;
    }

    const pIdx = Math.floor(hs * PAPER.length) % PAPER.length;
    return [PAPER[pIdx], [base[0] * k, base[1] * k, base[2] * k]];
  }

  buildEnvelopeGrid() {
    this.raw = [];
    this.SHD = [];

    for (let r = 0; r < this.ROWS; r++) {
      const y = (r + 0.5) * this.CH;
      for (let c = 0; c < this.COLS; c++) {
        const x = (c + 0.5) * this.CW;
        const s = this.envStyle(r, c, x, y, this.HS[r][c], this.HS2[r][c]);
        if (s !== null) {
          this.raw.push([r, c, s[0], s[1], x, y]);
        } else if (this.EX0 + 0.9 * this.CW <= x && x <= this.EX1 + 1.8 * this.CW &&
                   this.EY0 + 0.8 * this.CH <= y && y <= this.EY1 + 2.0 * this.CH) {
          this.SHD.push([r, c, x, y]);
        }
      }
    }

    this.MAXD = Math.max(...this.raw.map(e => Math.hypot(e[4] - this.IGX, e[5] - this.IGY)), 1);

    this.T_SPREAD = 2.2; // Time for fire to spread across entire envelope
    this.ENVC = [];
    this.SEALC = [];

    for (const [r, c, ch, col, x, y] of this.raw) {
      const d = Math.hypot(x - this.IGX, y - this.IGY);
      const nzv = this.vn(x * 0.035 + 4, y * 0.035 + 9) * 0.5 + 0.5;
      const tb = this.T_SPREAD * Math.pow(d / this.MAXD, 0.92) + 0.5 * nzv * Math.min(1.0, d / (0.12 * this.H));
      this.ENVC.push([r, c, ch, col, tb, this.HS[r][c], this.HS2[r][c], x, y]);
      if (this.inSeal(x, y)) {
        this.SEALC.push([r, c]);
      }
    }

    this.SHDC = [];
    for (const [r, c, x, y] of this.SHD) {
      const d = Math.hypot(x - this.IGX, y - this.IGY);
      const tb = this.T_SPREAD * Math.pow(d / this.MAXD, 0.92);
      const ex = Math.max(0.0, x - this.EX1, this.EX0 - x);
      const ey = Math.max(0.0, y - this.EY1, this.EY0 - y);
      const f = 1 - this.clamp(Math.hypot(ex, ey) / (2.0 * this.CW));
      const col = [0.12 * (0.35 + 0.65 * f), 0.08 * (0.35 + 0.65 * f), 0.06 * (0.35 + 0.65 * f)];
      this.SHDC.push([r, c, f > 0.45 ? ":" : ".", col, tb, this.HS[r][c]]);
    }
  }

  triggerClick() {
    if (this.isBurning) return;
    this.isBurning = true;
    this.burnStartTime = performance.now() / 1000;
    this.st.click = true;
    this.st.burst = false;

    // Burst radial spark bits
    for (let i = 0; i < 60; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (120 + Math.random() * 440) * this.S;
      this.bits.push([
        this.IGX,
        this.IGY,
        Math.cos(ang) * sp,
        Math.sin(ang) * sp,
        0.0,
        0.5 + Math.random() * 0.7
      ]);
    }

    // Burst upward sparks from seal
    for (let i = 0; i < 160; i++) {
      const a = (-170 + Math.random() * 160) * (Math.PI / 180);
      const sp = (100 + Math.random() * 460) * this.S;
      this.sparks.push([
        this.IGX,
        this.IGY,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        0.0,
        0.6 + Math.random() * 1.2,
        -(25 + Math.random() * 120) * this.S
      ]);
    }
  }

  fireStep(src) {
    const out = {};
    if (!src && !this.st.hot) return out;

    const last = this.COLS - 1;
    let anyhot = false;

    for (let r = 0; r < this.ROWS; r++) {
      const row = this.HEAT[r];
      const b1 = this.HEAT[r + 1];
      const b2 = this.HEAT[r + 2];
      for (let c = 0; c < this.COLS; c++) {
        const q = Math.random();
        const w = q < 0.27 ? Math.max(0, c - 1) : q > 0.73 ? Math.min(last, c + 1) : c;
        const cl = c > 0 ? c - 1 : 0;
        const cr = c < last ? c + 1 : last;
        const v = (b1[w] * 2 + b1[cl] + b1[cr] + b2[c]) * 0.205 - (0.028 + 0.058 * ((q * 7.0) % 1.0));
        row[c] = v > 0 ? v : 0.0;
      }
    }

    if (src) {
      for (const [key, v] of Object.entries(src)) {
        const [r, c] = key.split(',').map(Number);
        if (r < this.ROWS && c < this.COLS && v > this.HEAT[r][c]) {
          this.HEAT[r][c] = v;
        }
      }
    }

    for (let r = 0; r < this.ROWS; r++) {
      const row = this.HEAT[r];
      for (let c = 0; c < this.COLS; c++) {
        const v = row[c];
        if (v > 0.10) {
          anyhot = true;
          const i = Math.min(10, Math.floor(v * 10.5));
          const s = this.FSET[i] || "@";
          const char = s[(c * 3 + r * 7 + this.frame) % s.length];
          const lutIdx = Math.floor(this.clamp(v) * 63);
          out[`${r},${c}`] = [char, this.LUT[lutIdx]];
        } else if (v > 0.01) {
          anyhot = true;
        }
      }
    }
    this.st.hot = anyhot;
    return out;
  }

  drawClick(tNow, dt, grid) {
    const a = tNow - this.burnStartTime;
    if (a < 0 || a > 1.3) return;

    // Expanding shockwave ripple rings
    const rings = [
      { delay: 0.00, c0: [0.65, 0.30, 1.0], c1: [1.0, 0.55, 0.90] },
      { delay: 0.12, c0: [0.55, 0.25, 0.95], c1: [1.0, 0.70, 0.95] },
      { delay: 0.24, c0: [0.50, 0.30, 1.0], c1: [1.0, 0.90, 1.00] }
    ];

    for (const { delay, c0, c1 } of rings) {
      const aa = a - delay;
      if (aa < 0 || aa > 0.85) continue;
      const k = aa / 0.85;
      const rad = 0.02 * this.H + 0.24 * this.H * (1 - Math.pow(1 - k, 2.2));
      const th = (1.8 - 1.0 * k) * this.CW;
      const al = Math.pow(1 - k, 1.2);
      const col = this.mix(c0, c1, k);

      const r0 = Math.max(0, Math.floor((this.IGY - rad - th) / this.CH));
      const r1 = Math.min(this.ROWS - 1, Math.ceil((this.IGY + rad + th) / this.CH));
      const c0_ = Math.max(0, Math.floor((this.IGX - rad - th) / this.CW));
      const c1_ = Math.min(this.COLS - 1, Math.ceil((this.IGX + rad + th) / this.CW));

      for (let rr = r0; rr <= r1; rr++) {
        const y = (rr + 0.5) * this.CH;
        for (let cc = c0_; cc <= c1_; cc++) {
          const x = (cc + 0.5) * this.CW;
          const dist = Math.hypot(x - this.IGX, y - this.IGY);
          const q = Math.abs(dist - rad) / th;
          if (q < 1.0) {
            const v = (1 - q) * al * 1.6;
            const chr = q < 0.35 ? "O" : q < 0.65 ? "o" : ".";
            grid[`${rr},${cc}`] = [chr, [col[0] * v, col[1] * v, col[2] * v]];
          }
        }
      }
    }

    // Spark bits
    const alive = [];
    for (const b of this.bits) {
      b[4] += dt;
      if (b[4] >= b[5]) continue;
      b[2] *= (1 - 2.0 * dt);
      b[3] = b[3] * (1 - 2.0 * dt) + 60 * this.S * dt;
      b[0] += b[2] * dt;
      b[1] += b[3] * dt;
      const k = b[4] / b[5];
      const rr = Math.floor(b[1] / this.CH);
      const cc = Math.floor(b[0] / this.CW);
      if (rr >= 0 && rr < this.ROWS && cc >= 0 && cc < this.COLS) {
        const chr = k < 0.4 ? "*" : k < 0.7 ? "+" : ".";
        const col = this.mix([1.0, 0.92, 1.0], [0.85, 0.35, 0.95], k);
        grid[`${rr},${cc}`] = [chr, [col[0] * (1 - 0.5 * k), col[1] * (1 - 0.5 * k), col[2] * (1 - 0.5 * k)]];
      }
      alive.push(b);
    }
    this.bits = alive;
  }

  render(tNow, dt) {
    this.frame++;
    const grid = {};
    const front = [];
    const src = {};

    const tbn = this.isBurning ? (tNow - this.burnStartTime) : -999;

    // Hover breathing pulse if not burning
    const hoverScale = this.isBurning ? 1.0 : (1.0 + 0.015 * Math.sin(tNow * 2.5));
    const hoverY = this.isBurning ? 0 : 3.0 * Math.sin(tNow * 1.8);

    // 1. Envelope Paper & Burn Simulation
    for (const [r, c, ch, col, tb, hs, hs2, x, y] of this.ENVC) {
      const tau = tbn - tb;
      if (tau >= 1.35) {
        continue; // Completely burnt away!
      }

      if (tau < 0) {
        // Not burning yet
        let ccol = col;
        if (tbn > 0 && tau > -0.55) {
          // Paper charring as flame approaches
          const w = (tau + 0.55) * 1.8;
          ccol = this.mix(col, [0.35, 0.12, 0.04], w * 0.75);
          if (w > 0.6) {
            ccol = this.mix(ccol, [1.0, 0.45, 0.06], (w - 0.6) * 1.3);
          }
        }
        grid[`${r},${c}`] = [ch, ccol];
        continue;
      }

      // Inside fire zone
      if (tau < 0.50) {
        src[`${r},${c}`] = 0.75 + 0.25 * Math.random();
      } else if (tau < 0.95) {
        src[`${r},${c}`] = (0.45 + 0.15 * Math.random()) * (1 - (tau - 0.50) / 0.45);
      }

      if (tau < 0.38) {
        // Active blazing fire front
        const q = tau / 0.38;
        const T = this.clamp(0.98 - 0.62 * q + 0.14 * this.nz(tNow * 9 + hs * 20));
        const chars = q < 0.6 ? "@#&%" : "#%=+";
        const ch2 = chars[Math.floor(hs2 * 4) % 4];
        grid[`${r},${c}`] = [ch2, this.LUT[Math.floor(T * 63)]];
        front.push([x, y]);
      } else {
        // Glowing ember ash
        const a = 1 - (tau - 0.38) / 0.97;
        if (hs2 > Math.pow(a, 0.7)) continue;
        if (((hs * 37.0 + tNow * 1.6) % 1.0) > 0.84 - 0.08 * a) {
          grid[`${r},${c}`] = ["*", this.LUT[Math.floor(this.clamp(0.28 + 0.5 * a) * 63)]];
        } else {
          const kk = 0.45 + 0.9 * a;
          const chAsh = "%#="[Math.floor(hs * 3) % 3];
          grid[`${r},${c}`] = [chAsh, [0.15 * kk, 0.08 * kk, 0.06 * kk]];
        }
      }
    }

    // 2. Heart wax seal pulsing before burn
    if (!this.isBurning) {
      const pulse = 0.5 + 0.5 * Math.sin(tNow * 3.2);
      for (const [r, c] of this.SEALC) {
        const item = grid[`${r},${c}`];
        if (item) {
          const boosted = this.mix(item[1], [1.0, 0.70, 0.85], pulse * 0.28);
          grid[`${r},${c}`] = [item[0], boosted];
        }
      }
    }

    // 3. Flame Cellular Automata
    const fireGrid = this.fireStep(src);
    for (const [key, val] of Object.entries(fireGrid)) {
      grid[key] = val;
    }

    // 4. Click Ripples & Sparks
    if (this.isBurning) {
      this.drawClick(tNow, dt, grid);

      // Spawn rising ember sparks along fire front
      if (front.length > 0 && tbn < this.T_SPREAD + 1.2) {
        const n = Math.floor(340 * dt * Math.min(1.0, front.length / 40.0) + Math.random());
        for (let i = 0; i < n; i++) {
          const [fx, fy] = front[Math.floor(Math.random() * front.length)];
          const a = (-125 + Math.random() * 70) * (Math.PI / 180);
          const sp = (70 + Math.random() * 320) * this.S;
          this.sparks.push([
            fx, fy,
            Math.cos(a) * sp,
            Math.sin(a) * sp,
            0.0,
            0.8 + Math.random() * 1.4,
            -(30 + Math.random() * 130) * this.S
          ]);
        }

        // Spawn smoke wisps
        if (Math.random() < 20 * dt) {
          const [fx, fy] = front[Math.floor(Math.random() * front.length)];
          this.smoke.push([
            fx, fy - 0.04 * this.H,
            (-8 + Math.random() * 16) * this.S,
            -(25 + Math.random() * 45) * this.S,
            0.0,
            1.8 + Math.random() * 1.5,
            Math.random() * 6.28,
            [0.55, 0.48, 0.48]
          ]);
        }
      }

      // Update sparks
      const aliveSparks = [];
      for (const s of this.sparks) {
        s[4] += dt;
        if (s[4] >= s[5]) continue;
        s[2] = s[2] * (1 - 1.3 * dt) + 50 * this.S * Math.sin(s[4] * 7 + s[5] * 20) * dt;
        s[3] += s[6] * dt;
        s[0] += s[2] * dt;
        s[1] += s[3] * dt;
        const k = 1 - s[4] / s[5];
        const rr = Math.floor(s[1] / this.CH);
        const cc = Math.floor(s[0] / this.CW);
        if (rr >= 0 && rr < this.ROWS && cc >= 0 && cc < this.COLS) {
          const chr = k > 0.55 ? "*" : k > 0.30 ? "+" : ".";
          const lutIdx = Math.floor(this.clamp(0.18 + 0.82 * k) * 63);
          grid[`${rr},${cc}`] = [chr, this.LUT[lutIdx]];
        }
        aliveSparks.push(s);
      }
      this.sparks = aliveSparks;

      // Update smoke
      const aliveSmoke = [];
      for (const sm of this.smoke) {
        sm[4] += dt;
        if (sm[4] >= sm[5]) continue;
        const k = sm[4] / sm[5];
        sm[0] += (sm[2] + 14 * this.S * Math.sin(sm[4] * 2.2 + sm[6])) * dt;
        sm[1] += sm[3] * dt;
        const al = Math.sin(Math.PI * k) * 0.45;
        const rr = Math.floor(sm[1] / this.CH);
        const cc = Math.floor(sm[0] / this.CW);
        if (al > 0.10 && rr >= 0 && rr < this.ROWS && cc >= 0 && cc < this.COLS) {
          const sChars = ".:;+";
          const chSm = sChars[Math.min(3, Math.floor(al * 7))];
          grid[`${rr},${cc}`] = [chSm, [sm[7][0] * al, sm[7][1] * al, sm[7][2] * al]];
        }
        aliveSmoke.push(sm);
      }
      this.smoke = aliveSmoke;

      // Check for completion of burn
      if (tbn > this.T_SPREAD + 1.8 && !this.hasTriggeredComplete) {
        this.hasTriggeredComplete = true;
        if (this.onBurnComplete) {
          this.onBurnComplete();
        }
      }
    }

    // 5. Draw all cells to canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = `bold ${this.FONT_SIZE}px "Courier New", Consolas, "JetBrains Mono", monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    for (const [key, val] of Object.entries(grid)) {
      const [r, c] = key.split(',').map(Number);
      const [char, col] = val;

      const px = (c + 0.5) * this.CW;
      const py = (r + 0.5) * this.CH + hoverY;

      const cr = Math.min(255, Math.max(0, Math.floor(col[0] * 255)));
      const cg = Math.min(255, Math.max(0, Math.floor(col[1] * 255)));
      const cb = Math.min(255, Math.max(0, Math.floor(col[2] * 255)));

      this.ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      this.ctx.fillText(char, px, py);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.hasTriggeredComplete = false;
    let lastTime = performance.now();

    const loop = (now) => {
      if (!this.isRunning) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      this.render(now / 1000, dt);
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  reset() {
    this.stop();
    this.isBurning = false;
    this.burnStartTime = 0;
    this.hasTriggeredComplete = false;
    this.sparks = [];
    this.smoke = [];
    this.bits = [];
    this.st.burst = false;
    this.st.click = false;
    this.st.hot = false;
    for (let r = 0; r < this.ROWS + 2; r++) {
      this.HEAT[r].fill(0);
    }
  }
}


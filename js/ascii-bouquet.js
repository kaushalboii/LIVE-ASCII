/**
 * 3D ASCII Botanical Bouquet (The Rose & The Lily Combined)
 * Derived from @arimecoa/GIVEAWAY-ASCII (lily_bouquet.html)
 * 
 * Features:
 * - Left side: Grand 3D Blooming Crimson Rose with velvety spiraling layered petals.
 * - Right side: Grand 3D Blooming Ivory/Blush Lily with curling reflexed petals & golden stamens.
 * - Intertwined graceful stems and lush cascading foliage uniting them into one bouquet.
 * - Vibrant high-contrast color grading (ensures crisp visibility on Retina & high-res screens).
 * - Shimmering multilingual love phrases from international traditions floating around the flowers.
 * - Rising golden stardust fireflies & multi-scale Gaussian bloom.
 * - onBloomComplete callback to pop up the Cloud Love Note.
 */

export class AsciiBouquet {
  constructor(canvas, onBloomComplete = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onBloomComplete = onBloomComplete;
    this.isRunning = false;
    this.animId = null;
    this.t0 = performance.now();
    this.lastDraw = -1e9;
    this.hasTriggeredBloom = false;
    this.init();
  }

  init() {
    const view = this.canvas;
    const ctx = this.ctx;

    // ================================================================ Configuration
    const FONT_SIZE = 10;
    const FPS = 30;
    const FONT = `bold ${FONT_SIZE}px Menlo, Consolas, "DejaVu Sans Mono", "Courier New", monospace`;
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = FONT;
    const CW = Math.max(1, Math.round(probe.measureText("M").width));
    const CH = Math.round(FONT_SIZE * 1.15);

    const ROWS = 160;
    const COLS = Math.max(150, Math.min(640, Math.round(ROWS * CH / CW * innerWidth / Math.max(1, innerHeight))));
    const N = COLS * ROWS;
    const WAVE_PERIOD = 14;
    const BREATH = 7;
    const BREATH_DEPTH = 0.18;
    const settings = { wind: 3.0, size: 1.85, glow: 0.85 };

    const BUCKETS = [" ", ".'`", ":;,-~", "!/\\|()[]{}<>?+=", "tfjrxnuvczil", "XYUJCLQ0OZmwqpdbkhao", "#MW&8%B", "@$"];
    const LEVELS = [0.05, 0.12, 0.25, 0.40, 0.55, 0.70, 0.85];

    const BUD = [0.45, 0.70, 0.30];
    const STEM = [0.22, 0.54, 0.22];
    const ANTHER = [1.00, 0.72, 0.16];

    // Rich, vibrant, luminous palettes
    const PALETTES = {
      red: { // Velvet Crimson Rose
        deep: [0.65, 0.02, 0.12],
        mid:  [0.98, 0.08, 0.22],
        tip:  [1.00, 0.42, 0.55],
        sheen:[1.00, 0.85, 0.90],
        spots: 0
      },
      white: { // Radiant Blush Lily
        deep: [0.48, 0.65, 0.35],
        mid:  [0.98, 0.98, 0.95],
        tip:  [1.00, 0.80, 0.90],
        sheen:[1.00, 1.00, 1.00],
        spots: 0,
        anther: [1.00, 0.75, 0.15]
      },
      coral: { // Warm Sunset Heart Flower
        deep: [0.88, 0.25, 0.15],
        mid:  [1.00, 0.55, 0.35],
        tip:  [1.00, 0.88, 0.75],
        sheen:[1.00, 0.95, 0.90],
        spots: 0
      },
      pink: { // Soft Rosebud
        deep: [0.72, 0.06, 0.32],
        mid:  [1.00, 0.32, 0.60],
        tip:  [1.00, 0.88, 0.94],
        sheen:[1.00, 0.88, 0.95],
        spots: 0
      }
    };

    // Combined Flower Layout:
    // Left: Grand Rose | Right: Grand Lily | Center & Accents: Harmony Blooms
    // Format: [pos[x,y], size, 3d-dir[x,y,z], type("rose"|"lily"), palette, bloomSec, brightness]
    const FLOWERS_BASE = [
      // 1. Left: The Grand Crimson Rose
      [[-26, 78], 23, [-0.38, -0.25, 0.89], "rose", "red", 3.8, 1.05],

      // 2. Right: The Grand Ivory/Blush Lily
      [[26, 76], 22, [0.38, -0.22, 0.90], "lily", "white", 4.0, 1.05],

      // 3. Center Harmony Bloom (uniting both flowers)
      [[0, 48], 17, [0.02, -0.45, 0.89], "rose", "coral", 4.3, 0.95],

      // 4. Upper Left Companion Rosebud
      [[-22, 34], 14, [-0.48, -0.55, 0.68], "rose", "red", 4.6, 0.85],

      // 5. Upper Right Companion Lily
      [[22, 32], 14, [0.48, -0.58, 0.65], "lily", "white", 4.8, 0.85],

      // 6. Lower Left Accent Bloom
      [[-34, 112], 15, [-0.78, 0.08, 0.62], "rose", "pink", 4.5, 0.92],

      // 7. Lower Right Accent Bloom
      [[35, 114], 15, [0.78, 0.10, 0.62], "lily", "white", 4.7, 0.92],
    ];

    // Flower buds
    const BUDS_BASE = [
      [[-10, 14], 8, [-0.25, -0.96, 0.1], 0.0, "red"],
      [[12, 12],  8, [0.28, -0.95, 0.1], 0.9, "white"],
      [[38, 48],  7, [0.80, -0.55, 0.2], 0.0, "coral"],
      [[-38, 50], 7, [-0.80, -0.50, 0.2], 0.7, "red"],
    ];

    // Multilingual love phrases from Snippet 1
    const LOVE_WORDS = [
      { text: "I love you", x: -0.38, y: 0.18, phase: 0.0 },
      { text: "Te amo", x: 0.38, y: 0.20, phase: 1.4 },
      { text: "Je t'aime", x: -0.42, y: 0.42, phase: 2.8 },
      { text: "ฉันรักเธอ", x: 0.42, y: 0.44, phase: 4.2 },
      { text: "愛してる", x: -0.36, y: 0.68, phase: 0.8 },
      { text: "사랑해", x: 0.36, y: 0.70, phase: 2.2 },
      { text: "Seni seviyorum", x: -0.28, y: 0.88, phase: 3.6 },
      { text: "Ti amo", x: 0.28, y: 0.90, phase: 5.0 },
    ];

    // ================================================================ Math Utilities
    const TAU = Math.PI * 2;
    const rad = (d) => d * Math.PI / 180;
    const clamp = (x, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
    function smoothstep(a, b, x) {
      const t = clamp((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    }
    const wave = (t, k, ph = 0) => Math.sin(TAU * k * t / WAVE_PERIOD + ph);

    function hash3(a, b, c) {
      let h = (Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791)) >>> 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
      return (h ^ (h >>> 16)) >>> 0;
    }

    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = (v) => mul(v, 1 / (Math.hypot(v[0], v[1], v[2]) + 1e-9));
    const LIGHT = norm([-0.5, -0.6, 0.62]); // Light from top-left

    // Canvas memory buffers
    const Xc = new Float32Array(COLS);
    const Yr = new Float32Array(ROWS);
    for (let c = 0; c < COLS; c++) Xc[c] = (c + 0.5 - COLS / 2) * 0.5;
    for (let r = 0; r < ROWS; r++) Yr[r] = r + 0.5;

    const lum = new Float32Array(N);
    const rgb = new Float32Array(N * 3);
    const rowShift = new Float32Array(ROWS);
    const bgLum = new Float32Array(N);
    const bgRgb = new Float32Array(N * 3);

    // Warm starlight nebula backdrop
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const r2 = Math.pow(Xc[c] / Math.max(40, COLS * 0.22), 2) + Math.pow((Yr[r] - 78) / 82, 2);
        const i = r * COLS + c;
        if (hash3(r, c, 1) % 100 < 32) {
          bgLum[i] = 0.14 * Math.exp(-r2 * 1.5);
          bgRgb.set([0.55, 0.15, 0.35], i * 3);
        }
      }
    }

    function set(i, l, cr, cg, cb) {
      if (l > lum[i]) {
        lum[i] = l;
        const j = i * 3;
        rgb[j] = cr;
        rgb[j + 1] = cg;
        rgb[j + 2] = cb;
      }
    }

    // Curve brush
    const SEG = new Float64Array(16 * 9);
    function brush(pts, hws, av, fn) {
      const n = pts.length, ns = n - 1;
      if (n < 2) return;
      let xmin = 1e9, xmax = -1e9, ymin = 1e9, ymax = -1e9, maxw = 0;
      for (let k = 0; k < n; k++) {
        const x = pts[k][0], y = pts[k][1];
        if (x < xmin) xmin = x; if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y;
        if (hws[k] > maxw) maxw = hws[k];
      }
      for (let s = 0; s < ns; s++) {
        const o = s * 9, ax = pts[s][0], ay = pts[s][1], dx = pts[s + 1][0] - ax, dy = pts[s + 1][1] - ay;
        SEG[o] = ax; SEG[o + 1] = ay; SEG[o + 2] = dx; SEG[o + 3] = dy; SEG[o + 4] = 1 / (dx * dx + dy * dy + 1e-9);
        SEG[o + 5] = hws[s]; SEG[o + 6] = hws[s + 1] - hws[s]; SEG[o + 7] = av[s]; SEG[o + 8] = av[s + 1] - av[s];
      }
      const pad = maxw + 1;
      const r0 = Math.max(0, Math.floor(ymin - pad)), r1 = Math.min(ROWS, Math.ceil(ymax + pad));
      for (let r = r0; r < r1; r++) {
        const py = Yr[r], sh = rowShift[r];
        let rx0 = 1e9, rx1 = -1e9;
        for (let s = 0, o = 0; s < ns; s++, o += 9) {
          const pw = Math.max(SEG[o + 5], SEG[o + 5] + SEG[o + 6]) + 1;
          const ya = SEG[o + 1], yb = ya + SEG[o + 3];
          if (py < Math.min(ya, yb) - pw || py > Math.max(ya, yb) + pw) continue;
          const xa = SEG[o], xb = xa + SEG[o + 2];
          rx0 = Math.min(rx0, Math.min(xa, xb) - pw); rx1 = Math.max(rx1, Math.max(xa, xb) + pw);
        }
        if (rx0 > rx1) continue;
        const c0 = Math.max(0, Math.floor((rx0 + sh) * 2 + COLS / 2));
        const c1 = Math.min(COLS, Math.ceil((rx1 + sh) * 2 + COLS / 2));
        for (let c = c0; c < c1; c++) {
          const px = Xc[c] - sh;
          let best = 1, bestS = -1, bestU = 0;
          for (let s = 0, o = 0; s < ns; s++, o += 9) {
            const qx = px - SEG[o], qy = py - SEG[o + 1], dx = SEG[o + 2], dy = SEG[o + 3];
            let u = (qx * dx + qy * dy) * SEG[o + 4];
            u = u < 0 ? 0 : u > 1 ? 1 : u;
            const ex = qx - dx * u, ey = qy - dy * u;
            let hw = SEG[o + 5] + SEG[o + 6] * u;
            if (hw < 1e-3) hw = 1e-3;
            const q2 = (ex * ex + ey * ey) / (hw * hw);
            if (q2 < best) { best = q2; bestS = s; bestU = u; }
          }
          if (bestS < 0) continue;
          const o = bestS * 9;
          const cr = SEG[o + 2] * (py - SEG[o + 1]) - SEG[o + 3] * (px - SEG[o]);
          const side = cr > 0 ? 1 : cr < 0 ? -1 : 0;
          fn(r * COLS + c, SEG[o + 7] + SEG[o + 8] * bestU, Math.sqrt(best) * side, r, c);
        }
      }
    }

    const lin = (n) => Array.from({ length: n }, (_, k) => k / (n - 1));
    const lerp3 = (a, b, k) => {
      k = clamp(k);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    };

    // Stems & Tubes
    function tube(pts, w0, w1, col) {
      const n = pts.length;
      if (n < 2) return;
      const hws = lin(n).map((k) => w0 + (w1 - w0) * k);
      const dark = mul(col, 0.7);
      const lite = mul(col, 1.35);
      brush(pts, hws, lin(n), (i, a, q) => {
        const k = clamp(0.5 - 0.5 * q);
        set(i, 0.48 + 0.38 * (1 - Math.abs(q)) - 0.18 * q,
          dark[0] + (lite[0] - dark[0]) * k,
          dark[1] + (lite[1] - dark[1]) * k,
          dark[2] + (lite[2] - dark[2]) * k);
      });
    }

    function curve(p0, p1, bulge, grow, n = 10) {
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) + 1e-9;
      const nx = -dy / L, ny = dx / L, out = [];
      for (let k = 0; k < n; k++) {
        const s = (k / (n - 1)) * grow, b = bulge * Math.sin(Math.PI * s);
        out.push([p0[0] + dx * s + nx * b, p0[1] + dy * s + ny * b]);
      }
      return out;
    }

    const LEAF_D = [0.08, 0.42, 0.16];
    const LEAF_L = [0.42, 0.85, 0.36];
    const UNDER  = [0.52, 0.74, 0.56];
    const OLD_TIP = [0.75, 0.70, 0.28];

    function leaf(L, t, unfurl) {
      if (unfurl <= 0.01) return;
      const n = 12, len = L.len * (0.3 + 0.7 * unfurl), wid = L.wid * (0.4 + 0.6 * unfurl);
      const ang0 = L.stemAng + (L.ang - L.stemAng) * unfurl;
      const sway = rad(4) * wave(t, 3, L.seed);
      const pts = [], hws = [];
      let x = L.x, y = L.y;
      for (let k = 0; k < n; k++) {
        const a = k / (n - 1);
        pts.push([x, y]);
        const tw = Math.cos(L.twist * a + L.phase);
        hws.push(Math.max(0.06, wid * Math.pow(Math.sin(Math.PI * Math.pow(a, 0.5)), 0.85) * (0.2 + 0.8 * Math.abs(tw))));
        const bend = L.droop * Math.pow(a, 1.6) + L.kink * smoothstep(L.kinkAt - 0.05, L.kinkAt + 0.05, a);
        const ang = ang0 + sway * a + L.dir * bend * unfurl;
        x += Math.cos(ang) * len / (n - 1);
        y += Math.sin(ang) * len / (n - 1);
      }
      brush(pts, hws, lin(n), (i, a, q) => {
        const aq = Math.abs(q), back = Math.cos(L.twist * a + L.phase) < 0;
        const lit = (q > 0) !== back ? 1 : 0;
        let l = (0.45 + 0.32 * lit + 0.25 * Math.pow(1 - aq, 0.7)) * (0.88 + 0.12 * Math.cos(q * Math.PI * 6));
        if (aq < 0.08) l = back ? 0.82 : 0.38;
        else if (aq > 0.88) l += 0.15;
        l *= 0.8 + 0.2 * clamp(a * 6);
        let c = back ? lerp3(mul(UNDER, 0.85), UNDER, 0.4 + 0.6 * (1 - aq))
                     : lerp3(LEAF_D, LEAF_L, 0.3 + 0.45 * lit + 0.25 * (1 - aq));
        if (L.old) c = lerp3(c, OLD_TIP, (a - 0.8) * 4);
        set(i, clamp(l), c[0], c[1], c[2]);
      });
    }

    // ================================================================ The 3D Lily Model
    const BUD09 = mul(BUD, 0.9);
    const STAMEN = [0.85, 0.65, 0.50];

    function lily(center, axis, size, openness, ripe, t, seed, pal, bright) {
      if (size <= 0.3) return;
      const anther = pal.anther || ANTHER;
      const a3 = norm(axis);
      const ref = Math.abs(a3[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      const u3 = norm(cross(a3, ref));
      const v3 = cross(a3, u3);
      const c3 = [center[0], center[1], 0];
      const spin = rad(15) + rad(3) * wave(t, 3, seed);
      const petals = [];

      // 6 long, reflexed lily petals
      for (let k = 0; k < 6; k++) {
        const inner = k % 2 === 1;
        const phi = spin + k * Math.PI / 3;
        const radial = add(mul(u3, Math.cos(phi)), mul(v3, Math.sin(phi)));
        const tangent = cross(a3, radial);
        const theta = rad(6 + (inner ? 72 : 80) * openness);
        const curl = rad(55) * Math.pow(Math.max(openness, 0), 1.5);
        const L = size * (inner ? 0.95 : 1.02);
        const W = size * (inner ? 0.28 : 0.22);
        const n = 9;
        const pts3 = [], hws = [];
        let p = add(c3, mul(radial, size * 0.04));

        for (let i = 0; i < n; i++) {
          const a = i / (n - 1);
          pts3.push(p);
          hws.push(W * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(a, 0.999), 0.65)), 0.85));
          const th = theta + curl * a * a;
          p = add(p, mul(add(mul(a3, Math.cos(th)), mul(radial, Math.sin(th))), L / (n - 1)));
        }

        const normal = norm(cross(norm(sub(pts3[4], pts3[0])), tangent));
        const facing = normal[2];
        const tproj = Math.hypot(tangent[0], tangent[1]);
        petals.push({
          depth: pts3.reduce((s, q) => s + q[2], 0) / n,
          pts: pts3.map((q) => [q[0], q[1]]),
          hws: hws.map((h) => Math.max(h * Math.max(tproj, 0.35), 0.10)),
          normal, facing, pseed: seed * 10 + k,
        });
      }

      petals.sort((a, b) => a.depth - b.depth);
      const dim = 0.70 + 0.30 * bright;
      const av = lin(9);

      for (const pt of petals) {
        const sg = pt.facing < 0 ? -1 : 1;
        const light = 0.40 + 0.60 * Math.max(0, dot(mul(pt.normal, sg), LIGHT));
        const back = pt.facing < 0;

        brush(pt.pts, pt.hws, av, (i, a, q) => {
          const aq = Math.abs(q);
          let l = light * (0.68 + 0.38 * Math.pow(1 - aq, 0.6)) * (back ? 0.85 : 1.05);
          l *= 0.75 + 0.35 * clamp(a * 2);
          if (aq < 0.1) l *= 0.70;
          let col = lerp3(pal.deep, pal.mid, a * 2.2);
          col = lerp3(col, pal.tip, (a - 0.5) * 1.8 + (aq - 0.65) * 1.5);
          col = lerp3(col, pal.sheen, (light - 0.7) * 2.5 * (1 - aq));
          col = lerp3(BUD09, col, ripe * clamp(0.3 + a * 1.5) + ripe * 0.3);
          set(i, clamp(l) * bright, col[0] * dim, col[1] * dim, col[2] * dim);
        });
      }

      // Protruding stamens with glowing golden pollen anthers
      const show = smoothstep(0.35, 0.85, openness);
      if (show <= 0) return;
      for (let k = 0; k < 7; k++) {
        const pistil = k === 6;
        const phi = k * TAU / 6 + 0.3;
        const radial = add(mul(u3, Math.cos(phi)), mul(v3, Math.sin(phi)));
        const th = pistil ? 0 : rad(28) * openness;
        const d3 = add(mul(a3, Math.cos(th)), mul(radial, Math.sin(th)));
        const ln = size * (pistil ? 0.65 : 0.58) * show;
        const mid = add(add(c3, mul(d3, ln * 0.5)), mul(radial, pistil ? 0 : 0.4));
        const tip = add(c3, mul(d3, ln));

        brush([[c3[0], c3[1]], [mid[0], mid[1]], [tip[0], tip[1]]], [0.24, 0.20, 0.16], [0, 0.5, 1],
          (i) => set(i, 0.65 * bright, STAMEN[0], STAMEN[1], STAMEN[2]));

        if (!pistil) {
          brush([[tip[0] - d3[0] * 1.0, tip[1] - d3[1] * 1.0], [tip[0] + d3[0] * 0.5, tip[1] + d3[0] * 0.5]],
            [0.65, 0.65], [0, 1], (i) => set(i, 1.05 * bright, anther[0], anther[1], anther[2]));
        }
      }
    }

    // ================================================================ The 3D Rose Model
    function rose(center, axis, size, openness, ripe, t, seed, pal, bright) {
      if (size <= 0.3) return;
      const a3 = norm(axis);
      const ref = Math.abs(a3[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      const u3 = norm(cross(a3, ref));
      const v3 = cross(a3, u3);
      const c3 = [center[0], center[1], 0];
      const spin = rad(20) + rad(3) * wave(t, 3, seed);
      const petals = [];

      // Rose Layers:
      // Layer 0: 5 outer cupped petals
      // Layer 1: 5 mid reflexing whorl petals
      // Layer 2: 4 inner swirl petals
      // Layer 3: central bud spiral
      const whorls = [
        { count: 5, rScale: 1.00, wScale: 0.44, lScale: 0.92, thBase: 14, thOpen: 65, curl: 32, off: 0.0 },
        { count: 5, rScale: 0.78, wScale: 0.38, lScale: 0.78, thBase: 10, thOpen: 48, curl: 24, off: 0.5 },
        { count: 4, rScale: 0.55, wScale: 0.32, lScale: 0.62, thBase: 6,  thOpen: 34, curl: 16, off: 0.25 },
        { count: 3, rScale: 0.34, wScale: 0.25, lScale: 0.44, thBase: 4,  thOpen: 20, curl: 8,  off: 0.75 },
      ];

      for (let wIdx = 0; wIdx < whorls.length; wIdx++) {
        const wh = whorls[wIdx];
        for (let k = 0; k < wh.count; k++) {
          const phi = spin + (k + wh.off) * (TAU / wh.count);
          const radial = add(mul(u3, Math.cos(phi)), mul(v3, Math.sin(phi)));
          const tangent = cross(a3, radial);
          const theta = rad(wh.thBase + wh.thOpen * openness);
          const curl = rad(wh.curl) * Math.pow(Math.max(openness, 0), 1.3);
          const L = size * wh.lScale;
          const W = size * wh.wScale;
          const n = 8;
          const pts3 = [], hws = [];
          let p = add(c3, mul(radial, size * 0.03 * wh.rScale));

          for (let i = 0; i < n; i++) {
            const a = i / (n - 1);
            pts3.push(p);
            // Rose petal profile: rounded cup with flaring center
            const profile = Math.sin(Math.PI * Math.pow(a, 0.65));
            hws.push(W * Math.pow(profile, 0.78));
            const th = theta + curl * a * a;
            p = add(p, mul(add(mul(a3, Math.cos(th)), mul(radial, Math.sin(th))), L / (n - 1)));
          }

          const normal = norm(cross(norm(sub(pts3[3], pts3[0])), tangent));
          const facing = normal[2];
          const tproj = Math.hypot(tangent[0], tangent[1]);

          petals.push({
            depth: pts3.reduce((s, q) => s + q[2], 0) / n,
            pts: pts3.map((q) => [q[0], q[1]]),
            hws: hws.map((h) => Math.max(h * Math.max(tproj, 0.4), 0.12)),
            normal, facing,
            wIdx,
          });
        }
      }

      petals.sort((a, b) => a.depth - b.depth);
      const dim = 0.82 + 0.18 * bright;
      const av = lin(8);

      for (const pt of petals) {
        const sg = pt.facing < 0 ? -1 : 1;
        const light = 0.45 + 0.55 * Math.max(0, dot(mul(pt.normal, sg), LIGHT));
        const back = pt.facing < 0;

        brush(pt.pts, pt.hws, av, (i, a, q) => {
          const aq = Math.abs(q);
          let l = light * (0.72 + 0.35 * Math.pow(1 - aq, 0.55)) * (back ? 0.88 : 1.08);
          // Darker center whorl shadows, luminous outer petal tips
          l *= 0.65 + 0.45 * clamp(a * 1.8);
          if (pt.wIdx >= 2) l *= 0.82; // Deep velvety shadows in rose center

          let col = lerp3(pal.deep, pal.mid, a * 2.4);
          col = lerp3(col, pal.tip, (a - 0.45) * 1.9 + (aq - 0.6) * 1.4);
          col = lerp3(col, pal.sheen, (light - 0.7) * 2.2 * (1 - aq));
          col = lerp3(BUD09, col, ripe * clamp(0.2 + a * 1.5) + ripe * 0.25);

          set(i, clamp(l) * bright, col[0] * dim, col[1] * dim, col[2] * dim);
        });
      }
    }

    // ================================================================ Layout Setup
    const rnd = (k) => hash3(k, 911, 37) / 4294967296;
    const STEM_DUR = 1.0;
    const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);

    function pathAt(pts, frac) {
      const n = pts.length, segs = n - 1, total = frac * segs;
      const s = Math.min(segs - 1, Math.floor(total)), u = total - s;
      const p0 = pts[s], p1 = pts[s + 1], dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      return { x: p0[0] + dx * u, y: p0[1] + dy * u, ang: Math.atan2(dy, dx) };
    }

    let FLOWERS = [], BUDS = [];

    function buildLayout() {
      // Both Rose & Lily stems converge gracefully to the base [0, 172]
      const fl = FLOWERS_BASE.map(([pos, size, axis, kind, col, tOpen, bright], i) => ({
        pos, size, axis, kind, col, bright,
        baseX: pos[0] * 0.08, // Meet harmoniously near center base
        bulge: 2.8 * Math.sign(pos[0] || 1) * (i % 2 ? 1.1 : -0.7),
        start: 0.05 + 0.04 * i,
        tOpen: 1.6 + (tOpen - 3.8) * 0.55,
      }));

      const bd = BUDS_BASE.map(([pos, size, axis, ripe, col], i) => ({
        pos, size, axis, ripe, col,
        baseX: pos[0] * 0.08,
        bulge: 2.8 * Math.sign(pos[0] || 1) * (i % 2 ? -0.7 : 1.1),
        start: 0.15 + 0.05 * i,
      }));

      for (const o of [...fl, ...bd]) {
        o.end = o.start + STEM_DUR;
        o.path = curve([o.baseX, 172], o.pos, o.bulge, 1, 14);
      }

      fl.forEach((f, i) => {
        f.tOpen = Math.max(f.tOpen, f.end + 0.5);
        const front = f.bright > 0.85;
        const fv0 = clamp((172 - (ROWS - 4)) / (172 - f.pos[1]), 0.04, 0.6);
        const fv1 = Math.min(0.78, fv0 + 0.62);
        const fracs = front ? [0, 0.25, 0.5, 0.75, 1].map((u) => fv0 + (fv1 - fv0) * u) : [0.55, 0.72];

        f.leaves = fracs.map((fr, j) => {
          const sd = i * 31 + j * 7 + 3;
          const frac = clamp(fr + (rnd(sd) - 0.5) * 0.05, 0.04, 0.82);
          const p = pathAt(f.path, frac);
          const side = (i + j) % 2 ? 1 : -1;
          const ang = p.ang + side * rad(28 + rnd(sd + 1) * 30);
          return {
            x: p.x, y: p.y, stemAng: p.ang, ang,
            dir: Math.cos(ang) >= 0 ? 1 : -1,
            len: 15 + rnd(sd + 2) * 12,
            wid: 3.2 + rnd(sd + 3) * 1.5,
            droop: rad(35 + rnd(sd + 4) * 20),
            twist: rad(120 + rnd(sd + 5) * 60),
            phase: rnd(sd + 6) * TAU,
            kink: rnd(sd + 7) < 0.25 ? rad(18) : 0,
            kinkAt: 0.4 + rnd(sd + 8) * 0.3,
            old: rnd(sd + 9) < 0.2,
            seed: sd,
            tAt: f.start + STEM_DUR * frac,
          };
        });
      });

      FLOWERS = fl;
      BUDS = bd;
    }

    buildLayout();

    // ================================================================ Scene Calculation
    function scene(t) {
      for (let r = 0; r < ROWS; r++) {
        const h = clamp((ROWS + 10 - Yr[r]) / 140);
        const w = t - 0.4 * h;
        rowShift[r] = settings.wind * (0.6 * wave(w, 2) + 0.3 * wave(w, 3, 1) + 0.1 * wave(w, 5, 2)) * Math.pow(h, 1.5);
      }

      lum.set(bgLum);
      rgb.set(bgRgb);

      const growOf = (o) => easeOut((t - o.start) / STEM_DUR);

      // 1. Cascading leaves unfurl
      for (const f of FLOWERS) {
        for (const L of f.leaves) {
          leaf(L, t, smoothstep(L.tAt, L.tAt + 0.55, t));
        }
      }

      // 2. Intertwined graceful stems
      for (const b of BUDS) tube(curve([b.baseX, 172], b.pos, b.bulge, growOf(b), 14), 0.75, 0.5, STEM);
      for (const f of FLOWERS) tube(curve([f.baseX, 172], f.pos, f.bulge, growOf(f), 14), 0.95, 0.55, STEM);

      // 3. Blooming Flowers (Roses & Lilies)
      FLOWERS.forEach((f, i) => {
        if (t < f.end) return;
        const swell = smoothstep(f.end, f.end + 0.6, t);
        const ripe = smoothstep(f.tOpen - 1.0, f.tOpen + 0.3, t);
        const opening = smoothstep(f.tOpen, f.tOpen + 1.6, t);
        const breathe = BREATH_DEPTH * (0.5 - 0.5 * Math.cos(TAU * (t - f.tOpen - 3) / BREATH + i * 0.9))
          * smoothstep(f.tOpen + 1.6, f.tOpen + 3, t);
        const openness = opening * (1 - breathe);
        const s = f.size * settings.size * (0.35 + 0.65 * swell) * (0.5 + 0.5 * Math.max(openness, ripe * 0.6));

        if (f.kind === "rose") {
          rose(f.pos, f.axis, s, openness, ripe, t, i * 7 + 3, PALETTES[f.col], f.bright);
        } else {
          lily(f.pos, f.axis, s, openness, ripe, t, i * 7 + 3, PALETTES[f.col], f.bright);
        }
      });

      // 4. Companion Buds
      BUDS.forEach((b, i) => {
        if (t < b.end) return;
        const swell = smoothstep(b.end, b.end + 0.6, t);
        lily(b.pos, b.axis, b.size * (0.4 + 0.6 * swell), 0.04 + 0.03 * wave(t, 2, i),
          b.ripe * swell, t, 90 + i, PALETTES[b.col], 0.9);
      });

      // 5. Golden Fireflies ascending into the night
      const pv = 0.55 * smoothstep(2.5, 4.0, t);
      const off = Math.floor(t * 4);
      if (pv > 0) {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if ((hash3(c, r + off, 77) % 1000) < 18) {
              const i = r * COLS + c;
              lum[i] = Math.max(lum[i], pv * (0.65 + 0.35 * Math.sin(t * 5 + r)));
              const j = i * 3;
              rgb[j] = 1.0;
              rgb[j + 1] = 0.88;
              rgb[j + 2] = 0.42;
            }
          }
        }
      }

      // 6. Multilingual Love Words twinkling in the sky
      const wordAlpha = smoothstep(3.5, 5.0, t);
      if (wordAlpha > 0.05) {
        for (const item of LOVE_WORDS) {
          const colCenter = Math.floor(COLS / 2 + item.x * (COLS * 0.46));
          const rowCenter = Math.floor(item.y * ROWS);
          const text = item.text;
          const shimmer = 0.5 + 0.5 * Math.sin(t * 2.5 + item.phase);
          const textLum = wordAlpha * (0.55 + 0.45 * shimmer);

          const startCol = Math.max(0, colCenter - Math.floor(text.length / 2));
          for (let k = 0; k < text.length; k++) {
            const cc = startCol + k;
            if (cc >= 0 && cc < COLS && rowCenter >= 0 && rowCenter < ROWS) {
              const idx = rowCenter * COLS + cc;
              lum[idx] = Math.max(lum[idx], textLum);
              const j = idx * 3;
              // Warm Rose-Gold Starlight
              rgb[j] = Math.max(rgb[j], 1.0);
              rgb[j + 1] = Math.max(rgb[j + 1], 0.78);
              rgb[j + 2] = Math.max(rgb[j + 2], 0.88);
            }
          }
        }
      }
    }

    // ================================================================ Rendering
    const W = COLS * CW;
    const H = ROWS * CH;
    view.width = W;
    view.height = H;

    const CHARS = BUCKETS.join("");
    const START = [];
    const COUNT = BUCKETS.map((b) => b.length);
    BUCKETS.reduce((s, b, k) => { START[k] = s; return s + b.length; }, 0);

    const MASKS = [...CHARS].map((ch) => {
      const g = document.createElement("canvas");
      g.width = CW;
      g.height = CH;
      const gx = g.getContext("2d");
      gx.font = FONT;
      gx.textBaseline = "top";
      gx.fillStyle = "#fff";
      gx.fillText(ch, 0, 0);
      const d = gx.getImageData(0, 0, CW, CH).data;
      const m = new Uint8Array(CW * CH);
      for (let k = 0; k < m.length; k++) {
        // Boost font mask alpha so glyphs render solid and clear!
        const a = d[k * 4 + 3];
        m[k] = a > 20 ? Math.min(255, Math.floor(a * 2.2)) : 0;
      }
      return m;
    });

    const ascii = document.createElement("canvas");
    ascii.width = W;
    ascii.height = H;
    const actx = ascii.getContext("2d");
    const img = actx.createImageData(W, H);
    const px32 = new Uint32Array(img.data.buffer);

    const glowA = document.createElement("canvas");
    const glowB = document.createElement("canvas");
    const glowC = document.createElement("canvas");
    glowA.width = Math.round(W / 2); glowA.height = Math.round(H / 2);
    glowB.width = Math.round(W / 4); glowB.height = Math.round(H / 4);
    glowC.width = Math.round(W / 8); glowC.height = Math.round(H / 8);

    function draw(frame) {
      px32.fill(0);
      const fidx = Math.floor(frame / 3);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c;
          const L = lum[i];
          let level = 0;
          while (level < LEVELS.length && L >= LEVELS[level]) level++;
          if (level === 0) continue;

          const ch = START[level] + (hash3(r, c, fidx) % COUNT[level]);
          const m = MASKS[ch];

          // Luminous color multiplier
          const k = 0.85 + 0.85 * L;
          const j = i * 3;
          const R = Math.min(1.0, rgb[j] * k);
          const G = Math.min(1.0, rgb[j + 1] * k);
          const B = Math.min(1.0, rgb[j + 2] * k);

          const pr = Math.min(255, Math.floor(255 * R));
          const pg = Math.min(255, Math.floor(255 * G));
          const pb = Math.min(255, Math.floor(255 * B));

          let o0 = (r * CH) * W + c * CW;
          let mi = 0;

          for (let y = 0; y < CH; y++, o0 += W) {
            for (let x = 0; x < CW; x++, mi++) {
              const v = m[mi];
              if (v > 0) {
                // High opacity alpha ensures full vibrant visibility on dark background
                px32[o0 + x] = (v << 24) | (pb << 16) | (pg << 8) | pr;
              }
            }
          }
        }
      }

      actx.putImageData(img, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(ascii, 0, 0);

      // Multi-scale Gaussian bloom
      if (settings.glow > 0) {
        let src = ascii;
        for (const g of [glowA, glowB, glowC]) {
          const gx = g.getContext("2d");
          gx.imageSmoothingEnabled = true;
          gx.clearRect(0, 0, g.width, g.height);
          gx.drawImage(src, 0, 0, g.width, g.height);
          src = g;
        }
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(1, settings.glow);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(glowC, 0, 0, W, H);
        if (settings.glow > 1) {
          ctx.globalAlpha = settings.glow - 1;
          ctx.drawImage(glowC, 0, 0, W, H);
        }
        ctx.restore();
      }
    }

    this._scene = scene;
    this._draw = draw;
    this._FPS = FPS;
    this._buildLayout = buildLayout;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.t0 = performance.now();
    this.lastDraw = -1e9;
    this.hasTriggeredBloom = false;

    let frame = 0;
    const interval = 1000 / this._FPS;

    const tick = (now) => {
      if (!this.isRunning) return;
      if (now - this.lastDraw >= interval) {
        this.lastDraw = now;
        const t = (now - this.t0) / 1000;
        this._scene(t);
        this._draw(frame++, t);

        // Check if bouquet has fully bloomed (~4.5s) to pop up Cloud Note
        if (t >= 4.5 && !this.hasTriggeredBloom) {
          this.hasTriggeredBloom = true;
          if (this.onBloomComplete) {
            this.onBloomComplete();
          }
        }
      }
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
  }

  reset() {
    this.stop();
    this.t0 = performance.now();
    this.lastDraw = -1e9;
    this.hasTriggeredBloom = false;
    this._buildLayout();
  }
}

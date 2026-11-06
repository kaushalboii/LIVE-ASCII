/**
 * Grand 3D Living ASCII Blooming Rose Engine
 * 
 * Features:
 * - Single Grand 3D Blooming Crimson Rose in the center
 * - True 3D side & top isometric perspective (axis = [0.06, -0.36, 0.93])
 * - Full-height organic stem rising from bottom with rose thorns
 * - Natural rose leaves with serrated profiles and veins filling the vertical space
 * - Calyx with 5 green lanceolate sepals peeling back as the rose blooms
 * - 4 layered whorls of 3D curved petals:
 *   - Outer guard petals reflexing downward over the chalice rim
 *   - Mid chalice petals flaring outward
 *   - Inner swirl petals
 *   - Central spiral bud heart (Fibonacci spiral core)
 * - Deep velvet crimson palette: dark crevice shadows, rich ruby body, luminous rose-pink rim highlights
 * - Once fully bloomed, the rose STAYS BLOOMED (never shrinks or closes into a ball)
 * - Living organic breeze sway & gentle breathing
 * - Ambient golden stardust fireflies
 * - Fully responsive: fills screen seamlessly on desktop and mobile without letterboxing
 */

export class AsciiRose {
  constructor(canvas, onBloomComplete = null) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.onBloomComplete = onBloomComplete;

    this.isRunning = false;
    this.animId = null;
    this.hasTriggeredBloom = false;
    this.t0 = performance.now();
    this.lastDraw = -1e9;

    this.init();
  }

  init() {
    if (!this.canvas) return;
    const view = this.canvas;
    const ctx = this.ctx;

    // Font and cell configuration
    const FONT_SIZE = 10;
    const FPS = 30;
    const FONT = `bold ${FONT_SIZE}px Menlo, Consolas, "DejaVu Sans Mono", "Courier New", monospace`;
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = FONT;
    const CW = Math.max(1, Math.round(probe.measureText("M").width));
    const CH = Math.round(FONT_SIZE * 1.15);

    const ROWS = 150;
    const COLS = Math.max(140, Math.min(600, Math.round(ROWS * CH / CW * (window.innerWidth || 800) / Math.max(1, window.innerHeight || 800))));
    const N = COLS * ROWS;

    const BUCKETS = [" ", ".'`", ":;,-~", "!/\\|()[]{}<>?+=", "tfjrxnuvczil", "XYUJCLQ0OZmwqpdbkhao", "#MW&8%B", "@$"];
    const LEVELS = [0.05, 0.12, 0.25, 0.40, 0.55, 0.70, 0.85];

    // Colors
    const BUD = [0.38, 0.58, 0.24];
    const STEM_COL = [0.20, 0.52, 0.20];

    // Rich Velvet Crimson Palette
    const PALETTE = {
      deep:  [0.62, 0.02, 0.12], // Deep wine shadow
      mid:   [0.96, 0.08, 0.22], // Brilliant ruby crimson
      tip:   [1.00, 0.40, 0.54], // Glowing scarlet highlight
      sheen: [1.00, 0.85, 0.90], // Specular rim curl sheen
    };

    // Math utilities
    const TAU = Math.PI * 2;
    const rad = (d) => d * Math.PI / 180;
    const clamp = (x, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
    const smoothstep = (a, b, x) => {
      const t = clamp((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    const lerp = (a, b, k) => a + (b - a) * k;
    const lerp3 = (a, b, k) => {
      k = clamp(k);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    };
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
    const norm = (a) => {
      const d = Math.hypot(a[0], a[1], a[2]) || 1;
      return [a[0] / d, a[1] / d, a[2] / d];
    };
    const lin = (n) => Array.from({ length: n }, (_, k) => k / (n - 1));

    // Simple pseudo-random hash
    const rnd = (i) => {
      let x = Math.sin(i * 127.1 + 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };
    const wave = (t, freq, seed) => Math.sin(t * freq + seed * 2.1);

    // Light source from upper-left
    const LIGHT = norm([-0.42, -0.78, 0.48]);

    // Grid coordinates
    const Xc = new Float64Array(COLS);
    const Yr = new Float64Array(ROWS);
    const aspect = CW / CH;
    for (let c = 0; c < COLS; c++) Xc[c] = (c - COLS / 2) * 0.5 * aspect;
    for (let r = 0; r < ROWS; r++) Yr[r] = r;

    // Buffer state
    const lum = new Float32Array(N);
    const rgb = new Float32Array(N * 3);
    const rowShift = new Float64Array(ROWS);

    function set(i, l, r, g, b) {
      if (i < 0 || i >= N) return;
      if (l > lum[i]) {
        lum[i] = l;
        const j = i * 3;
        rgb[j] = r;
        rgb[j + 1] = g;
        rgb[j + 2] = b;
      }
    }

    // Curve brush for drawing smooth 3D petals, stems, and leaves
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

    // Stem tube rendering
    function tube(pts, w0, w1, col) {
      const n = pts.length;
      if (n < 2) return;
      const hws = lin(n).map((k) => w0 + (w1 - w0) * k);
      const dark = mul(col, 0.65);
      const lite = mul(col, 1.4);
      brush(pts, hws, lin(n), (i, a, q) => {
        const k = clamp(0.5 - 0.5 * q);
        set(i, 0.52 + 0.38 * (1 - Math.abs(q)) - 0.15 * q,
          dark[0] + (lite[0] - dark[0]) * k,
          dark[1] + (lite[1] - dark[1]) * k,
          dark[2] + (lite[2] - dark[2]) * k);
      });
    }

    // Curved Bézier spine
    function curve(p0, p1, bulge, grow, n = 12) {
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) + 1e-9;
      const nx = -dy / L, ny = dx / L, out = [];
      for (let k = 0; k < n; k++) {
        const s = (k / (n - 1)) * grow, b = bulge * Math.sin(Math.PI * s);
        out.push([p0[0] + dx * s + nx * b, p0[1] + dy * s + ny * b]);
      }
      return out;
    }

    // Rose Leaf rendering with central rib and serrations
    function drawRoseLeaf(lx, ly, stemAng, side, len, wid, unfurl, t, seed) {
      if (unfurl <= 0.05) return;
      const n = 11;
      const l = len * (0.35 + 0.65 * unfurl);
      const w = wid * (0.4 + 0.6 * unfurl);
      const ang = stemAng + side * rad(32 + rnd(seed) * 18);
      const sway = rad(3.5) * wave(t, 2.5, seed);
      const pts = [], hws = [];
      let x = lx, y = ly;

      for (let k = 0; k < n; k++) {
        const a = k / (n - 1);
        pts.push([x, y]);
        const profile = Math.pow(Math.sin(Math.PI * Math.pow(a, 0.55)), 0.85);
        hws.push(Math.max(0.08, w * profile));
        const droop = rad(24) * a * a;
        const curAng = ang + sway * a + side * droop;
        x += Math.cos(curAng) * l / (n - 1);
        y += Math.sin(curAng) * l / (n - 1);
      }

      brush(pts, hws, lin(n), (i, a, q) => {
        const aq = Math.abs(q);
        const rib = aq < 0.12 ? 1.3 : 1.0;
        const light = 0.42 + 0.45 * (1 - aq * 0.5) * rib;
        const col = lerp3([0.12, 0.44, 0.16], [0.36, 0.76, 0.30], a * 0.8);
        set(i, clamp(light), col[0], col[1], col[2]);
      });
    }

    // ================================================================ The 3D Rose Model
    function drawRose(center, axis, size, openness, t, seed) {
      if (size <= 0.3) return;
      const a3 = norm(axis);
      const ref = Math.abs(a3[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      const u3 = norm(cross(a3, ref));
      const v3 = cross(a3, u3);
      const c3 = [center[0], center[1], 0];
      const spin = rad(20) + rad(3) * wave(t, 2.8, seed);
      const petals = [];

      // 4 Botanical Whorl Layers
      // Layer 0: 5 outer cupped guard petals with reflexing lips
      // Layer 1: 5 mid reflexing whorl petals
      // Layer 2: 4 inner swirl petals
      // Layer 3: 3 central spiral bud heart petals
      const whorls = [
        { count: 5, rScale: 1.00, wScale: 0.48, lScale: 0.96, thBase: 14, thOpen: 68, curl: 36, off: 0.0 },
        { count: 5, rScale: 0.78, wScale: 0.42, lScale: 0.80, thBase: 10, thOpen: 50, curl: 26, off: 0.5 },
        { count: 4, rScale: 0.55, wScale: 0.35, lScale: 0.64, thBase: 6,  thOpen: 36, curl: 18, off: 0.25 },
        { count: 3, rScale: 0.34, wScale: 0.28, lScale: 0.46, thBase: 4,  thOpen: 22, curl: 10, off: 0.75 },
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
          const n = 9;
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

      // Sort in 3D Depth order (Back petals first, front petals last)
      petals.sort((a, b) => a.depth - b.depth);
      const av = lin(9);

      for (const pt of petals) {
        const sg = pt.facing < 0 ? -1 : 1;
        const light = 0.45 + 0.55 * Math.max(0, dot(mul(pt.normal, sg), LIGHT));
        const back = pt.facing < 0;

        brush(pt.pts, pt.hws, av, (i, a, q) => {
          const aq = Math.abs(q);
          let l = light * (0.72 + 0.35 * Math.pow(1 - aq, 0.55)) * (back ? 0.88 : 1.08);
          // Darker center whorl shadows, luminous outer petal tips
          l *= 0.78 + 0.32 * clamp(a * 2.0);
          if (aq < 0.1) l *= 0.75; // Central petal crease shadow
          if (aq > 0.82) l *= 1.25; // Luminous petal rim edge curl!

          let col = lerp3(PALETTE.deep, PALETTE.mid, a * 2.2);
          col = lerp3(col, PALETTE.tip, (a - 0.5) * 1.8 + (aq - 0.65) * 1.5);
          col = lerp3(col, PALETTE.sheen, (light - 0.68) * 2.2 * (1 - aq));
          col = lerp3(BUD, col, (1 - openness) * clamp(0.3 + a * 1.5));
          set(i, clamp(l), col[0], col[1], col[2]);
        });
      }

      // 5 Botanical Lanceolate Sepals at the rose calyx base
      for (let k = 0; k < 5; k++) {
        const phi = spin + (k + 0.25) * (TAU / 5);
        const radial = add(mul(u3, Math.cos(phi)), mul(v3, Math.sin(phi)));
        // Sepals peel back and curl downward along stem as flower blooms
        const sepalTh = rad(18 + 75 * openness);
        const sepalCurl = rad(40 * openness);
        const sepalL = size * 0.55;
        const sepalW = size * 0.12;
        const ptsSepal = [], hwsSepal = [];
        let p = add(c3, mul(radial, size * 0.02));
        for (let i = 0; i < 7; i++) {
          const a = i / 6;
          ptsSepal.push([p[0], p[1]]);
          hwsSepal.push(sepalW * (1 - a)); // Tapers to sharp point
          const th = sepalTh + sepalCurl * a;
          p = add(p, mul(add(mul(a3, Math.cos(th)), mul(radial, Math.sin(th))), sepalL / 6));
        }
        brush(ptsSepal, hwsSepal, lin(7), (i) => {
          set(i, 0.65, 0.20, 0.52, 0.20);
        });
      }
    }

    // ================================================================ Rendering Engine
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

    // Main Draw Frame function
    this.renderFrame = (now) => {
      const t = Math.max(0, (now - this.t0) / 1000);

      // Bloom timing:
      // 0s - 1.0s: Stem rises and leaves emerge
      // 1.0s - 3.8s: Rose bud unfurls into full crimson bloom
      // >= 3.8s: STAYS BLOOMED (never closes into a ball), sways and breathes in the breeze
      const stemGrow = smoothstep(0.0, 1.6, t);
      const bloom = smoothstep(1.0, 3.8, t);

      // Living organic breath and wind sway
      const breath = bloom >= 1.0 ? 1.0 + 0.02 * Math.sin(t * 1.6) : 1.0;
      const windSway = Math.sin(t * 0.85) * 4.5;

      // Trigger completion callback when full bloom is achieved
      if (t >= 3.8 && !this.hasTriggeredBloom) {
        this.hasTriggeredBloom = true;
        if (this.onBloomComplete) this.onBloomComplete();
      }

      // Clear buffers
      lum.fill(0);
      rgb.fill(0);

      // Compute row shift for wind breeze
      for (let r = 0; r < ROWS; r++) {
        const h = clamp((ROWS + 10 - Yr[r]) / 140);
        rowShift[r] = Math.sin(t * 0.9 - 0.4 * h) * 1.6 * (1 - h * 0.3);
      }

      // 1. Draw Stem rising from bottom of screen [0, 168] up to flower head [0, 56]
      const stemHeadY = 56;
      const stemBaseY = 168;
      const stemHeadX = windSway * 0.6;
      const stemPath = curve([0, stemBaseY], [stemHeadX, stemHeadY], 3.8 * Math.sin(t * 0.75), stemGrow, 16);
      tube(stemPath, 2.2, 1.4, STEM_COL);

      // 2. Draw Rose Leaves along the stem
      if (stemGrow > 0.25) {
        // Lower left leaf
        drawRoseLeaf(-0.8, 126, rad(90), -1, 26, 6.2, smoothstep(0.3, 1.8, t), t, 11);
        // Lower right leaf
        drawRoseLeaf(1.2, 108, rad(90), 1, 28, 6.5, smoothstep(0.5, 2.0, t), t, 19);
        // Mid left leaf
        drawRoseLeaf(-0.6, 88, rad(90), -1, 24, 5.8, smoothstep(0.8, 2.3, t), t, 27);
        // Upper right leaf
        drawRoseLeaf(0.8, 74, rad(90), 1, 20, 5.0, smoothstep(1.0, 2.6, t), t, 33);
      }

      // 3. Draw The Grand 3D Blooming Rose
      // Tilted at authentic 3D three-quarter side & top angle
      const roseSize = 31 * breath * (0.35 + 0.65 * stemGrow);
      const roseAxis = [0.06 + windSway * 0.015, -0.38, 0.92];
      drawRose([stemHeadX, stemHeadY], roseAxis, roseSize, bloom, t, 42);

      // 4. Subtle Golden Stardust motes in the night
      const pv = 0.55 * smoothstep(2.0, 3.5, t);
      const off = Math.floor(t * 3.5);
      if (pv > 0) {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if ((Math.floor(rnd(c * 17 + (r + off) * 31) * 1000)) < 12) {
              const i = r * COLS + c;
              lum[i] = Math.max(lum[i], pv * (0.6 + 0.4 * Math.sin(t * 4 + r)));
              const j = i * 3;
              rgb[j] = 1.0;
              rgb[j + 1] = 0.88;
              rgb[j + 2] = 0.45;
            }
          }
        }
      }

      // 5. Rasterize ASCII Characters to Canvas
      px32.fill(0);
      let pIdx = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++, pIdx++) {
          const l = lum[pIdx];
          if (l < 0.04) continue;
          let b = 0;
          for (; b < LEVELS.length; b++) if (l < LEVELS[b]) break;
          const mask = MASKS[START[b] + (pIdx % COUNT[b])];
          const j = pIdx * 3;
          const redVal = clamp(rgb[j]) * 255;
          const grnVal = clamp(rgb[j + 1]) * 255;
          const bluVal = clamp(rgb[j + 2]) * 255;

          const x0 = c * CW, y0 = r * CH;
          for (let y = 0; y < CH; y++) {
            const di = (y0 + y) * W + x0;
            const mi = y * CW;
            for (let x = 0; x < CW; x++) {
              const a = mask[mi + x];
              if (!a) continue;
              const f = a / 255;
              px32[di + x] = 
                (255 << 24) |
                ((Math.round(bluVal * f)) << 16) |
                ((Math.round(grnVal * f)) << 8) |
                (Math.round(redVal * f));
            }
          }
        }
      }

      actx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, view.width, view.height);
      ctx.drawImage(ascii, 0, 0);
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.hasTriggeredBloom = false;
    this.t0 = performance.now();
    this.lastDraw = -1e9;

    const loop = (now) => {
      if (!this.isRunning) return;
      if (now - this.lastDraw >= 1000 / 30) {
        this.lastDraw = now;
        if (this.renderFrame) this.renderFrame(now);
      }
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
    if (this.canvas) {
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  reset() {
    this.stop();
    this.hasTriggeredBloom = false;
    this.t0 = performance.now();
  }

  resize() {
    this.init();
  }
}

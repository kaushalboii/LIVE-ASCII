/**
 * 3D ASCII Botanical Bouquet (Blooming Roses & Lilies)
 * Derived from @arimecoa/GIVEAWAY-ASCII (lily_bouquet.html)
 * Full 3D mathematical petals, organic bloom unfurling, multi-scale Gaussian bloom, and floating fireflies.
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

    // ================================================================ ตั้งค่า
const FONT_SIZE = 10, FPS = 30;
const FONT = `${FONT_SIZE}px Menlo, Consolas, "DejaVu Sans Mono", "Courier New", monospace`;
const probe = document.createElement("canvas").getContext("2d");
probe.font = FONT;
const CW = Math.max(1, Math.round(probe.measureText("M").width)), CH = Math.round(FONT_SIZE * 1.15);
// ตารางตัวอักษร: สูง 160 แถวเสมอ ส่วนความกว้างปรับตามสัดส่วนหน้าต่าง -> ภาพเต็มเบราว์เซอร์พอดี
const ROWS = 160;
const COLS = Math.max(150, Math.min(640, Math.round(ROWS * CH / CW * innerWidth / Math.max(1, innerHeight))));
const N = COLS * ROWS;
const WAVE_PERIOD = 14, BREATH = 7, BREATH_DEPTH = 0.18;
const settings = { wind: 3, size: 1.8, glow: 0.6 };   // แรงลม, ขนาดดอก, แสงฟุ้ง

const BUCKETS = [" ", ".'`", ":;,-~", "!/\\|()[]{}<>?+=", "tfjrxnuvczil", "XYUJCLQ0OZmwqpdbkhao", "#MW&8%B", "@$"];
const LEVELS = [0.06, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90];

const BUD = [0.55, 0.74, 0.36];
const STEM = [0.28, 0.56, 0.26], ANTHER = [0.95, 0.42, 0.10];
const PALETTES = {
  pink:   { deep: [0.62, 0.02, 0.30], mid: [0.96, 0.28, 0.55], tip: [1.00, 0.86, 0.92], sheen: [1.00, 0.80, 0.90], spots: 12 },
  white:  { deep: [0.62, 0.80, 0.40], mid: [0.96, 0.96, 0.92], tip: [1.00, 1.00, 0.98], sheen: [1.00, 1.00, 1.00], spots: 0, anther: [0.75, 0.38, 0.10] },
  yellow: { deep: [0.92, 0.50, 0.04], mid: [1.00, 0.84, 0.18], tip: [1.00, 0.95, 0.60], sheen: [1.00, 1.00, 0.80], spots: 4 },
  orange: { deep: [0.80, 0.22, 0.02], mid: [1.00, 0.48, 0.06], tip: [1.00, 0.66, 0.24], sheen: [1.00, 0.82, 0.55], spots: 16 },
  coral:  { deep: [0.88, 0.30, 0.22], mid: [1.00, 0.55, 0.45], tip: [1.00, 0.84, 0.74], sheen: [1.00, 0.92, 0.85], spots: 5 },
  red:    { deep: [0.38, 0.01, 0.06], mid: [0.88, 0.06, 0.16], tip: [1.00, 0.35, 0.45], sheen: [1.00, 0.70, 0.80], spots: 6 },
};
// (ตำแหน่ง, ขนาด, ทิศดอก 3D, สี, วินาทีที่เริ่มบาน, ความสว่าง) — เรียงจากหลังไปหน้า
const FLOWERS_BASE = [
  [[-25, 34], 15, [-0.5, -0.55, 0.68], "white", 5.4, 0.78],
  [[24, 30], 15, [0.5, -0.6, 0.62], "yellow", 5.8, 0.78],
  [[0, 18], 13, [0.08, -0.85, 0.5], "coral", 6.2, 0.78],
  [[-32, 64], 18, [-0.72, -0.2, 0.66], "orange", 4.8, 0.9],
  [[32, 60], 18, [0.68, -0.25, 0.68], "pink", 5.1, 0.9],
  [[-3, 46], 19, [-0.12, -0.42, 0.9], "red", 4.5, 0.9],
  [[-36, 112], 16, [-0.82, 0.1, 0.55], "yellow", 5.2, 1.0],
  [[37, 114], 16, [0.82, 0.12, 0.55], "red", 5.5, 1.0],
  [[-16, 86], 22, [-0.3, -0.18, 0.93], "pink", 3.9, 1.0],
  [[18, 88], 21, [0.3, -0.14, 0.94], "white", 4.2, 1.0],
  [[1, 114], 20, [0.02, -0.28, 0.96], "coral", 4.6, 1.0],
];
// ดอกตูม (ตำแหน่ง, ขนาด, ทิศ, ความสุก, สี)
const BUDS_BASE = [
  [[-12, 10], 9, [-0.3, -0.95, 0.1], 0.0, "red"],
  [[13, 7], 9, [0.35, -0.93, 0.1], 0.9, "pink"],
  [[39, 40], 8, [0.8, -0.55, 0.2], 0.0, "red"],
  [[-41, 42], 8, [-0.8, -0.5, 0.2], 0.7, "orange"],
  [[24, 68], 7, [0.6, -0.7, 0.3], 0.0, "red"],
];

// ================================================================ คณิตศาสตร์
const TAU = Math.PI * 2, rad = (d) => d * Math.PI / 180;
const clamp = (x, lo = 0, hi = 1) => (x < lo ? lo : x > hi ? hi : x);
function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }
const wave = (t, k, ph = 0) => Math.sin(TAU * k * t / WAVE_PERIOD + ph);
function hash3(a, b, c) {                       // สุ่มแบบคงที่: ใส่เลขเดิมได้ผลเดิม
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
const LIGHT = norm([-0.5, -0.6, 0.62]);        // แสงจากซ้ายบน

// ================================================================ ผ้าใบ (ความสว่าง + สี ของแต่ละช่อง)
const Xc = new Float32Array(COLS), Yr = new Float32Array(ROWS);
for (let c = 0; c < COLS; c++) Xc[c] = (c + 0.5 - COLS / 2) * 0.5;   // ช่องกว้างครึ่งหนึ่งของความสูง
for (let r = 0; r < ROWS; r++) Yr[r] = r + 0.5;
const lum = new Float32Array(N), rgb = new Float32Array(N * 3), rowShift = new Float32Array(ROWS);
const bgLum = new Float32Array(N), bgRgb = new Float32Array(N * 3);
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {       // จุดม่วงจาง ๆ หลังช่อดอก
  const r2 = (Xc[c] / Math.max(40, COLS * 0.21)) ** 2 + ((Yr[r] - 75) / 80) ** 2, i = r * COLS + c;
  if (hash3(r, c, 1) % 100 < 35) { bgLum[i] = 0.13 * Math.exp(-r2 * 1.6); bgRgb.set([0.45, 0.2, 0.55], i * 3); }
}
function set(i, l, cr, cg, cb) { lum[i] = l; const j = i * 3; rgb[j] = cr; rgb[j + 1] = cg; rgb[j + 2] = cb; }

// วาดรูปเรียวไปตามเส้นโค้ง: เรียก fn(ช่อง, ตำแหน่งตามยาว a, ระยะขวาง q -1..1, แถว, คอลัมน์) ทุกช่องที่อยู่ข้างใน
const SEG = new Float64Array(16 * 9);            // ข้อมูลแต่ละท่อน (คำนวณครั้งเดียวต่อการวาด)
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
    const py = Yr[r], sh = rowShift[r];                // ลมเลื่อนแถวนี้ไปเท่าไหร่ -> เลื่อนกรอบตาม
    let rx0 = 1e9, rx1 = -1e9;                          // ช่วงแนวนอนที่รูปผ่านแถวนี้จริง ๆ
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
      let best = 1, bestS = -1, bestU = 0;            // เก็บแบบยกกำลังสอง (ไม่ต้องถอดราก)
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
const lerp3 = (a, b, k) => { k = clamp(k); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };

// ================================================================ ก้าน / ใบ
function tube(pts, w0, w1, col) {
  const n = pts.length;
  if (n < 2) return;
  const hws = lin(n).map((k) => w0 + (w1 - w0) * k);
  const dark = mul(col, 0.6), lite = mul(col, 1.25);
  brush(pts, hws, lin(n), (i, a, q) => {
    const k = clamp(0.5 - 0.5 * q);
    set(i, 0.42 + 0.35 * (1 - Math.abs(q)) - 0.18 * q,
      dark[0] + (lite[0] - dark[0]) * k, dark[1] + (lite[1] - dark[1]) * k, dark[2] + (lite[2] - dark[2]) * k);
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
const LEAF_D = [0.07, 0.36, 0.13], LEAF_L = [0.38, 0.76, 0.32], UNDER = [0.46, 0.68, 0.50], OLD_TIP = [0.70, 0.66, 0.26];
// ใบลิลลี่แบบธรรมชาติ: แคบยาว ปลายแหลม โค้งลงตามน้ำหนัก บางใบหักพับ บางใบบิดจนเห็นด้านใต้ใบ
function leaf(L, t, unfurl) {
  if (unfurl <= 0.01) return;
  const n = 12, len = L.len * (0.3 + 0.7 * unfurl), wid = L.wid * (0.4 + 0.6 * unfurl);
  const ang0 = L.stemAng + (L.ang - L.stemAng) * unfurl;                  // ใบคลี่ออกจากแนวก้าน
  const sway = rad(4) * wave(t, 3, L.seed);
  const pts = [], hws = [];
  let x = L.x, y = L.y;
  for (let k = 0; k < n; k++) {
    const a = k / (n - 1);
    pts.push([x, y]);
    const tw = Math.cos(L.twist * a + L.phase);                            // บิดตัว = ความกว้างที่เห็นเปลี่ยน
    hws.push(Math.max(0.06, wid * Math.pow(Math.sin(Math.PI * Math.pow(a, 0.5)), 0.85) * (0.2 + 0.8 * Math.abs(tw))));
    const bend = L.droop * Math.pow(a, 1.6) + L.kink * smoothstep(L.kinkAt - 0.05, L.kinkAt + 0.05, a);   // โค้งลง + หักพับ
    const ang = ang0 + sway * a + L.dir * bend * unfurl;
    x += Math.cos(ang) * len / (n - 1); y += Math.sin(ang) * len / (n - 1);
  }
  brush(pts, hws, lin(n), (i, a, q) => {
    const aq = Math.abs(q), back = Math.cos(L.twist * a + L.phase) < 0;
    const lit = (q > 0) !== back ? 1 : 0;                                  // ใบพับเป็นตัว V: ซีกหนึ่งรับแสง
    let l = (0.42 + 0.28 * lit + 0.22 * Math.pow(1 - aq, 0.7)) * (0.88 + 0.12 * Math.cos(q * Math.PI * 6));
    if (aq < 0.08) l = back ? 0.78 : 0.34;                                  // เส้นกลางใบ: ด้านบนเป็นร่อง ด้านใต้นูน
    else if (aq > 0.88) l += 0.12;                                          // ขอบใบรับแสง
    l *= 0.8 + 0.2 * clamp(a * 6);                                          // โคนใบอยู่ในเงาก้าน
    let c = back ? lerp3(mul(UNDER, 0.8), UNDER, 0.4 + 0.6 * (1 - aq))      // ด้านใต้ใบ: เขียวอมฟ้าอ่อน
                 : lerp3(LEAF_D, LEAF_L, 0.3 + 0.45 * lit + 0.25 * (1 - aq));
    if (L.old) c = lerp3(c, OLD_TIP, (a - 0.8) * 4);                        // ปลายใบแก่เหลืองนิด ๆ
    set(i, clamp(l), c[0], c[1], c[2]);
  });
}

// ================================================================ ดอกลิลลี่ 3 มิติ
const BUD09 = mul(BUD, 0.9), STAMEN = [0.78, 0.55, 0.45];
function lily(center, axis, size, openness, ripe, t, seed, pal, bright) {
  if (size <= 0.3) return;
  const anther = pal.anther || ANTHER, spotRate = pal.spots;
  const a3 = norm(axis), ref = Math.abs(a3[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const u3 = norm(cross(a3, ref)), v3 = cross(a3, u3), c3 = [center[0], center[1], 0];
  const spin = rad(15) + rad(3) * wave(t, 3, seed);
  const petals = [];
  for (let k = 0; k < 6; k++) {
    const inner = k % 2 === 1, phi = spin + k * Math.PI / 3;
    const radial = add(mul(u3, Math.cos(phi)), mul(v3, Math.sin(phi))), tangent = cross(a3, radial);
    const theta = rad(5 + (inner ? 70 : 78) * openness);                  // มุมกางกลีบ
    const curl = rad(50) * Math.pow(Math.max(openness, 0), 1.5);           // ปลายกลีบม้วนกลับ
    const L = size * (inner ? 0.94 : 1), W = size * (inner ? 0.26 : 0.2), n = 9;
    const pts3 = [], hws = [];
    let p = add(c3, mul(radial, size * 0.04));
    for (let i = 0; i < n; i++) {
      const a = i / (n - 1);
      pts3.push(p);
      hws.push(W * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(a, 0.999), 0.65)), 0.85));
      const th = theta + curl * a * a;
      p = add(p, mul(add(mul(a3, Math.cos(th)), mul(radial, Math.sin(th))), L / (n - 1)));
    }
    const normal = norm(cross(norm(sub(pts3[4], pts3[0])), tangent)), facing = normal[2];
    const tproj = Math.hypot(tangent[0], tangent[1]);                       // กลีบหันข้าง = ดูแคบลง
    petals.push({
      depth: pts3.reduce((s, q) => s + q[2], 0) / n, pts: pts3.map((q) => [q[0], q[1]]),
      hws: hws.map((h) => Math.max(h * Math.max(tproj, 0.3), 0.08)), normal, facing, pseed: seed * 10 + k,
    });
  }
  petals.sort((a, b) => a.depth - b.depth);                                // ไกลก่อน ใกล้ทีหลัง
  const dim = 0.55 + 0.45 * bright, av = lin(9);
  for (const pt of petals) {
    const sg = pt.facing < 0 ? -1 : 1;
    const light = 0.35 + 0.65 * Math.max(0, dot(mul(pt.normal, sg), LIGHT));
    const back = pt.facing < 0;
    brush(pt.pts, pt.hws, av, (i, a, q, r, c) => {
      const aq = Math.abs(q);
      let l = light * (0.62 + 0.38 * Math.pow(1 - aq, 0.6)) * (back ? 0.8 : 1);
      l *= 0.75 + 0.35 * clamp(a * 2);                                      // โคนกลีบมืด
      if (aq < 0.1) l *= 0.65;                                              // ร่องกลางกลีบ
      let col = lerp3(pal.deep, pal.mid, a * 2.4);
      col = lerp3(col, pal.tip, (a - 0.55) * 1.8 + (aq - 0.7) * 1.6);
      col = lerp3(col, pal.sheen, (light - 0.75) * 2.5 * (1 - aq));       // เงามันเมื่อรับแสง
      col = lerp3(BUD09, col, ripe * clamp(0.3 + a * 1.5) + ripe * 0.3);    // ตูมอ่อน = เขียว
      if (a < 0.4 && a > 0.08 && openness > 0.4 && hash3(c, r, pt.pseed) % 100 < spotRate) l = 0.2;   // จุดกระ
      set(i, clamp(l) * bright, col[0] * dim, col[1] * dim, col[2] * dim);
    });
  }
  const show = smoothstep(0.35, 0.85, openness);                          // เกสร
  if (show <= 0) return;
  for (let k = 0; k < 7; k++) {
    const pistil = k === 6, phi = k * TAU / 6 + 0.3;
    const radial = add(mul(u3, Math.cos(phi)), mul(v3, Math.sin(phi)));
    const th = pistil ? 0 : rad(28) * openness;
    const d3 = add(mul(a3, Math.cos(th)), mul(radial, Math.sin(th)));
    const ln = size * (pistil ? 0.62 : 0.55) * show;
    const mid = add(add(c3, mul(d3, ln * 0.5)), mul(radial, pistil ? 0 : 0.4)), tip = add(c3, mul(d3, ln));
    brush([[c3[0], c3[1]], [mid[0], mid[1]], [tip[0], tip[1]]], [0.22, 0.18, 0.15], [0, 0.5, 1],
      (i) => set(i, 0.55 * bright, STAMEN[0], STAMEN[1], STAMEN[2]));
    if (!pistil) brush([[tip[0] - d3[0] * 0.9, tip[1] - d3[1] * 0.9], [tip[0] + d3[0] * 0.4, tip[1] + d3[1] * 0.4]],
      [0.55, 0.55], [0, 1], (i) => set(i, 0.9 * bright, anther[0], anther[1], anther[2]));
  }
}

// ================================================================ จัดวาง
const rnd = (k) => hash3(k, 911, 37) / 4294967296;      // สุ่มแบบคงที่ 0..1
const STEM_DUR = 1.0;                                   // ก้านงอกจากพื้นถึงปลายใช้กี่วินาที
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);   // งอกเร็วตอนแรกแล้วค่อย ๆ ช้าลง
let FLOWERS = [], BUDS = [];

function pathAt(path, frac) {                           // จุดและทิศของก้าน ณ สัดส่วน frac
  const f = frac * (path.length - 1), k = Math.min(path.length - 2, Math.floor(f)), u = f - k;
  const a = path[k], b = path[k + 1];
  return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}

function buildLayout() {
  const fl = FLOWERS_BASE.map(([pos, size, axis, col, tOpen, bright], i) => ({     // ช่อดอกรวมก้านที่โคน
    pos, size, axis, col, bright, baseX: pos[0] * 0.12, bulge: 2.5 * Math.sign(pos[0] || 1) * (i % 2 ? 1 : -0.6),
    start: 0.05 + 0.035 * i, tOpen: 1.7 + (tOpen - 3.9) * 0.55,
  }));
  const bd = BUDS_BASE.map(([pos, size, axis, ripe, col], i) => ({
    pos, size, axis, ripe, col, baseX: pos[0] * 0.12, bulge: 2.5 * Math.sign(pos[0] || 1) * (i % 2 ? -0.6 : 1),
    start: 0.15 + 0.05 * i,
  }));
  for (const o of [...fl, ...bd]) {
    o.end = o.start + STEM_DUR;                                     // เวลาที่ก้านงอกถึงปลาย
    o.path = curve([o.baseX, 172], o.pos, o.bulge, 1, 14);
  }
  fl.forEach((f, i) => {
    f.tOpen = Math.max(f.tOpen, f.end + 0.6);                       // ดอกบานหลังก้านถึงปลายแล้วเท่านั้น
    const front = f.bright > 0.8;
    // ติดใบเฉพาะช่วงก้านที่อยู่ในจอ (โคนก้านอยู่นอกจอด้านล่าง)
    const fv0 = clamp((172 - (ROWS - 4)) / (172 - f.pos[1]), 0.04, 0.6), fv1 = Math.min(0.78, fv0 + 0.62);
    const fracs = front ? [0, 0.25, 0.5, 0.75, 1].map((u) => fv0 + (fv1 - fv0) * u) : [0.55, 0.72];
    f.leaves = fracs.map((fr, j) => {
      const sd = i * 31 + j * 7 + 3, frac = clamp(fr + (rnd(sd) - 0.5) * 0.05, 0.04, 0.82);
      const p = pathAt(f.path, frac), side = (i + j) % 2 ? 1 : -1;
      const ang = p.ang + side * rad(28 + rnd(sd + 1) * 30);
      return {
        x: p.x, y: p.y, stemAng: p.ang, ang, dir: Math.cos(ang) >= 0 ? 1 : -1, seed: sd,
        len: (34 - j * 4.5) * (0.8 + rnd(sd + 2) * 0.4) * (front ? 1 : 0.75), wid: 3.0 + rnd(sd + 3) * 1.1,
        droop: rad(25 + rnd(sd + 4) * 45) * (1 - frac * 0.6),
        kink: rnd(sd + 5) < 0.45 ? rad(40 + rnd(sd + 6) * 45) : 0, kinkAt: 0.4 + rnd(sd + 7) * 0.3,
        twist: 1 + rnd(sd + 8) * 2.6, phase: rnd(sd + 9) * TAU, old: rnd(sd + 10) < 0.25,
        tAt: f.start + STEM_DUR * (1 - Math.cbrt(1 - frac)),         // เวลาที่ก้านงอกผ่านจุดติดใบ
      };
    });
  });
  FLOWERS = fl; BUDS = bd;
}
buildLayout();

// ================================================================ ฉาก
function scene(t) {
  for (let r = 0; r < ROWS; r++) {                                         // ลม: ยิ่งสูงยิ่งไหว
    const h = clamp((ROWS + 10 - Yr[r]) / 140), w = t - 0.4 * h;
    rowShift[r] = settings.wind * (0.6 * wave(w, 2) + 0.3 * wave(w, 3, 1) + 0.1 * wave(w, 5, 2)) * Math.pow(h, 1.5);
  }
  lum.set(bgLum); rgb.set(bgRgb);
  const growOf = (o) => easeOut((t - o.start) / STEM_DUR);

  for (const f of FLOWERS) for (const L of f.leaves) leaf(L, t, smoothstep(L.tAt, L.tAt + 0.55, t));   // ใบคลี่เมื่อก้านงอกผ่าน
  for (const b of BUDS) tube(curve([b.baseX, 172], b.pos, b.bulge, growOf(b), 14), 0.7, 0.45, STEM);
  for (const f of FLOWERS) tube(curve([f.baseX, 172], f.pos, f.bulge, growOf(f), 14), 0.85, 0.5, STEM);

  FLOWERS.forEach((f, i) => {                                              // ดอก (หลังไปหน้า)
    if (t < f.end) return;                                                 // ผุดหลังก้านงอกถึงปลายแล้วเท่านั้น
    const swell = smoothstep(f.end, f.end + 0.6, t);
    const ripe = smoothstep(f.tOpen - 1.0, f.tOpen + 0.3, t);
    const opening = smoothstep(f.tOpen, f.tOpen + 1.6, t);
    const breathe = BREATH_DEPTH * (0.5 - 0.5 * Math.cos(TAU * (t - f.tOpen - 3) / BREATH + i * 0.9))
      * smoothstep(f.tOpen + 1.6, f.tOpen + 3, t);
    const openness = opening * (1 - breathe);
    const s = f.size * settings.size * (0.35 + 0.65 * swell) * (0.5 + 0.5 * Math.max(openness, ripe * 0.6));
    lily(f.pos, f.axis, s, openness, ripe, t, i * 7 + 3, PALETTES[f.col], f.bright);
  });
  BUDS.forEach((b, i) => {                                                 // ดอกตูม
    if (t < b.end) return;
    const swell = smoothstep(b.end, b.end + 0.6, t);
    lily(b.pos, b.axis, b.size * (0.4 + 0.6 * swell), 0.04 + 0.03 * wave(t, 2, i),
      b.ripe * swell, t, 90 + i, PALETTES[b.col], 0.9);
  });

  const pv = 0.5 * smoothstep(3, 4.5, t), off = Math.floor(t * 4);       // จุดทองลอยขึ้นช้า ๆ เหมือนหิ่งห้อย
  if (pv > 0) for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    if (lum[i] < 0.1 && hash3(c, r + off, 77) % 1000 < 2) set(i, pv, 1, 0.8, 0.4);
  }
  const fade = smoothstep(0, 0.2, t);
  if (fade < 1) for (let i = 0; i < N; i++) lum[i] *= fade;
}

// ================================================================ ตัวอักษร -> ภาพ
// view and ctx provided by constructor
const W = COLS * CW, H = ROWS * CH;
view.width = W; view.height = H;
const CHARS = BUCKETS.join(""), START = [], COUNT = BUCKETS.map((b) => b.length);
BUCKETS.reduce((s, b, k) => { START[k] = s; return s + b.length; }, 0);
const MASKS = [...CHARS].map((ch) => {                                     // วาดตัวอักษรเก็บไว้ล่วงหน้า
  const g = document.createElement("canvas"); g.width = CW; g.height = CH;
  const gx = g.getContext("2d");
  gx.font = FONT; gx.textBaseline = "top"; gx.fillStyle = "#fff"; gx.fillText(ch, 0, 0);
  const d = gx.getImageData(0, 0, CW, CH).data, m = new Uint8Array(CW * CH);
  for (let k = 0; k < m.length; k++) m[k] = d[k * 4 + 3];
  return m;
});
const ascii = document.createElement("canvas"); ascii.width = W; ascii.height = H;   // ชั้นตัวอักษร (พื้นโปร่งใส)
const actx = ascii.getContext("2d");
const img = actx.createImageData(W, H), px = img.data, px32 = new Uint32Array(px.buffer);

const glowA = document.createElement("canvas"), glowB = document.createElement("canvas"), glowC = document.createElement("canvas");
[[glowA, 2], [glowB, 4], [glowC, 8]].forEach(([g, s]) => { g.width = Math.ceil(W / s); g.height = Math.ceil(H / s); });

function draw(frame, t) {
  px32.fill(0);
  const fidx = Math.floor(frame / 3);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c, L = lum[i];
    let level = 0;
    while (level < LEVELS.length && L >= LEVELS[level]) level++;
    if (level === 0) continue;
    const ch = START[level] + hash3(r, c, fidx) % COUNT[level], m = MASKS[ch];
    const k = (0.45 + 0.75 * L) * 1.6 / 255 * 255, j = i * 3;
    const R = rgb[j] * k, G = rgb[j + 1] * k, B = rgb[j + 2] * k;
    let o0 = (r * CH) * W + c * CW, mi = 0;
    for (let y = 0; y < CH; y++, o0 += W) {               // เขียนทีละพิกเซล (4 ไบต์รวดเดียว)
      for (let x = 0; x < CW; x++, mi++) {
        const v = m[mi];
        if (v) {
          const pr = Math.min(255, 255 * R) | 0, pg = Math.min(255, 255 * G) | 0, pb = Math.min(255, 255 * B) | 0;
          px32[o0 + x] = (v << 24) | (pb << 16) | (pg << 8) | pr;     // ความทึบ = ความหนาของเส้นตัวอักษร
        }
      }
    }
  }
  actx.putImageData(img, 0, 0);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(ascii, 0, 0);
  if (settings.glow > 0) {                                                 // แสงฟุ้งรอบดอก: ย่อภาพลงทีละครึ่งแล้วขยายทับ
    let src = ascii;
    for (const g of [glowA, glowB, glowC]) {
      const gx = g.getContext("2d");
      gx.imageSmoothingEnabled = true; gx.clearRect(0, 0, g.width, g.height);
      gx.drawImage(src, 0, 0, g.width, g.height); src = g;
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, settings.glow);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(glowC, 0, 0, W, H);
    if (settings.glow > 1) { ctx.globalAlpha = settings.glow - 1; ctx.drawImage(glowC, 0, 0, W, H); }
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

    const tick = (now) => {
      if (!this.isRunning) return;
      if (now - this.lastDraw >= 1000 / this._FPS - 2) {
        this.lastDraw = now;
        const t = (now - this.t0) / 1000;
        this._scene(t);
        this._draw(Math.floor(t * this._FPS), t);

        // When bouquet reaches full bloom (~5.2s), trigger the Cloud Note!
        if (!this.hasTriggeredBloom && t >= 5.2) {
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
    this.hasTriggeredBloom = false;
    if (this._buildLayout) {
      this._buildLayout();
    }
  }
}

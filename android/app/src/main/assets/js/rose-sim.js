/**
 * Mathematical 3D Parametric Rose Simulation
 * Derived from the user's 3D pointillism/parametric floral model,
 * specialized into an authentic 3D botanical English rose viewed from the side and top angle (three-quarter perspective).
 * 
 * Features:
 * - 3D Pitch tilt (tau ~ 36° elevation): authentic three-quarter side + top view of the blooming rose
 * - Parametric 3D petal surfaces: u (length) and v (width) mapped via sinc() curvature and profile(u)
 * - 5 nested whorl layers:
 *   - Outer guard petals (reflexing and curling downward over the front chalice rim)
 *   - Outer-mid & middle cupped petals (establishing the wide chalice silhouette)
 *   - Inner wrap petals
 *   - The Rose Spiral Heart: 9 nested Fibonacci spiral petals forming the signature spiral bud cone
 *   - Sepals: 5 lanceolate green sepals peeling back as the bud opens
 * - Sinuous Bézier stem, thorns, and serrated rose leaves fluttering in the breeze
 * - 3D Depth-sorting (Painter's algorithm): rear petals -> spiral heart -> front reflexed guard petals
 * - Rich velvet crimson palette with deep wine shadows and luminous rose-pink curled rim highlights
 * - Continuous living time-lapse bloom cycles (bud -> unfurls -> sways in breeze -> breathes)
 */

export class RoseSimulator {
  constructor(canvas) {
    this.canvas = canvas || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    if (this.canvas) {
      this.canvas.width = 720;
      this.canvas.height = 720;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    // Simulation state
    this.bloomProgress = 0.0; // 0.0 (tight bud) to 1.0 (full bloom)
    this.isPlaying = true;
    this.hasTriggeredFirstBloom = false;
    this.time = 0;
    this.cycleTime = 0;

    // Wind breeze physics
    this.breezeX = 0;
    this.breezeAngle = 0;

    // Visual configurations
    this.colorScheme = 'crimson';
    this.showDewDrops = true;
    this.showStem = true;

    // Notification callback when first full bloom is reached
    this.onBloomReady = null;

    // Build the 3D parametric petal architecture
    this.initPetalArchitecture();
  }

  // Smooth easing & mathematical helpers from the 3D parametric model
  smoothstep(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  sinc(x) {
    if (Math.abs(x) < 1e-4) return 1.0 - (x * x) / 6.0;
    return Math.sin(x) / x;
  }

  profile(u) {
    const cu = Math.max(0, Math.min(1, u));
    return Math.pow(Math.sin(Math.PI * Math.pow(cu, 0.75)), 0.85);
  }

  initPetalArchitecture() {
    // 5 Sepals at the calyx base
    this.sepalsDef = {
      n: 5,
      ac: 0.45,
      ao: 1.50, // peels back and curls downward along stem
      kc: -0.90,
      ko: 0.95,
      L: 0.95,
      wc: 0.12,
      wo: 0.18,
      off: 0.15
    };

    // 5 Nested Botanical Rose Layers
    this.layers = [
      // Layer 0: 5 Outer Guard Petals (The grand chalice rim)
      {
        name: 'outerGuard',
        n: 5,
        ac: 0.52, ao: 1.18, // flares wide in bloom
        kc: -1.15, ko: 0.65, // reflexes and curls downward
        L: 1.05,
        wc: 0.28, wo: 0.54,
        off: 0.0,
        isSpiral: false
      },
      // Layer 1: 5 Outer-Mid Petals (staggered)
      {
        name: 'outerMid',
        n: 5,
        ac: 0.42, ao: 0.88,
        kc: -0.98, ko: 0.32,
        L: 0.92,
        wc: 0.25, wo: 0.46,
        off: 0.35,
        isSpiral: false
      },
      // Layer 2: 6 Middle Petals
      {
        name: 'middle',
        n: 6,
        ac: 0.32, ao: 0.65,
        kc: -0.82, ko: 0.12,
        L: 0.78,
        wc: 0.21, wo: 0.38,
        off: 0.18,
        isSpiral: false
      },
      // Layer 3: 7 Inner Petals
      {
        name: 'inner',
        n: 7,
        ac: 0.24, ao: 0.46,
        kc: -0.62, ko: -0.05,
        L: 0.62,
        wc: 0.18, wo: 0.32,
        off: 0.45,
        isSpiral: false
      },
      // Layer 4: The Spiral Rose Heart (9 nested Fibonacci swirl petals)
      {
        name: 'spiralHeart',
        n: 9,
        ac: 0.15, ao: 0.32,
        kc: -0.42, ko: -0.15,
        L: 0.46,
        wc: 0.15, wo: 0.28,
        off: 0.1,
        isSpiral: true
      }
    ];

    // Dewdrop positions on specific petals
    this.dewDrops = [
      { layerIdx: 0, petalIdx: 1, u: 0.85, v: 0.35, r: 4.2 },
      { layerIdx: 0, petalIdx: 3, u: 0.78, v: -0.45, r: 3.5 },
      { layerIdx: 1, petalIdx: 0, u: 0.90, v: 0.20, r: 3.2 },
      { layerIdx: 1, petalIdx: 4, u: 0.82, v: -0.30, r: 3.8 },
      { layerIdx: 2, petalIdx: 2, u: 0.75, v: 0.15, r: 2.8 }
    ];
  }

  update(dt = 0.016) {
    this.time += dt;

    // Multi-harmonic organic breeze
    const slowWind = Math.sin(this.time * 0.82) * 14;
    const gust = Math.sin(this.time * 1.7 + 0.4) * 6;
    const microFlutter = Math.sin(this.time * 3.4) * 2;
    this.breezeX = slowWind + gust + microFlutter;
    this.breezeAngle = (slowWind * 0.0022) + Math.sin(this.time * 1.2) * 0.012;

    if (this.isPlaying) {
      if (!this.hasTriggeredFirstBloom) {
        // Initial grand opening from tight bud (0.0) to full open blossom (1.0)
        this.bloomProgress += dt * 0.25; // ~4.0 seconds to fully blossom
        if (this.bloomProgress >= 1.0) {
          this.bloomProgress = 1.0;
          this.hasTriggeredFirstBloom = true;
          this.cycleTime = 0;
          if (this.onBloomReady) {
            const cb = this.onBloomReady;
            this.onBloomReady = null;
            cb();
          }
        }
      } else {
        // Continuous, living time-lapse bloom cycle:
        // Full majestic bloom sways and breathes in the breeze
        this.cycleTime += dt;
        const cyclePeriod = 12.0;
        const tInCycle = this.cycleTime % cyclePeriod;

        if (tInCycle < 4.5) {
          // Full bloom with gentle living organic breath
          const breath = Math.sin(tInCycle * 1.6) * 0.022;
          this.bloomProgress = Math.min(1.0, 0.978 + breath);
        } else if (tInCycle < 8.2) {
          // Softly draws petals inward towards soft bud state
          const p = (tInCycle - 4.5) / 3.7;
          const eased = 0.5 - 0.5 * Math.cos(p * Math.PI);
          this.bloomProgress = 0.978 - 0.72 * eased;
        } else {
          // Unfurls and blooms open again in glorious time-lapse
          const p = (tInCycle - 8.2) / 3.8;
          const eased = 0.5 - 0.5 * Math.cos(p * Math.PI);
          this.bloomProgress = 0.258 + 0.72 * eased;
        }
      }
    }
  }

  resetBloom() {
    this.bloomProgress = 0.0;
    this.hasTriggeredFirstBloom = false;
    this.cycleTime = 0;
    this.isPlaying = true;
  }

  setBloomProgress(val) {
    this.bloomProgress = Math.max(0, Math.min(1, val));
    if (val === 0) {
      this.hasTriggeredFirstBloom = false;
      this.cycleTime = 0;
    }
  }

  getPalette() {
    return {
      petalDeep: '#34030a',       // Deepest inner crevice velvet
      petalBase: '#72081c',       // Rich ruby shadow
      petalMid: '#c61337',        // Radiant velvety crimson
      petalHighlight: '#ff2d5a',  // Glowing scarlet highlight
      petalRim: '#ff789a',        // Luminous petal edge curl
      petalSheen: '#ffaec2',      // Translucent highlight gleam
      calyx: '#265922',           // Natural emerald sepal
      calyxHighlight: '#448f3e',  // Fresh leaf highlight
      stem: '#224a1f',            // Sinuous rose stem
      stemShadow: '#112b0e',      // Deep forest stem shadow
      thorn: '#542012'            // Rose thorn brown
    };
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.bloomProgress;
    const pal = this.getPalette();

    // Clear background to clean transparent
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const y0 = h * 0.88;
    const Ls = h * 0.44; // Stem length
    const Lf = h * 0.32; // Flower head scale

    // Sway parameters from wind breeze
    const sway = this.breezeX * 1.1;

    // Stem Bézier control points (from the user's 3D plant script)
    const P0 = [cx, y0];
    const P1 = [cx - 0.05 * Ls, y0 - 0.33 * Ls];
    const P2 = [cx + 0.04 * Ls + sway * 0.4, y0 - 0.74 * Ls];
    const P3 = [cx + sway, y0 - Ls];

    // Flower head position
    const hx = P3[0];
    const hy = P3[1];

    // 3D Pitch tilt (tau): tilts the flower towards viewer at a 36° elevation angle
    // Gives the authentic three-quarter side + top angle view of the full rose!
    const tau = 0.58 + 0.16 * p;
    const ct = Math.cos(tau);
    const st = Math.sin(tau);

    // Yaw sway angle
    const phi = sway * 0.035;
    const cphi = Math.cos(phi);
    const sphi = Math.sin(phi);

    // 3D Projection function (from the user's Python script)
    const project = (xl, yl, zl) => {
      const yp = yl * ct - zl * st; // rotated by pitch tilt tau
      const zp = yl * st + zl * ct; // depth along view direction
      const X = hx + xl * cphi + yp * sphi;
      const Y = hy - (-xl * sphi + yp * cphi);
      return { x: X, y: Y, zp: zp, yp: yp };
    };

    // 1. Draw Stem & Leaves underneath the flower
    if (this.showStem) {
      this.drawStem(ctx, P0, P1, P2, P3, pal, p);
    }

    // 2. Generate and depth-sort all 3D petals and sepals
    const meshItems = [];

    // A. Generate Sepals in 3D
    const sepals = this.generateSepals(p, Lf, project);
    for (const s of sepals) {
      meshItems.push({ type: 'sepal', data: s, depth: s.depth });
    }

    // B. Generate Petals across all 5 botanical whorls
    for (let layerIdx = 0; layerIdx < this.layers.length; layerIdx++) {
      const layer = this.layers[layerIdx];
      const petals = this.generateLayerPetals(layer, layerIdx, p, Lf, Ls, project);
      for (const pt of petals) {
        meshItems.push({ type: 'petal', data: pt, depth: pt.depth });
      }
    }

    // C. Sort in 3D Depth Order (Painter's algorithm: smallest zp / back items first, front items last)
    meshItems.sort((a, b) => a.depth - b.depth);

    // 3. Render all sorted items
    for (const item of meshItems) {
      if (item.type === 'sepal') {
        this.renderSepal(ctx, item.data, pal, p);
      } else if (item.type === 'petal') {
        this.renderPetal(ctx, item.data, pal, p);
      }
    }

    // 4. Render Dewdrops on petals
    if (this.showDewDrops && p > 0.25) {
      this.drawDewDrops(ctx, meshItems, pal, p);
    }
  }

  // Draw the organic Bézier stem with thorns and fluttering leaves
  drawStem(ctx, P0, P1, P2, P3, pal, p) {
    ctx.save();

    // Sample points along Bézier curve
    const steps = 36;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      const q = 1 - s;
      const x = q * q * q * P0[0] + 3 * q * q * s * P1[0] + 3 * q * s * s * P2[0] + s * s * s * P3[0];
      const y = q * q * q * P0[1] + 3 * q * q * s * P1[1] + 3 * q * s * s * P2[1] + s * s * s * P3[1];
      pts.push({ x, y, s });
    }

    // Draw main stem with smooth tapering width
    ctx.beginPath();
    ctx.moveTo(pts[0].x - 8, pts[0].y);
    for (let i = 1; i <= steps; i++) {
      const w = 8 - pts[i].s * 3.5;
      ctx.lineTo(pts[i].x - w, pts[i].y);
    }
    for (let i = steps; i >= 0; i--) {
      const w = 8 - pts[i].s * 3.5;
      ctx.lineTo(pts[i].x + w, pts[i].y);
    }
    ctx.closePath();

    const stemGrad = ctx.createLinearGradient(pts[0].x - 8, pts[0].y, pts[0].x + 8, pts[0].y);
    stemGrad.addColorStop(0, pal.stemShadow);
    stemGrad.addColorStop(0.35, pal.stem);
    stemGrad.addColorStop(0.7, '#2f6826');
    stemGrad.addColorStop(1, pal.stemShadow);
    ctx.fillStyle = stemGrad;
    ctx.fill();

    // Thorns along stem
    this.drawThorn(ctx, pts[12].x - 6, pts[12].y, -1, 14, pal.thorn);
    this.drawThorn(ctx, pts[22].x + 5, pts[22].y, 1, 12, pal.thorn);

    // Rose Leaves
    this.drawRoseLeaf(ctx, pts[14].x - 6, pts[14].y, -1, p, pal);
    this.drawRoseLeaf(ctx, pts[24].x + 5, pts[24].y, 1, p, pal);

    // Calyx Receptacle (the bulbous rose hip under the flower)
    const calyxPt = pts[steps];
    ctx.beginPath();
    ctx.ellipse(calyxPt.x, calyxPt.y + 4, 16, 12, 0, 0, Math.PI * 2);
    const recGrad = ctx.createRadialGradient(calyxPt.x, calyxPt.y, 2, calyxPt.x, calyxPt.y, 16);
    recGrad.addColorStop(0, pal.calyxHighlight);
    recGrad.addColorStop(0.6, pal.calyx);
    recGrad.addColorStop(1, pal.stemShadow);
    ctx.fillStyle = recGrad;
    ctx.fill();

    ctx.restore();
  }

  drawThorn(ctx, x, y, dir, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + dir * (size * 0.7), y + 2, x + dir * size, y + size * 0.9);
    ctx.quadraticCurveTo(x + dir * (size * 0.3), y + size * 0.5, x, y + size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawRoseLeaf(ctx, x, y, dir, p, pal) {
    ctx.save();
    ctx.translate(x, y);
    const leafProgress = Math.min(1, p * 1.3);
    const scale = 0.55 + leafProgress * 0.5;
    ctx.scale(dir * scale, scale);

    const flutter = Math.sin(this.time * 2.2 + (dir > 0 ? 1 : 0)) * 0.08;
    ctx.rotate(0.32 * dir + flutter);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(38, -22, 85, -18, 115, 10);
    ctx.bezierCurveTo(85, 38, 32, 28, 0, 0);
    ctx.closePath();

    const leafGrad = ctx.createLinearGradient(0, -18, 95, 28);
    leafGrad.addColorStop(0, pal.stemShadow);
    leafGrad.addColorStop(0.45, pal.calyx);
    leafGrad.addColorStop(1, '#3b7a30');
    ctx.fillStyle = leafGrad;
    ctx.fill();

    // Central vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(55, -2, 110, 10);
    ctx.strokeStyle = '#4e9940';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  // Generate 5 lanceolate sepals in 3D
  generateSepals(p, Lf, project) {
    const def = this.sepalsDef;
    const count = def.n;
    const sepals = [];

    const sepalPeel = this.smoothstep(0.0, 0.45, p);
    const A0 = def.ac + (def.ao - def.ac) * sepalPeel;
    const K = def.kc + (def.ko - def.kc) * sepalPeel;
    const Lp = Lf * def.L * (0.85 + sepalPeel * 0.25);
    const W = def.wo * Lp;

    for (let i = 0; i < count; i++) {
      const th = (2 * Math.PI * i) / count + def.off;
      const cth = Math.cos(th);
      const sth = Math.sin(th);

      const pts = [];
      let totalZ = 0;
      const uSteps = 8;

      // Left edge (v = -1)
      for (let j = 0; j <= uSteps; j++) {
        const u = j / uSteps;
        const am = A0 + K * u * 0.5;
        const sc = this.sinc(K * u * 0.5);
        const rr = Lp * u * Math.sin(am) * sc;
        const hh = Lp * u * Math.cos(am) * sc;
        const lat = -1 * W * (1 - u); // tapers to point at tip

        const xloc = cth * rr - sth * lat;
        const yloc = hh;
        const zloc = sth * rr + cth * lat;

        const proj = project(xloc, yloc, zloc);
        pts.push(proj);
        totalZ += proj.zp;
      }

      // Right edge (v = +1)
      for (let j = uSteps; j >= 0; j--) {
        const u = j / uSteps;
        const am = A0 + K * u * 0.5;
        const sc = this.sinc(K * u * 0.5);
        const rr = Lp * u * Math.sin(am) * sc;
        const hh = Lp * u * Math.cos(am) * sc;
        const lat = 1 * W * (1 - u);

        const xloc = cth * rr - sth * lat;
        const yloc = hh;
        const zloc = sth * rr + cth * lat;

        const proj = project(xloc, yloc, zloc);
        pts.push(proj);
        totalZ += proj.zp;
      }

      sepals.push({
        pts: pts,
        depth: totalZ / pts.length,
        th: th
      });
    }

    return sepals;
  }

  renderSepal(ctx, sepal, pal, p) {
    if (sepal.pts.length < 3) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sepal.pts[0].x, sepal.pts[0].y);
    for (let i = 1; i < sepal.pts.length; i++) {
      ctx.lineTo(sepal.pts[i].x, sepal.pts[i].y);
    }
    ctx.closePath();

    const tip = sepal.pts[Math.floor(sepal.pts.length / 2)];
    const base = sepal.pts[0];
    const grad = ctx.createLinearGradient(base.x, base.y, tip.x, tip.y);
    grad.addColorStop(0, pal.stemShadow);
    grad.addColorStop(0.5, pal.calyx);
    grad.addColorStop(1, pal.calyxHighlight);
    ctx.fillStyle = grad;
    ctx.fill();

    // Sepal spine line
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.strokeStyle = 'rgba(78, 153, 64, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  // Generate 3D parametric petals for a layer
  generateLayerPetals(layer, layerIdx, bloom, Lf, Ls, project) {
    const count = layer.n;
    const petals = [];

    // Parametric elevation angle and curvature from the user's 3D floral model
    const A0 = layer.ac + (layer.ao - layer.ac) * bloom;
    const K = layer.kc + (layer.ko - layer.kc) * bloom;
    const Lp = Lf * layer.L;
    const Wc = layer.wc;
    const Wo = layer.wo;
    const curW = (Wc + (Wo - Wc) * bloom) * Lp;

    for (let i = 0; i < count; i++) {
      let th;
      if (layer.isSpiral) {
        // Fibonacci Golden Spiral for the signature Rose Heart Swirl
        th = i * 2.39996 + layer.off + 0.35 * bloom;
      } else {
        th = (2 * Math.PI * i) / count + layer.off;
      }

      const cth = Math.cos(th);
      const sth = Math.sin(th);

      const boundaryPts = [];
      const rimPts = [];
      let totalZ = 0;
      const uSteps = 10;
      const vSteps = 6;

      // 1. Left edge (v = -1, u from 0 to 1)
      for (let j = 0; j <= uSteps; j++) {
        const u = j / uSteps;
        const p3d = this.evalPetal3D(u, -1, A0, K, Lp, curW, Ls, cth, sth);
        const proj = project(p3d.x, p3d.y, p3d.z);
        boundaryPts.push(proj);
        totalZ += proj.zp;
      }

      // 2. Top ruffled rim (u = 1, v from -1 to 1)
      for (let k = 1; k < vSteps; k++) {
        const v = -1 + (2 * k) / vSteps;
        const p3d = this.evalPetal3D(1.0, v, A0, K, Lp, curW, Ls, cth, sth);
        const proj = project(p3d.x, p3d.y, p3d.z);
        boundaryPts.push(proj);
        rimPts.push(proj);
        totalZ += proj.zp;
      }

      // 3. Right edge (v = 1, u from 1 down to 0)
      for (let j = uSteps; j >= 0; j--) {
        const u = j / uSteps;
        const p3d = this.evalPetal3D(u, 1, A0, K, Lp, curW, Ls, cth, sth);
        const proj = project(p3d.x, p3d.y, p3d.z);
        boundaryPts.push(proj);
        totalZ += proj.zp;
      }

      // Center spine mid point for depth reference
      const mid3D = this.evalPetal3D(0.55, 0, A0, K, Lp, curW, Ls, cth, sth);
      const midProj = project(mid3D.x, mid3D.y, mid3D.z);

      // Petal base
      const base3D = this.evalPetal3D(0.05, 0, A0, K, Lp, curW, Ls, cth, sth);
      const baseProj = project(base3D.x, base3D.y, base3D.z);

      // Petal tip
      const tip3D = this.evalPetal3D(0.98, 0, A0, K, Lp, curW, Ls, cth, sth);
      const tipProj = project(tip3D.x, tip3D.y, tip3D.z);

      petals.push({
        boundary: boundaryPts,
        rim: rimPts,
        depth: midProj.zp,
        base: baseProj,
        tip: tipProj,
        mid: midProj,
        layerIdx: layerIdx,
        petalIdx: i,
        th: th
      });
    }

    return petals;
  }

  // Evaluate 3D coordinate of a point on the petal surface (from the user's Python script)
  evalPetal3D(u, v, A0, K, Lp, curW, Ls, cth, sth) {
    const am = A0 + K * u * 0.5;
    const sc = this.sinc(K * u * 0.5);
    let rr = Lp * u * Math.sin(am) * sc;
    const hh = Lp * u * Math.cos(am) * sc;
    const lat = v * curW * this.profile(u);

    // Cupping curvature across the petal width
    rr = rr + 0.025 * Ls - (0.5 * lat * lat) / (Lp + 1.0);

    const xloc = cth * rr - sth * lat;
    const yloc = hh;
    const zloc = sth * rr + cth * lat;

    return { x: xloc, y: yloc, z: zloc };
  }

  // Render a depth-sorted petal with velvet lighting & rim curls
  renderPetal(ctx, petal, pal, bloom) {
    if (petal.boundary.length < 3) return;
    ctx.save();

    // 1. Draw Petal Body Polygon
    ctx.beginPath();
    ctx.moveTo(petal.boundary[0].x, petal.boundary[0].y);
    for (let i = 1; i < petal.boundary.length; i++) {
      ctx.lineTo(petal.boundary[i].x, petal.boundary[i].y);
    }
    ctx.closePath();

    // 2. Velvet Shading Gradient (from deep inner crevice to glowing rim)
    const base = petal.base;
    const tip = petal.tip;
    const grad = ctx.createLinearGradient(base.x, base.y, tip.x, tip.y);

    if (petal.layerIdx >= 3) {
      // Inner spiral heart: deepest velvety ruby shadows
      grad.addColorStop(0, pal.petalDeep);
      grad.addColorStop(0.35, pal.petalBase);
      grad.addColorStop(0.72, pal.petalMid);
      grad.addColorStop(1, pal.petalHighlight);
    } else {
      // Outer petals: rich velvet with radiant scarlet highlights & luminous rim glow
      grad.addColorStop(0, pal.petalDeep);
      grad.addColorStop(0.28, pal.petalBase);
      grad.addColorStop(0.62, pal.petalMid);
      grad.addColorStop(0.85, pal.petalHighlight);
      grad.addColorStop(1, pal.petalRim);
    }

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(12, 2, 6, 0.65)';
    ctx.shadowBlur = 8 + petal.layerIdx * 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // 3. Delicate Petal Vein striations
    if (petal.layerIdx <= 2 && bloom > 0.3) {
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.strokeStyle = 'rgba(255, 180, 200, 0.18)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // 4. Curled Rim Lip Highlight (gives photorealistic 3D thickness and rim glow)
    if (petal.rim.length >= 2 && bloom > 0.15) {
      ctx.beginPath();
      ctx.moveTo(petal.rim[0].x, petal.rim[0].y);
      for (let i = 1; i < petal.rim.length; i++) {
        ctx.lineTo(petal.rim[i].x, petal.rim[i].y);
      }
      ctx.strokeStyle = petal.layerIdx >= 3 ? 'rgba(255, 120, 155, 0.55)' : 'rgba(255, 185, 210, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Sparkling morning dewdrops on petals
  drawDewDrops(ctx, meshItems, pal, bloom) {
    ctx.save();
    const alpha = this.smoothstep(0.25, 0.6, bloom);
    ctx.globalAlpha = alpha;

    for (const drop of this.dewDrops) {
      // Find matching petal
      const match = meshItems.find(
        m => m.type === 'petal' && m.data.layerIdx === drop.layerIdx && m.data.petalIdx === drop.petalIdx
      );
      if (!match) continue;

      const pt = match.data;
      const dx = pt.base.x + (pt.tip.x - pt.base.x) * drop.u + (drop.v * 16);
      const dy = pt.base.y + (pt.tip.y - pt.base.y) * drop.u;

      // Drop shadow
      ctx.beginPath();
      ctx.arc(dx + 1, dy + 1.5, drop.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 0, 5, 0.45)';
      ctx.fill();

      // Droplet body with refraction
      const dropGrad = ctx.createRadialGradient(
        dx - drop.r * 0.35, dy - drop.r * 0.35, drop.r * 0.1,
        dx, dy, drop.r
      );
      dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      dropGrad.addColorStop(0.3, 'rgba(255, 200, 215, 0.6)');
      dropGrad.addColorStop(0.7, 'rgba(180, 20, 50, 0.3)');
      dropGrad.addColorStop(1, 'rgba(40, 5, 10, 0.8)');
      ctx.fillStyle = dropGrad;
      ctx.beginPath();
      ctx.arc(dx, dy, drop.r, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight
      ctx.beginPath();
      ctx.arc(dx - drop.r * 0.35, dy - drop.r * 0.35, drop.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    ctx.restore();
  }
}

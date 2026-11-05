/**
 * Realistic Procedural Rose Blooming Simulation
 * Simulates a photorealistic crimson rose blooming organically over time.
 * Supports realistic petals, sepals, stem, velvet shading, lighting, and dew drops.
 * 
 * Features:
 * - Single majestic rose (scaled up for high-definition grandeur)
 * - Multi-harmonic organic breeze simulation (wind sway, stem arching, fluttering petals)
 * - Continuous living bloom respiration cycle (breathing & swaying endlessly in the air)
 */

export class RoseSimulator {
  constructor(canvas) {
    this.canvas = canvas || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    if (this.canvas) {
      this.canvas.width = 800;
      this.canvas.height = 800;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    // Simulation state
    this.bloomProgress = 0.0; // 0.0 (tight bud) to 1.0 (full bloom)
    this.speed = 0.32; // Smooth, realistic blooming speed (~3.1s from bud to full bloom)
    this.isPlaying = true;
    this.hasReachedFullBloom = false;
    this.time = 0; // organic sway clock
    this.breathTime = 0; // continuous living bloom breath clock

    // Multi-frequency wind breeze physics
    this.breezeX = 0;
    this.breezeY = 0;
    this.breezeAngle = 0;

    // Visual configurations
    this.colorScheme = 'crimson';
    this.showDewDrops = true;
    this.showStem = true;

    // Notification callback when first full bloom is reached
    this.onBloomReady = null;

    // Pre-generate petal configurations for botanical realism
    this.initPetalArchitecture();
  }

  initPetalArchitecture() {
    // Botanical sepal configuration (5 sepals that peel back smoothly as bud opens)
    this.sepals = [];
    const sepalCount = 5;
    for (let i = 0; i < sepalCount; i++) {
      const angle = (i * 2 * Math.PI) / sepalCount + 0.15;
      this.sepals.push({
        baseAngle: angle,
        length: 185,
        width: 48,
        curl: 0.85 + (i % 2) * 0.2,
        leafTipSpread: 1.25
      });
    }

    // Concentric petal whorls scaled up for a magnificent single centerpiece rose
    this.layers = [
      {
        name: 'outerGuard',
        count: 5,
        startT: 0.06,
        endT: 0.52,
        baseRadius: 215, // Grand outer petals
        budRadius: 48,
        petalWidth: 205,
        budWidth: 54,
        petalHeight: 245,
        budHeight: 108,
        curlFactor: 0.88,
        shadowIntensity: 0.48,
        angleOffset: 0.2
      },
      {
        name: 'outerMid',
        count: 6,
        startT: 0.18,
        endT: 0.68,
        baseRadius: 180,
        budRadius: 38,
        petalWidth: 180,
        budWidth: 45,
        petalHeight: 215,
        budHeight: 98,
        curlFactor: 0.78,
        shadowIntensity: 0.42,
        angleOffset: 0.55
      },
      {
        name: 'middle',
        count: 7,
        startT: 0.32,
        endT: 0.80,
        baseRadius: 145,
        budRadius: 30,
        petalWidth: 152,
        budWidth: 36,
        petalHeight: 180,
        budHeight: 86,
        curlFactor: 0.68,
        shadowIntensity: 0.36,
        angleOffset: 0.15
      },
      {
        name: 'innerMid',
        count: 8,
        startT: 0.48,
        endT: 0.90,
        baseRadius: 105,
        budRadius: 24,
        petalWidth: 120,
        budWidth: 28,
        petalHeight: 145,
        budHeight: 74,
        curlFactor: 0.52,
        shadowIntensity: 0.3,
        angleOffset: 0.4
      },
      {
        name: 'coreSpiral',
        count: 9,
        startT: 0.62,
        endT: 1.0,
        baseRadius: 66,
        budRadius: 16,
        petalWidth: 82,
        budWidth: 22,
        petalHeight: 108,
        budHeight: 62,
        curlFactor: 0.36,
        shadowIntensity: 0.25,
        angleOffset: 0.7
      }
    ];

    // Dew drops positioned on petals
    this.dewDrops = [
      { layerIdx: 0, petalIdx: 1, relX: 0.25, relY: -0.65, r: 5.0 },
      { layerIdx: 0, petalIdx: 3, relX: -0.3, relY: -0.55, r: 4.0 },
      { layerIdx: 1, petalIdx: 0, relX: 0.15, relY: -0.7, r: 3.5 },
      { layerIdx: 1, petalIdx: 4, relX: -0.2, relY: -0.6, r: 4.5 },
      { layerIdx: 2, petalIdx: 2, relX: 0.1, relY: -0.5, r: 3.2 },
      { layerIdx: 2, petalIdx: 5, relX: -0.15, relY: -0.45, r: 3.8 }
    ];
  }

  // Smooth easing functions
  smoothstep(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
  }

  cubicEaseOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  update(dt = 0.016) {
    this.time += dt;

    // Multi-harmonic organic breeze physics
    // Compound sinusoidal wind sway: slow drift + medium wave + micro-gust flutter
    const slowWind = Math.sin(this.time * 0.75) * 14;
    const gust = Math.sin(this.time * 1.6 + 0.5) * 8;
    const microFlutter = Math.sin(this.time * 3.2) * 3;
    this.breezeX = slowWind + gust + microFlutter;
    this.breezeY = Math.cos(this.time * 1.1) * 4;
    this.breezeAngle = (slowWind * 0.0028) + Math.sin(this.time * 1.3) * 0.018;

    if (this.isPlaying) {
      if (!this.hasReachedFullBloom) {
        // Initial bloom sequence from tight bud to magnificent full open blossom
        this.bloomProgress += this.speed * dt;
        if (this.bloomProgress >= 1.0) {
          this.bloomProgress = 1.0;
          this.hasReachedFullBloom = true;
          if (this.onBloomReady) {
            const cb = this.onBloomReady;
            this.onBloomReady = null;
            cb();
          }
        }
      } else {
        // Continuous living bloom respiration:
        // The petals continuously breathe, flex, and undulate in the air
        this.breathTime += dt;
        this.bloomProgress = 0.96 + 0.04 * Math.sin(this.breathTime * 1.3);
      }
    }
  }

  resetBloom() {
    this.bloomProgress = 0.0;
    this.hasReachedFullBloom = false;
    this.breathTime = 0;
    this.isPlaying = true;
  }

  setBloomProgress(val) {
    this.bloomProgress = Math.max(0, Math.min(1, val));
    if (val === 0) {
      this.hasReachedFullBloom = false;
      this.breathTime = 0;
    }
  }

  // Color palettes for petals & stem
  getPalette() {
    switch (this.colorScheme) {
      case 'sunset':
        return {
          petalDeep: '#4a0808',
          petalBase: '#b31520',
          petalMid: '#e64010',
          petalHighlight: '#ff9020',
          petalRim: '#ffd166',
          calyx: '#20471c',
          calyxHighlight: '#3c7a31',
          stem: '#193816',
          stemShadow: '#0d210b',
          stamens: '#ffe066'
        };
      case 'pink':
        return {
          petalDeep: '#40081c',
          petalBase: '#8e1a47',
          petalMid: '#d43b78',
          petalHighlight: '#f77fbe',
          petalRim: '#fce4ec',
          calyx: '#264e1f',
          calyxHighlight: '#3c7a31',
          stem: '#1d3e18',
          stemShadow: '#0f240c',
          stamens: '#fff099'
        };
      case 'white':
        return {
          petalDeep: '#233020',
          petalBase: '#688264',
          petalMid: '#d3dec9',
          petalHighlight: '#eaf2e3',
          petalRim: '#ffffff',
          calyx: '#2f5727',
          calyxHighlight: '#4c873f',
          stem: '#21421a',
          stemShadow: '#10240d',
          stamens: '#e5be01'
        };
      case 'cyber':
        return {
          petalDeep: '#18002e',
          petalBase: '#4a0072',
          petalMid: '#a800ff',
          petalHighlight: '#00ffff',
          petalRim: '#ffffff',
          calyx: '#00332c',
          calyxHighlight: '#006659',
          stem: '#002620',
          stemShadow: '#001410',
          stamens: '#ff007f'
        };
      case 'crimson':
      default:
        return {
          petalDeep: '#5c0818',      // Rich burgundy shadow
          petalBase: '#990c28',      // Deep ruby velvet
          petalMid: '#d9183d',       // Brilliant crimson
          petalHighlight: '#ff3362', // Glowing scarlet-rose highlight
          petalRim: '#ff7a98',       // Luminous petal edge curl
          calyx: '#2e6b2c',          // Natural emerald sepal
          calyxHighlight: '#4e9e49', // Fresh leaf highlight
          stem: '#2a5a28',           // Natural vibrant stem
          stemShadow: '#153314',     // Deep forest stem
          stamens: '#ffcc33'         // Center golden pollen
        };
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.bloomProgress;
    const pal = this.getPalette();

    // Clear background to clean transparent
    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2 - 25; // Elevated to reveal stem and sepals gracefully

    // Single grand blooming rose moving in the breeze
    ctx.save();
    ctx.translate(centerX + this.breezeX, centerY + this.breezeY);
    ctx.rotate(this.breezeAngle);

    if (this.showStem) this.drawStem(ctx, pal, p);
    this.drawSepals(ctx, pal, p);
    this.drawPetalLayers(ctx, pal, p);
    if (p > 0.5) this.drawStamens(ctx, pal, p);
    if (this.showDewDrops && p > 0.25) this.drawDewDrops(ctx, p);

    ctx.restore();
  }

  drawStem(ctx, pal, p) {
    ctx.save();
    const stemStartY = 45 - p * 18;
    const stemLength = 400;
    // Stem flexes organically with wind breeze
    const flex = this.breezeX * 0.45;

    ctx.beginPath();
    ctx.moveTo(-13, stemStartY);
    ctx.bezierCurveTo(
      -18 - flex * 0.35, stemStartY + 120,
      -10 - flex * 0.7, stemStartY + 240,
      -10, stemStartY + stemLength
    );
    ctx.lineTo(12, stemStartY + stemLength);
    ctx.bezierCurveTo(
      10 - flex * 0.7, stemStartY + 240,
      18 - flex * 0.35, stemStartY + 120,
      15, stemStartY
    );
    ctx.closePath();

    const stemGrad = ctx.createLinearGradient(-15, stemStartY, 15, stemStartY);
    stemGrad.addColorStop(0, pal.stemShadow);
    stemGrad.addColorStop(0.35, pal.stem);
    stemGrad.addColorStop(0.7, '#2f6826');
    stemGrad.addColorStop(1, pal.stemShadow);
    ctx.fillStyle = stemGrad;
    ctx.fill();

    // Natural stem thorns
    this.drawThorn(ctx, -14 - flex * 0.28, stemStartY + 110, -1, 16, pal.stem);
    this.drawThorn(ctx, 12 - flex * 0.6, stemStartY + 210, 1, 14, pal.stem);

    // Stem leaves fluttering gently in the breeze
    this.drawStemLeaf(ctx, -12 - flex * 0.35, stemStartY + 135, -1, p, pal);
    this.drawStemLeaf(ctx, 12 - flex * 0.65, stemStartY + 245, 1, p, pal);

    ctx.restore();
  }

  drawThorn(ctx, x, y, dir, size, color) {
    ctx.save();
    ctx.fillStyle = '#4a2511';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + dir * (size * 0.7), y + 2, x + dir * size, y + size * 0.9);
    ctx.quadraticCurveTo(x + dir * (size * 0.3), y + size * 0.5, x, y + size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawStemLeaf(ctx, x, y, dir, p, pal) {
    ctx.save();
    ctx.translate(x, y);
    const leafProgress = Math.min(1, p * 1.4);
    const leafScale = 0.55 + leafProgress * 0.55;
    ctx.scale(dir * leafScale, leafScale);

    // Breeze flutter on leaf
    const leafFlutter = Math.sin(this.time * 2.2 + (dir > 0 ? 1 : 0)) * 0.08;
    ctx.rotate(0.35 * dir + leafFlutter);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(40, -22, 95, -18, 130, 12);
    ctx.bezierCurveTo(95, 40, 35, 30, 0, 0);
    ctx.closePath();

    const leafGrad = ctx.createLinearGradient(0, -18, 105, 30);
    leafGrad.addColorStop(0, pal.stemShadow);
    leafGrad.addColorStop(0.5, pal.calyx);
    leafGrad.addColorStop(1, '#3b7a30');
    ctx.fillStyle = leafGrad;
    ctx.fill();

    // Leaf main vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(65, -2, 125, 12);
    ctx.strokeStyle = '#4e9940';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.restore();
  }

  drawSepals(ctx, pal, p) {
    ctx.save();
    const sepalPeel = this.smoothstep(0.0, 0.45, p);

    for (let sepal of this.sepals) {
      ctx.save();
      ctx.rotate(sepal.baseAngle);

      // Deflection angle as it opens
      const openAngle = sepalPeel * 0.75 * sepal.curl;
      ctx.rotate(openAngle);

      const length = sepal.length * (0.8 + sepalPeel * 0.25);
      const width = sepal.width;

      ctx.beginPath();
      ctx.moveTo(0, 18);
      // Serrated botanical sepal tip
      ctx.bezierCurveTo(
        width * 0.8, 35,
        width * 0.6, length * 0.6,
        0, length
      );
      ctx.bezierCurveTo(
        -width * 0.6, length * 0.6,
        -width * 0.8, 35,
        0, 18
      );
      ctx.closePath();

      const sepalGrad = ctx.createLinearGradient(0, 18, 0, length);
      sepalGrad.addColorStop(0, pal.stemShadow);
      sepalGrad.addColorStop(0.4, pal.calyx);
      sepalGrad.addColorStop(0.85, pal.calyxHighlight || '#3c7a31');
      sepalGrad.addColorStop(1, '#1b3b16');
      ctx.fillStyle = sepalGrad;
      ctx.fill();

      // Sepal spine
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(0, length - 5);
      ctx.strokeStyle = 'rgba(78, 153, 64, 0.6)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  drawPetalLayers(ctx, pal, p) {
    for (let layerIdx = 0; layerIdx < this.layers.length; layerIdx++) {
      const layer = this.layers[layerIdx];
      const layerProgress = this.smoothstep(layer.startT, layer.endT, p);
      this.drawSingleLayer(ctx, layer, layerIdx, layerProgress, pal, p);
    }
  }

  drawSingleLayer(ctx, layer, layerIdx, layerProgress, pal, globalProgress) {
    const count = layer.count;
    const eased = this.cubicEaseOut(layerProgress);

    // Current dimensions interpolated from bud state to full bloom
    const radius = layer.budRadius + (layer.baseRadius - layer.budRadius) * eased;
    const petalW = layer.budWidth + (layer.petalWidth - layer.budWidth) * eased;
    const petalH = layer.budHeight + (layer.petalHeight - layer.budHeight) * eased;

    const angleStep = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
      const baseAngle = i * angleStep + layer.angleOffset;
      const petalJitter = Math.sin(i * 3.7 + layerIdx) * 0.08;
      const angle = baseAngle + petalJitter;

      ctx.save();
      ctx.rotate(angle);

      // Petal tilt distance from center
      const dist = radius * (0.3 + eased * 0.7);

      // Petal opening curl
      const flare = eased * layer.curlFactor;

      this.renderPetal(
        ctx,
        0,
        -dist,
        petalW,
        petalH,
        flare,
        layerIdx,
        i,
        pal,
        globalProgress
      );

      ctx.restore();
    }
  }

  renderPetal(ctx, x, y, width, height, flare, layerIdx, petalIdx, pal, globalProgress) {
    ctx.save();
    ctx.translate(x, y);

    const w2 = width / 2;
    const h = height;

    // Flutter on petal edge from ambient breeze
    const breezeFlutter = Math.sin(this.time * 2.4 + petalIdx * 1.6 + layerIdx) * (3.0 + 2.0 * Math.abs(this.breezeAngle) * 25) * flare;
    const lipCurl = flare * 38;
    const ruffle = (Math.sin(petalIdx * 2.5 + globalProgress * 2) * 5 + breezeFlutter) * flare;

    // Petal ambient drop shadow for deep velvety dimensionality
    ctx.shadowColor = 'rgba(10, 0, 4, 0.70)';
    ctx.shadowBlur = 14 + layerIdx * 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // 1. Draw Petal Body Path (magnificent rounded cup)
    ctx.beginPath();
    ctx.moveTo(0, 0);

    // Left outer contour
    ctx.bezierCurveTo(
      -w2 * 0.92, -h * 0.25,
      -w2 * 1.18, -h * 0.75,
      -w2 * 0.46 + ruffle, -h - lipCurl
    );

    // Top ruffled edge
    ctx.bezierCurveTo(
      -w2 * 0.16, -h - lipCurl * 1.18,
      w2 * 0.16, -h - lipCurl * 1.18,
      w2 * 0.46 - ruffle, -h - lipCurl
    );

    // Right outer contour
    ctx.bezierCurveTo(
      w2 * 1.18, -h * 0.75,
      w2 * 0.92, -h * 0.25,
      0, 0
    );

    ctx.closePath();

    // 2. Realistic Petal Gradient (Subsurface Scattering & Velvet Sheen)
    const petalGrad = ctx.createRadialGradient(
      0, -h * 0.2, 5,
      0, -h * 0.7, h * 0.88
    );

    if (layerIdx >= 3) {
      // Core petals: deep mysterious velvet
      petalGrad.addColorStop(0, pal.petalDeep);
      petalGrad.addColorStop(0.35, pal.petalBase);
      petalGrad.addColorStop(0.7, pal.petalMid);
      petalGrad.addColorStop(1, pal.petalHighlight);
    } else {
      // Outer petals: luminous highlights and translucent rim glow
      petalGrad.addColorStop(0, pal.petalDeep);
      petalGrad.addColorStop(0.28, pal.petalBase);
      petalGrad.addColorStop(0.62, pal.petalMid);
      petalGrad.addColorStop(0.86, pal.petalHighlight);
      petalGrad.addColorStop(1, pal.petalRim);
    }

    ctx.fillStyle = petalGrad;
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // 3. Delicate petal vein highlights
    this.drawPetalTexture(ctx, w2, h, lipCurl, pal, layerIdx);

    // 4. Curled outer edge highlight (gives photorealistic thickness and rim lighting)
    if (flare > 0.15) {
      this.drawPetalRimCurl(ctx, w2, h, lipCurl, ruffle, pal, flare);
    }

    ctx.restore();
  }

  drawPetalTexture(ctx, w2, h, lipCurl, pal, layerIdx) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.strokeStyle = 'rgba(255, 180, 195, 0.20)';
    ctx.lineWidth = 1.0;

    const veinCount = 5;
    for (let v = -2; v <= 2; v++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const targetX = v * (w2 * 0.38);
      const ctrlX = v * (w2 * 0.2);
      ctx.quadraticCurveTo(ctrlX, -h * 0.5, targetX, -h * 0.85 - lipCurl * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPetalRimCurl(ctx, w2, h, lipCurl, ruffle, pal, flare) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-w2 * 0.5 + ruffle, -h - lipCurl);
    ctx.bezierCurveTo(
      -w2 * 0.2, -h - lipCurl * 1.25,
      w2 * 0.2, -h - lipCurl * 1.25,
      w2 * 0.5 - ruffle, -h - lipCurl
    );
    ctx.bezierCurveTo(
      w2 * 0.2, -h - lipCurl * 0.85,
      -w2 * 0.2, -h - lipCurl * 0.85,
      -w2 * 0.5 + ruffle, -h - lipCurl
    );
    ctx.closePath();

    const rimGrad = ctx.createLinearGradient(0, -h - lipCurl * 1.2, 0, -h - lipCurl * 0.8);
    rimGrad.addColorStop(0, 'rgba(255, 230, 240, 0.7)');
    rimGrad.addColorStop(0.5, pal.petalRim);
    rimGrad.addColorStop(1, 'rgba(212, 25, 59, 0)');
    ctx.fillStyle = rimGrad;
    ctx.fill();

    ctx.restore();
  }

  drawStamens(ctx, pal, p) {
    ctx.save();
    const stamenProgress = this.smoothstep(0.65, 1.0, p);
    const count = 42;
    const maxRadius = 30 * stamenProgress;

    ctx.fillStyle = pal.stamens;
    ctx.strokeStyle = '#8a5d00';
    ctx.lineWidth = 1.0;

    for (let i = 0; i < count; i++) {
      const r = Math.sqrt((i + 1) / count) * maxRadius;
      const theta = i * 2.39996; // Golden angle

      const sx = Math.cos(theta) * r;
      const sy = Math.sin(theta) * r;

      ctx.beginPath();
      ctx.moveTo(sx * 0.2, sy * 0.2);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx, sy, 2.0 + Math.sin(i) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawDewDrops(ctx, p) {
    ctx.save();
    const dropAlpha = this.smoothstep(0.25, 0.6, p);
    ctx.globalAlpha = dropAlpha;

    for (let drop of this.dewDrops) {
      const layer = this.layers[drop.layerIdx];
      const layerProgress = this.smoothstep(layer.startT, layer.endT, p);
      if (layerProgress < 0.3) continue;

      const angleStep = (2 * Math.PI) / layer.count;
      const angle = drop.petalIdx * angleStep + layer.angleOffset;
      const radius = layer.budRadius + (layer.baseRadius - layer.budRadius) * this.cubicEaseOut(layerProgress);
      const petalH = layer.budHeight + (layer.petalHeight - layer.budHeight) * this.cubicEaseOut(layerProgress);

      ctx.save();
      ctx.rotate(angle);

      const dx = drop.relX * (layer.petalWidth * 0.4);
      const dy = -radius * 0.5 + drop.relY * (petalH * 0.5);

      // Dew drop shadow
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

      ctx.restore();
    }
    ctx.restore();
  }
}

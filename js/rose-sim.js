/**
 * Realistic Procedural Rose Blooming Simulation
 * Simulates a photorealistic crimson rose blooming organically over time.
 * Supports realistic petals, sepals, stem, velvet shading, lighting, and dew drops.
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
    this.targetProgress = 1.0;
    this.speed = 0.08; // speed of blooming
    this.isPlaying = true;
    this.loopMode = 'pingpong'; // 'pingpong', 'loop', 'once'
    this.direction = 1; // 1 for blooming, -1 for closing
    this.time = 0; // organic sway clock

    // Visual configurations
    this.colorScheme = 'crimson'; // 'crimson', 'pink', 'white', 'black', 'sunset', 'cyber'
    this.showDewDrops = true;
    this.showStem = true;
    this.swayAmount = 0.03;

    // Pre-generate petal configurations for botanical realism
    this.initPetalArchitecture();
  }

  initPetalArchitecture() {
    // A realistic rose has 5 sepals (calyx) and 25-35 layered petals arranged in Fibonacci whorls
    this.sepals = [];
    const sepalCount = 5;
    for (let i = 0; i < sepalCount; i++) {
      const angle = (i * 2 * Math.PI) / sepalCount + 0.15;
      this.sepals.push({
        baseAngle: angle,
        length: 140,
        width: 38,
        curl: 0.8 + (i % 2) * 0.2,
        leafTipSpread: 1.2
      });
    }

    // Concentric petal whorls from outer (opens first) to inner core (opens last)
    // Layer 0: Calyx base
    // Layer 1: Outer guard petals (5 massive petals)
    // Layer 2: Outer mid petals (6 petals)
    // Layer 3: Middle whorl (7 petals)
    // Layer 4: Inner whorl (8 petals)
    // Layer 5: Spiral heart/core (9 small tight petals)
    this.layers = [
      {
        name: 'outerGuard',
        count: 5,
        startT: 0.08,
        endT: 0.55,
        baseRadius: 155,
        budRadius: 40,
        petalWidth: 150,
        budWidth: 45,
        petalHeight: 180,
        budHeight: 85,
        curlFactor: 0.85,
        shadowIntensity: 0.45,
        angleOffset: 0.2
      },
      {
        name: 'outerMid',
        count: 6,
        startT: 0.2,
        endT: 0.7,
        baseRadius: 130,
        budRadius: 32,
        petalWidth: 135,
        budWidth: 38,
        petalHeight: 160,
        budHeight: 80,
        curlFactor: 0.75,
        shadowIntensity: 0.4,
        angleOffset: 0.55
      },
      {
        name: 'middle',
        count: 7,
        startT: 0.35,
        endT: 0.82,
        baseRadius: 105,
        budRadius: 26,
        petalWidth: 115,
        budWidth: 32,
        petalHeight: 135,
        budHeight: 72,
        curlFactor: 0.65,
        shadowIntensity: 0.35,
        angleOffset: 0.15
      },
      {
        name: 'innerMid',
        count: 8,
        startT: 0.5,
        endT: 0.92,
        baseRadius: 75,
        budRadius: 20,
        petalWidth: 90,
        budWidth: 26,
        petalHeight: 110,
        budHeight: 65,
        curlFactor: 0.5,
        shadowIntensity: 0.3,
        angleOffset: 0.4
      },
      {
        name: 'coreSpiral',
        count: 9,
        startT: 0.65,
        endT: 1.0,
        baseRadius: 48,
        budRadius: 14,
        petalWidth: 60,
        budWidth: 20,
        petalHeight: 80,
        budHeight: 55,
        curlFactor: 0.35,
        shadowIntensity: 0.25,
        angleOffset: 0.7
      }
    ];

    // Dew drops positioned on petals
    this.dewDrops = [
      { layerIdx: 0, petalIdx: 1, relX: 0.25, relY: -0.65, r: 4.5 },
      { layerIdx: 0, petalIdx: 3, relX: -0.3, relY: -0.55, r: 3.5 },
      { layerIdx: 1, petalIdx: 0, relX: 0.15, relY: -0.7, r: 3.0 },
      { layerIdx: 1, petalIdx: 4, relX: -0.2, relY: -0.6, r: 4.0 },
      { layerIdx: 2, petalIdx: 2, relX: 0.1, relY: -0.5, r: 2.8 },
      { layerIdx: 2, petalIdx: 5, relX: -0.15, relY: -0.45, r: 3.2 }
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

    if (this.isPlaying) {
      this.bloomProgress += this.direction * this.speed * dt;

      if (this.bloomProgress >= 1.0) {
        this.bloomProgress = 1.0;
        if (this.loopMode === 'pingpong') {
          this.direction = -1;
        } else if (this.loopMode === 'loop') {
          this.bloomProgress = 0.0;
        } else {
          this.isPlaying = false;
        }
      } else if (this.bloomProgress <= 0.0) {
        this.bloomProgress = 0.0;
        if (this.loopMode === 'pingpong') {
          this.direction = 1;
        }
      }
    }
  }

  setBloomProgress(val) {
    this.bloomProgress = Math.max(0, Math.min(1, val));
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

    // Clear background to clean transparent/dark studio atmosphere
    ctx.clearRect(0, 0, w, h);

    // Pure transparent background — no dark card box or vignette
    ctx.clearRect(0, 0, w, h);

    ctx.save();

    // Center of rose blossom
    const centerX = w / 2;
    const centerY = h / 2 + 30; // slightly down to frame petals

    // Organic micro sway (breezy natural life movement)
    const swayX = Math.sin(this.time * 1.5) * 4 * this.swayAmount * 30;
    const swayY = Math.cos(this.time * 1.8) * 2 * this.swayAmount * 30;
    const swayAngle = Math.sin(this.time * 1.2) * 0.015;

    ctx.translate(centerX + swayX, centerY + swayY);
    ctx.rotate(swayAngle);

    // 1. Draw Stem and Calyx Base underneath
    if (this.showStem) {
      this.drawStem(ctx, pal, p);
    }

    // 2. Draw Calyx Sepals (the green protective leafy cups that peel back)
    this.drawSepals(ctx, pal, p);

    // 3. Draw Rose Petals from outermost to innermost
    // We sort/render layers so that outer back petals draw first, then center, then foreground outer petals
    this.drawPetalLayers(ctx, pal, p);

    // 4. Center Stamens (revealed at near full bloom)
    if (p > 0.6) {
      this.drawStamens(ctx, pal, p);
    }

    // 5. Dew drops
    if (this.showDewDrops && p > 0.25) {
      this.drawDewDrops(ctx, p);
    }

    ctx.restore();
  }

  drawStem(ctx, pal, p) {
    ctx.save();
    // Stem grows downward
    const stemStartY = 35 - p * 15;
    const stemLength = 340;

    // Stem path
    ctx.beginPath();
    ctx.moveTo(-10, stemStartY);
    ctx.bezierCurveTo(-14, stemStartY + 100, -6, stemStartY + 200, -8, stemStartY + stemLength);
    ctx.lineTo(10, stemStartY + stemLength);
    ctx.bezierCurveTo(8, stemStartY + 200, 14, stemStartY + 100, 12, stemStartY);
    ctx.closePath();

    const stemGrad = ctx.createLinearGradient(-12, stemStartY, 12, stemStartY);
    stemGrad.addColorStop(0, pal.stemShadow);
    stemGrad.addColorStop(0.35, pal.stem);
    stemGrad.addColorStop(0.7, '#2f6826');
    stemGrad.addColorStop(1, pal.stemShadow);
    ctx.fillStyle = stemGrad;
    ctx.fill();

    // Stem thorns
    this.drawThorn(ctx, -11, stemStartY + 95, -1, 14, pal.stem);
    this.drawThorn(ctx, 10, stemStartY + 175, 1, 12, pal.stem);

    // Stem Leaves
    this.drawStemLeaf(ctx, -10, stemStartY + 120, -1, p, pal);
    this.drawStemLeaf(ctx, 10, stemStartY + 210, 1, p, pal);

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
    const leafScale = 0.5 + leafProgress * 0.5;
    ctx.scale(dir * leafScale, leafScale);

    ctx.rotate(0.35 * dir);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(35, -20, 80, -15, 110, 10);
    ctx.bezierCurveTo(80, 35, 30, 25, 0, 0);
    ctx.closePath();

    const leafGrad = ctx.createLinearGradient(0, -15, 90, 25);
    leafGrad.addColorStop(0, pal.stemShadow);
    leafGrad.addColorStop(0.5, pal.calyx);
    leafGrad.addColorStop(1, '#3b7a30');
    ctx.fillStyle = leafGrad;
    ctx.fill();

    // Leaf main vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(55, -2, 105, 10);
    ctx.strokeStyle = '#4e9940';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  drawSepals(ctx, pal, p) {
    // Sepals are the green bracts at the base of the flower.
    // In a bud, they tightly hold the flower; as it blooms, they peel backward.
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
      ctx.moveTo(0, 15);
      // Serrated / pointed botanical sepal tip
      ctx.bezierCurveTo(
        width * 0.8, 30,
        width * 0.6, length * 0.6,
        0, length
      );
      ctx.bezierCurveTo(
        -width * 0.6, length * 0.6,
        -width * 0.8, 30,
        0, 15
      );
      ctx.closePath();

      const sepalGrad = ctx.createLinearGradient(0, 15, 0, length);
      sepalGrad.addColorStop(0, pal.stemShadow);
      sepalGrad.addColorStop(0.4, pal.calyx);
      sepalGrad.addColorStop(0.85, pal.calyxHighlight || '#3c7a31');
      sepalGrad.addColorStop(1, '#1b3b16');
      ctx.fillStyle = sepalGrad;
      ctx.fill();

      // Sepal spine
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(0, length - 5);
      ctx.strokeStyle = 'rgba(78, 153, 64, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  drawPetalLayers(ctx, pal, p) {
    // We draw from outer to inner to build depth,
    // but in blooming roses, back petals are behind, center is middle, foreground petals curl forward.
    // We can order the rendering naturally:
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

    // Angle step
    const angleStep = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
      const baseAngle = i * angleStep + layer.angleOffset;
      // Slight natural variation per petal
      const petalJitter = Math.sin(i * 3.7 + layerIdx) * 0.08;
      const angle = baseAngle + petalJitter;

      ctx.save();
      ctx.rotate(angle);

      // Petal tilt/unfurl distance from center
      const dist = radius * (0.3 + eased * 0.7);

      // Petal opening curl (flares outwards as it blooms)
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

    // Individual petal rotation and curvature
    const w2 = width / 2;
    const h = height;

    // Outer lip curl control
    const lipCurl = flare * 35;
    const ruffle = Math.sin(petalIdx * 2.5 + globalProgress * 2) * 5 * flare;

    // Petal ambient drop shadow for deep velvety dimensionality
    ctx.shadowColor = 'rgba(10, 0, 4, 0.65)';
    ctx.shadowBlur = 12 + layerIdx * 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // 1. Draw Petal Body Path (delicately rounded heart/cup shape)
    ctx.beginPath();
    ctx.moveTo(0, 0); // Petal base anchored towards center

    // Left outer contour
    ctx.bezierCurveTo(
      -w2 * 0.9, -h * 0.25,
      -w2 * 1.15, -h * 0.75,
      -w2 * 0.45 + ruffle, -h - lipCurl
    );

    // Top ruffled edge
    ctx.bezierCurveTo(
      -w2 * 0.15, -h - lipCurl * 1.15,
      w2 * 0.15, -h - lipCurl * 1.15,
      w2 * 0.45 - ruffle, -h - lipCurl
    );

    // Right outer contour
    ctx.bezierCurveTo(
      w2 * 1.15, -h * 0.75,
      w2 * 0.9, -h * 0.25,
      0, 0
    );

    ctx.closePath();

    // 2. Realistic Petal Gradient (Subsurface Scattering & Velvet Sheen)
    const petalGrad = ctx.createRadialGradient(
      0, -h * 0.2, 5,
      0, -h * 0.7, h * 0.85
    );

    // Color distribution varies from core to outer layers
    if (layerIdx >= 3) {
      // Core petals are deeper, more mysterious and concentrated
      petalGrad.addColorStop(0, pal.petalDeep);
      petalGrad.addColorStop(0.35, pal.petalBase);
      petalGrad.addColorStop(0.7, pal.petalMid);
      petalGrad.addColorStop(1, pal.petalHighlight);
    } else {
      // Outer petals have luminous highlights and translucent rim glow
      petalGrad.addColorStop(0, pal.petalDeep);
      petalGrad.addColorStop(0.3, pal.petalBase);
      petalGrad.addColorStop(0.65, pal.petalMid);
      petalGrad.addColorStop(0.88, pal.petalHighlight);
      petalGrad.addColorStop(1, pal.petalRim);
    }

    ctx.fillStyle = petalGrad;
    ctx.fill();

    // Disable shadow for internal petal textures
    ctx.shadowColor = 'transparent';

    // 3. Delicate petal vein highlights (fine velvety micro-textures)
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
    ctx.strokeStyle = 'rgba(255, 180, 195, 0.18)';
    ctx.lineWidth = 0.9;

    // 5 radiating micro-veins
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
    // Glowing curled lip on top of petal
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
    const count = 38;
    const maxRadius = 26 * stamenProgress;

    ctx.fillStyle = pal.stamens;
    ctx.strokeStyle = '#8a5d00';
    ctx.lineWidth = 1.0;

    for (let i = 0; i < count; i++) {
      // Golden spiral distribution
      const r = Math.sqrt((i + 1) / count) * maxRadius;
      const theta = i * 2.39996; // Golden angle (137.5 degrees)

      const sx = Math.cos(theta) * r;
      const sy = Math.sin(theta) * r;

      // Filament
      ctx.beginPath();
      ctx.moveTo(sx * 0.2, sy * 0.2);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // Pollen Anther with glowing golden tip
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8 + Math.sin(i) * 0.4, 0, Math.PI * 2);
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

      // Dew drop base shadow
      ctx.beginPath();
      ctx.arc(dx + 1, dy + 1.5, drop.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 0, 5, 0.45)';
      ctx.fill();

      // Clear water droplet body with refraction gradient
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

      // Specular glistening micro-flare
      ctx.beginPath();
      ctx.arc(dx - drop.r * 0.35, dy - drop.r * 0.35, drop.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }
}

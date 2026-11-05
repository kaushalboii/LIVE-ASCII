/**
 * Ambient Botanical ASCII Petal & Stardust Field
 * Fills the desktop flanks with drifting rose petals and luminous stardust.
 * Keeps the center clear for the hand and rose while framing the stage with
 * living romantic atmosphere. Responds gently to cursor/touch breeze.
 */

export class AmbientParticles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.time = 0;
    this.windX = 0;
    this.targetWindX = 0;

    this.glyphs = ['·', '*', '°', '❀', '✦', '✧', '•', '·', '✿'];
    this.colors = [
      'rgba(230, 26, 68, ',   // Crimson
      'rgba(255, 64, 105, ',  // Soft Rose
      'rgba(180, 15, 45, ',   // Deep Ruby
      'rgba(255, 140, 160, ', // Petal Pink
      'rgba(255, 200, 150, '  // Rose Gold
    ];

    this.resize();
    this.initParticles(75);
    this.initEvents();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(randomY = false) {
    // Distribute 80% on the left & right flanks to elegantly fill empty margins
    const isFlank = Math.random() < 0.82;
    let x;
    if (isFlank) {
      if (Math.random() < 0.5) {
        // Left flank (0% to 32% of screen)
        x = Math.random() * (this.width * 0.32);
      } else {
        // Right flank (68% to 100% of screen)
        x = this.width * 0.68 + Math.random() * (this.width * 0.32);
      }
    } else {
      // Occasional gentle center drift
      x = Math.random() * this.width;
    }

    const y = randomY ? Math.random() * this.height : -20;
    const glyph = this.glyphs[Math.floor(Math.random() * this.glyphs.length)];
    const colorBase = this.colors[Math.floor(Math.random() * this.colors.length)];
    const speed = 12 + Math.random() * 26; // pixels per second
    const size = glyph === '❀' || glyph === '✿' ? 14 + Math.random() * 6 : 9 + Math.random() * 7;
    const baseAlpha = 0.18 + Math.random() * 0.42;
    const swayAmp = 12 + Math.random() * 28;
    const swayFreq = 0.6 + Math.random() * 1.4;
    const swayPhase = Math.random() * Math.PI * 2;

    return {
      x,
      baseX: x,
      y,
      glyph,
      colorBase,
      speed,
      size,
      baseAlpha,
      swayAmp,
      swayFreq,
      swayPhase,
      shimmerSpeed: 1.5 + Math.random() * 3
    };
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      // Gentle breeze influenced by cursor velocity
      const centerDist = (e.clientX - this.width / 2) / (this.width / 2);
      this.targetWindX = centerDist * 18;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const centerDist = (touch.clientX - this.width / 2) / (this.width / 2);
        this.targetWindX = centerDist * 18;
      }
    }, { passive: true });
  }

  update(dt = 0.016) {
    this.time += dt;

    // Smooth wind easing
    this.windX += (this.targetWindX - this.windX) * dt * 2.5;
    this.targetWindX *= 0.96; // Ease back to gentle ambient air

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Downward drift + wind
      p.y += p.speed * dt;
      const sway = Math.sin(this.time * p.swayFreq + p.swayPhase) * p.swayAmp;
      p.x = p.baseX + sway + this.windX * (p.speed / 25);

      // Recycle particle when it falls below bottom
      if (p.y > this.height + 25) {
        this.particles[i] = this.createParticle(false);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const shimmer = 0.75 + 0.25 * Math.sin(this.time * p.shimmerSpeed + p.x);
      const alpha = p.baseAlpha * shimmer;

      ctx.save();
      ctx.font = `${p.size}px "JetBrains Mono", monospace`;
      ctx.fillStyle = `${p.colorBase}${alpha})`;

      // Soft blooming glow for rose petals
      if (p.glyph === '❀' || p.glyph === '✿' || p.glyph === '✦') {
        ctx.shadowColor = 'rgba(230, 26, 68, 0.45)';
        ctx.shadowBlur = 8;
      }

      ctx.fillText(p.glyph, p.x, p.y);
      ctx.restore();
    }
  }
}

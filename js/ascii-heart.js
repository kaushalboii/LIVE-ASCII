/**
 * Pure Multilingual Love Heart Engine
 * Derived directly from the user's Python Turtle/Tkinter script.
 * 
 * Features:
 * - Parametric mathematical heart:
 *   x = 16 * sin(a)^3
 *   y = 13*cos(a) - 5*cos(2a) - 2*cos(3a) - cos(4a)
 * - Multilingual phrases of love from all cultures, including Tamil ("நான் உன்னை காதலிக்கிறேன்"),
 *   Hindi, Telugu, Arabic, French, Japanese, Korean, Italian, Spanish, German, Russian, etc.
 * - Exact Python physics: LIFT spawn trajectory, ease-out-cubic motion, FLASH highlights,
 *   wine / crimson / blood red gradient.
 * - Continuous romantic shimmering of words once formed.
 * - Smooth glide-to-corner transition when complete.
 */

export class AsciiHeart {
  constructor(canvas, onComplete = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;

    this.isRunning = false;
    this.isDocked = false;
    this.animId = null;

    this.PHRASES = [
      "I love you", "நான் உன்னை காதலிக்கிறேன்", "Te amo", "Je t'aime",
      "Ich liebe dich", "Ti amo", "Eu te amo", "Я тебя люблю",
      "사랑해", "愛してる", "我爱你", "मैं तुमसे प्यार करता हूँ",
      "நேசிக்கிறேன்", "நேசம்", "Σ' αγαπώ", "Ik hou van jou",
      "Jag älskar dig", "Kocham cię", "ฉันรักเธอ", "Anh yêu em",
      "Aku cinta kamu", "Я тебе кохаю", "أحبك", "Seni seviyorum",
      "నేను నిన్ను ప్రేమిస్తున్నాను", "Mahal kita", "Te iubesc",
      "Miluji tě", "Szeretlek", "Te amo in aeternum"
    ];

    this.wine = [0.58, 0.0, 0.09];
    this.crimson = [0.90, 0.05, 0.14];
    this.blood = [0.98, 0.10, 0.16];
    this.FLASH = [1.0, 0.78, 0.78];
    this.BGC = [0.024, 0.008, 0.031];

    this.ANIM = 42;
    this.LIFT = 34;
    this.GAP = 7;
    this.SIZES = [9, 10, 11, 12];

    this.placed = [];
    this.active = [];
    this.mainIds = [];
    this.spawning = true;
    this.acc = 0;
    this.rate = 1.0;
    this.shimmerTimer = null;
    this.hasTriggeredComplete = false;

    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;

    this.resize();
  }

  mix(a, b, k) {
    return [
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k,
      a[2] + (b[2] - a[2]) * k
    ];
  }

  dim(c, k) {
    return [c[0] * k, c[1] * k, c[2] * k];
  }

  clamp(v, lo = 0.0, hi = 1.0) {
    return Math.max(lo, Math.min(hi, v));
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

    this.W = w;
    this.H = h;
    this.CX = w / 2;
    this.CY = h / 2 - 10;

    // Scale heart to fit comfortably in viewport
    const minDim = Math.min(w, h);
    this.SC = minDim > 600 ? minDim / 38 : minDim / 42;
    this.OY = 20;

    this.buildHeartGeometry();
  }

  heart(a) {
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    return [x * this.SC, y * this.SC + this.OY];
  }

  buildHeartGeometry() {
    this.POLY = [];
    for (let i = 0; i < 360; i++) {
      const a = (2 * Math.PI * i) / 360;
      this.POLY.push(this.heart(a));
    }

    this.EDGES = [];
    for (let i = 0; i < this.POLY.length; i++) {
      this.EDGES.push([this.POLY[i], this.POLY[(i + 1) % this.POLY.length]]);
    }

    this.YMAX = Math.max(...this.POLY.map(p => p[1]));
    this.YMIN = Math.min(...this.POLY.map(p => p[1]));
    this.HCY = (this.YMAX + this.YMIN) / 2;

    this.buildWords();
  }

  spans(y) {
    const xs = [];
    for (const [[x1, y1], [x2, y2]] of this.EDGES) {
      if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
        xs.append = true;
        const x = x1 + (y - y1) * (x2 - x1) / (y2 - y1);
        xs.push(x);
      }
    }
    xs.sort((a, b) => a - b);
    const pairs = [];
    for (let i = 0; i < xs.length; i += 2) {
      if (i + 1 < xs.length) pairs.push([xs[i], xs[i + 1]]);
    }
    return pairs;
  }

  intersect(A, B) {
    const out = [];
    for (const a of A) {
      for (const b of B) {
        const lo = Math.max(a[0], b[0]);
        const hi = Math.min(a[1], b[1]);
        if (hi - lo > 16) {
          out.push([lo, hi]);
        }
      }
    }
    return out;
  }

  mathDist(x, y) {
    return Math.hypot(x / (16 * this.SC), (y - this.HCY) / (14.5 * this.SC));
  }

  buildWords() {
    this.placed = [];
    let pIdx = 0;
    const nextPhrase = () => {
      const p = this.PHRASES[pIdx % this.PHRASES.length];
      pIdx++;
      return p;
    };

    const rowH = 17;
    const half = rowH / 2;
    let y = this.YMAX - half;

    while (y > this.YMIN + half) {
      const row = this.intersect(this.spans(y + half), this.spans(y - half));

      for (const [lo0, hi0] of row) {
        let lo = lo0 + 4;
        let hi = hi0 - 4;
        let cur = lo + Math.random() * 6;
        const line = [];

        while (true) {
          let fit = null;
          for (let attempt = 0; attempt < 8; attempt++) {
            const text = nextPhrase();
            const size = this.SIZES[Math.floor(Math.random() * this.SIZES.length)];
            this.ctx.font = `bold ${size}px "Inter", "Arial", sans-serif`;
            const w = this.ctx.measureText(text).width;
            if (cur + w <= hi) {
              fit = [text, size, w];
              break;
            }
          }
          if (!fit) break;
          const [text, size, w] = fit;
          line.push([cur + w / 2, text, size, w]);
          cur += w + this.GAP;
        }

        if (line.length === 0) continue;

        if (line.length > 1) {
          const left = hi - (line[line.length - 1][0] + line[line.length - 1][3] / 2);
          for (let i = 0; i < line.length; i++) {
            line[i][0] += left * i / (line.length - 1);
          }
        } else {
          line[0][0] = (lo + hi) / 2;
        }

        for (let i = 0; i < line.length; i++) {
          const [x, text, size, w] = line[i];
          const edge = (i === 0 || i === line.length - 1);
          this.placed.push({ x, y, text, size, w, edge });
        }
      }
      y -= rowH;
    }

    // Color gradient
    for (const p of this.placed) {
      const rad = Math.min(1.0, this.mathDist(p.x, p.y));
      let base = this.mix(this.wine, this.crimson, 0.25 + 0.75 * rad);
      base = this.mix(base, this.blood, Math.random() * 0.35 + (p.edge ? 0.3 : 0));
      p.color = base.map(v => Math.min(1, Math.max(0, v)));
      p.rad = rad;
      p.f = 0;
      p.dx = (Math.random() - 0.5) * 16;
      p.isSettled = false;
    }

    const edges = this.placed.filter(p => p.edge);
    const inner = this.placed.filter(p => !p.edge);

    edges.sort((a, b) => {
      const angA = (Math.atan2(a.x, a.y - this.HCY) + Math.PI * 2) % (Math.PI * 2);
      const angB = (Math.atan2(b.x, b.y - this.HCY) + Math.PI * 2) % (Math.PI * 2);
      return angA - angB;
    });

    inner.sort((a, b) => (-a.rad + Math.random() * 0.08) - (-b.rad + Math.random() * 0.08));

    this.ORDER = [...edges, ...inner];
    this.itemsQueue = [...this.ORDER];
    this.rate = this.ORDER.length / (4.2 * 60); // 4.2 seconds spawn time
  }

  spawn(p) {
    p.f = 0;
    p.currentColor = [...p.color];
    this.active.push(p);
  }

  moveToCorner() {
    if (this.isDocked) return;
    this.isDocked = true;
    this.canvas.classList.add("docked-corner");
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Spawn items
    if (this.spawning) {
      this.acc += this.rate;
      while (this.acc >= 1 && this.itemsQueue.length > 0) {
        this.acc -= 1;
        this.spawn(this.itemsQueue.shift());
      }
      if (this.itemsQueue.length === 0) {
        this.spawning = false;
      }
    }

    const cx = this.CX;
    const cy = this.CY;

    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // Draw and animate active words
    for (const p of this.active) {
      if (!p.isSettled) {
        p.f++;
        const u = this.clamp(p.f / this.ANIM);
        const e = 1 - Math.pow(1 - u, 3);
        const hover = (1 - e) * this.LIFT;

        p.renderX = cx + p.x + p.dx * (1 - e);
        p.renderY = cy - p.y - hover;

        const flash = 0.75 * Math.sin(Math.PI * this.clamp((u - 0.55) / 0.45));
        let col = this.mix(this.mix(this.BGC, p.color, Math.pow(e, 1.5)), this.FLASH, flash);
        p.currentColor = col;

        if (u >= 1) {
          p.isSettled = true;
          p.renderX = cx + p.x;
          p.renderY = cy - p.y;
          p.currentColor = p.color;
        }
      }

      const col = p.currentColor || p.color;
      const cr = Math.floor(col[0] * 255);
      const cg = Math.floor(col[1] * 255);
      const cb = Math.floor(col[2] * 255);

      this.ctx.font = `bold ${p.size}px "Inter", "Arial", sans-serif`;

      // Soft glow
      this.ctx.shadowColor = `rgba(${cr},${cg},${cb},0.65)`;
      this.ctx.shadowBlur = 8;

      this.ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
      this.ctx.fillText(p.text, p.renderX, p.renderY);
    }
    this.ctx.shadowBlur = 0;

    // Check completion
    if (!this.spawning && this.active.every(p => p.isSettled) && !this.hasTriggeredComplete) {
      this.hasTriggeredComplete = true;

      // Start romantic shimmering
      this.shimmerInterval = setInterval(() => {
        if (!this.isRunning) return;
        const p = this.active[Math.floor(Math.random() * this.active.length)];
        if (p) {
          p.currentColor = this.mix(p.color, this.FLASH, 0.7);
          setTimeout(() => {
            p.currentColor = p.color;
          }, 320);
        }
      }, 160);

      // After 1.8s of shimmering, glide to top-left corner and trigger Rose bloom!
      setTimeout(() => {
        this.moveToCorner();
        if (this.onComplete) {
          this.onComplete();
        }
      }, 1800);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.hasTriggeredComplete = false;
    this.isDocked = false;
    this.canvas.classList.remove("docked-corner");

    const tick = () => {
      if (!this.isRunning) return;
      this.render();
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
    if (this.shimmerInterval) {
      clearInterval(this.shimmerInterval);
      this.shimmerInterval = null;
    }
  }

  reset() {
    this.stop();
    this.isDocked = false;
    this.canvas.classList.remove("docked-corner");
    this.active = [];
    this.spawning = true;
    this.acc = 0;
    this.hasTriggeredComplete = false;
    this.itemsQueue = [...this.ORDER];
    for (const p of this.placed) {
      p.f = 0;
      p.isSettled = false;
      p.currentColor = [...p.color];
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

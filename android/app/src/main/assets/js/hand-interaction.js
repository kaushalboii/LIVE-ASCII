/**
 * Hand Clicking Interaction & Transition Controller
 * Coordinates the "Realistic Rose First -> Hand Click -> Colored ASCII" transformation.
 * Features:
 * - Animated tactile hand cursor & prompt
 * - Radial shockwave / ripple dissolve on click
 * - Mode toggle: Click-to-Transform, Interactive Split Slider, and ASCII Lens
 */

export class HandInteractionController {
  constructor(options = {}) {
    this.container = options.container; // Main hero container
    this.realCanvas = options.realCanvas; // Canvas rendering photoreal rose
    this.asciiCanvas = options.asciiCanvas; // Canvas rendering colored ASCII rose
    this.outputCanvas = options.outputCanvas; // Target composition canvas
    this.onModeChange = options.onModeChange || (() => {});
    this.onAudioTrigger = options.onAudioTrigger || (() => {});

    // State
    // Modes: 'click' (toggle photoreal / ascii), 'split' (side-by-side slider), 'lens' (x-ray circle)
    this.interactionMode = 'click';
    this.isAsciiRevealed = false; // Starts false: "rose one need to be first before the ascii values"
    this.transitionProgress = 0.0; // 0.0 = photoreal, 1.0 = full ascii
    this.targetTransition = 0.0;

    // Interactive split slider (0.0 to 1.0)
    this.splitPos = 0.5;
    this.isDraggingSlider = false;

    // Lens cursor position
    this.lensX = 400;
    this.lensY = 400;
    this.lensRadius = 150;
    this.isHovering = false;

    // Click ripples & romantic heart bursts
    this.ripples = [];
    this.hearts = [];

    // Hand indicator state
    this.handVisible = true;
    this.handX = 0;
    this.handY = 0;

    this.initEvents();
  }

  initEvents() {
    if (!this.outputCanvas) return;

    // Click / Tap on output canvas
    this.outputCanvas.addEventListener('click', (e) => this.handleClick(e));
    this.outputCanvas.addEventListener('mousedown', (e) => {
      if (this.interactionMode === 'split') {
        this.isDraggingSlider = true;
        this.handleMouseMove(e);
      }
    });
    window.addEventListener('mouseup', () => {
      this.isDraggingSlider = false;
    });

    this.outputCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.outputCanvas.addEventListener('mouseenter', () => { this.isHovering = true; });
    this.outputCanvas.addEventListener('mouseleave', () => {
      this.isHovering = false;
    });

    // Touch support for mobile devices
    this.outputCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        if (this.interactionMode === 'split') {
          this.isDraggingSlider = true;
        }
        this.handleClick(touch);
      }
    }, { passive: true });

    this.outputCanvas.addEventListener('touchend', () => {
      this.isDraggingSlider = false;
    });

    this.outputCanvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.handleMouseMove(touch);
      }
    }, { passive: true });
  }

  setInteractionMode(mode) {
    this.interactionMode = mode;
    if (mode === 'click') {
      // Return to either state smoothly
      this.targetTransition = this.isAsciiRevealed ? 1.0 : 0.0;
    }
    this.onModeChange(mode);
  }

  toggleAscii() {
    this.isAsciiRevealed = !this.isAsciiRevealed;
    this.targetTransition = this.isAsciiRevealed ? 1.0 : 0.0;

    // Trigger audio feedback
    this.onAudioTrigger(this.isAsciiRevealed ? 'bloom' : 'click');

    // Hide hand guide once user understands the interaction
    const handPrompt = document.getElementById('hand-guide');
    if (handPrompt) {
      handPrompt.classList.add('fade-out');
    }
  }

  handleClick(e) {
    const rect = this.outputCanvas.getBoundingClientRect();
    const scaleX = this.outputCanvas.width / rect.width;
    const scaleY = this.outputCanvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (this.interactionMode === 'click') {
      // Spawn tactile shockwave ripple
      this.createRipple(clickX, clickY);
      this.toggleAscii();
    } else if (this.interactionMode === 'split') {
      // Snap split position to click
      this.splitPos = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
      this.createRipple(clickX, clickY);
    }
  }

  handleMouseMove(e) {
    const rect = this.outputCanvas.getBoundingClientRect();
    const scaleX = this.outputCanvas.width / rect.width;
    const scaleY = this.outputCanvas.height / rect.height;

    this.lensX = (e.clientX - rect.left) * scaleX;
    this.lensY = (e.clientY - rect.top) * scaleY;

    if (this.isDraggingSlider && this.interactionMode === 'split') {
      this.splitPos = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
    }
  }

  createRipple(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 10,
      maxRadius: Math.max(this.outputCanvas.width, this.outputCanvas.height) * 1.2,
      alpha: 1.0,
      speed: 16
    });

    // Romantic floating hearts and sparkle particles
    const glyphs = ['💖', '✨', '🌹', '❤️', '💫'];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 5;
      this.hearts.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5, // float upward
        size: 14 + Math.random() * 16,
        alpha: 1.0,
        rotation: (Math.random() - 0.5) * 0.4,
        rotSpeed: (Math.random() - 0.5) * 0.1,
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8
      });
    }
  }

  update(dt = 0.016) {
    // Smooth transition interpolation
    const ease = 0.12;
    this.transitionProgress += (this.targetTransition - this.transitionProgress) * ease;

    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += rip.speed;
      rip.alpha = 1.0 - (rip.radius / rip.maxRadius);

      if (rip.alpha <= 0) {
        this.ripples.splice(i, 1);
      }
    }

    // Update floating romantic hearts
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.x += h.vx;
      h.y += h.vy;
      h.vy -= 0.08; // upward buoyancy
      h.vx *= 0.98;
      h.rotation += h.rotSpeed;
      h.life += dt;
      h.alpha = Math.max(0, 1 - (h.life / h.maxLife));

      if (h.life >= h.maxLife) {
        this.hearts.splice(i, 1);
      }
    }
  }

  /**
   * Composite both Real Rose and ASCII Rose canvases based on current interaction mode
   */
  composite(realCanvas, asciiCanvas) {
    const ctx = this.outputCanvas.getContext('2d');
    const w = this.outputCanvas.width;
    const h = this.outputCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.interactionMode === 'click') {
      // Direct transition with smooth crossfade & optional ripple reveal
      if (this.transitionProgress <= 0.001) {
        // Pure Photoreal Rose (initial state: rose is first before ASCII)
        ctx.drawImage(realCanvas, 0, 0, w, h);
      } else if (this.transitionProgress >= 0.999) {
        // Pure Colored ASCII Rose
        ctx.drawImage(asciiCanvas, 0, 0, w, h);
      } else {
        // Smooth dissolve
        ctx.drawImage(realCanvas, 0, 0, w, h);
        ctx.save();
        ctx.globalAlpha = this.transitionProgress;
        ctx.drawImage(asciiCanvas, 0, 0, w, h);
        ctx.restore();
      }
    } else if (this.interactionMode === 'split') {
      // Split Screen: Left is Photoreal, Right is Colored ASCII
      const splitX = w * this.splitPos;

      // Draw real canvas on the left
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, h);
      ctx.clip();
      ctx.drawImage(realCanvas, 0, 0, w, h);
      ctx.restore();

      // Draw ASCII canvas on the right
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, w - splitX, h);
      ctx.clip();
      ctx.drawImage(asciiCanvas, 0, 0, w, h);
      ctx.restore();

      // Draw vertical separator divider
      ctx.save();
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();

      // Draw central drag handle badge
      const handleY = h / 2;
      ctx.fillStyle = '#160d1b';
      ctx.strokeStyle = '#ff4d79';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(splitX, handleY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Arrows or hand icon in handle
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⇄', splitX, handleY);
      ctx.restore();
    } else if (this.interactionMode === 'lens') {
      // Real rose is base, cursor lens reveals the ASCII matrix inside!
      ctx.drawImage(realCanvas, 0, 0, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.arc(this.lensX, this.lensY, this.lensRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(asciiCanvas, 0, 0, w, h);
      ctx.restore();

      // Glowing lens boundary ring
      ctx.save();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(this.lensX, this.lensY, this.lensRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render ripples
    if (this.ripples.length > 0) {
      for (let rip of this.ripples) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 77, 121, ${rip.alpha * 0.8})`;
        ctx.lineWidth = 4 * rip.alpha;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Render floating romantic love hearts
    if (this.hearts.length > 0) {
      for (let h of this.hearts) {
        ctx.save();
        ctx.globalAlpha = h.alpha;
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rotation);
        ctx.font = `${h.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff2a55';
        ctx.shadowBlur = 12;
        ctx.fillText(h.glyph, 0, 0);
        ctx.restore();
      }
    }
  }
}

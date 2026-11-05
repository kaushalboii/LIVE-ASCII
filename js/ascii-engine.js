/**
 * High-Performance Colored ASCII Art Engine
 * Converts canvas frames, images, and video into true-color ASCII art at 60 FPS.
 * Supports aspect ratio correction, perceptual luminance mapping, multiple character sets,
 * customizable color palettes, and multiple export formats.
 */

export class AsciiEngine {
  constructor(options = {}) {
    this.charSets = {
      standard: ' .:-=+*#%@',
      dense: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
      botanical: ' .·:;+*❀✿⚘✾✦★#@',
      blocks: ' ░▒▓█',
      binary: ' 01',
      minimal: ' .:*#@'
    };

    this.charSetName = options.charSet || 'standard';
    this.chars = this.charSets[this.charSetName];

    // Grid resolution (columns of characters)
    this.columns = options.columns || 110;
    this.fontSize = options.fontSize || 10;
    this.fontFamily = options.fontFamily || '"JetBrains Mono", "Cascadia Code", "Fira Code", monospace';
    this.fontAspectRatio = 0.55; // Monospace width / height ratio

    // Visual controls
    this.colorMode = options.colorMode || 'truecolor'; // 'truecolor', 'crimsonglow', 'matrix', 'amber', 'cyberpunk', 'mono'
    this.contrast = options.contrast !== undefined ? options.contrast : 1.15;
    this.brightness = options.brightness !== undefined ? options.brightness : 1.05;
    this.gamma = options.gamma || 1.1;
    this.invert = !!options.invert;
    this.glow = options.glow !== undefined ? options.glow : true;

    // Offscreen sampling canvas
    this.sampleCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    this.sampleCtx = this.sampleCanvas ? this.sampleCanvas.getContext('2d', { willReadFrequently: true }) : null;
  }

  setResolution(columns) {
    this.columns = Math.max(30, Math.min(240, columns));
  }

  setCharSet(name) {
    if (this.charSets[name]) {
      this.charSetName = name;
      this.chars = this.charSets[name];
    }
  }

  setColorMode(mode) {
    this.colorMode = mode;
  }

  /**
   * Samples the source canvas/image/video and returns an ASCII frame data object
   */
  processFrame(sourceCanvas) {
    const srcW = sourceCanvas.width;
    const srcH = sourceCanvas.height;

    const cols = this.columns;
    // Account for character height/width ratio so image maintains proper proportion
    const charAspect = this.fontAspectRatio; // ~0.55
    const rows = Math.floor(cols * (srcH / srcW) * charAspect);

    // Resize sample canvas
    if (this.sampleCanvas.width !== cols || this.sampleCanvas.height !== rows) {
      this.sampleCanvas.width = cols;
      this.sampleCanvas.height = rows;
    }

    // Draw source into sample canvas
    this.sampleCtx.drawImage(sourceCanvas, 0, 0, cols, rows);
    const imgData = this.sampleCtx.getImageData(0, 0, cols, rows);
    const data = imgData.data;

    const charCount = this.chars.length;
    const maxIdx = charCount - 1;

    const frameGrid = [];

    for (let y = 0; y < rows; y++) {
      const row = [];
      const rowOffset = y * cols * 4;

      for (let x = 0; x < cols; x++) {
        const offset = rowOffset + x * 4;
        let r = data[offset];
        let g = data[offset + 1];
        let b = data[offset + 2];
        const a = data[offset + 3] / 255;

        // Apply brightness & contrast
        if (this.contrast !== 1.0) {
          r = Math.min(255, Math.max(0, (r - 128) * this.contrast + 128));
          g = Math.min(255, Math.max(0, (g - 128) * this.contrast + 128));
          b = Math.min(255, Math.max(0, (b - 128) * this.contrast + 128));
        }

        if (this.brightness !== 1.0) {
          r = Math.min(255, Math.max(0, r * this.brightness));
          g = Math.min(255, Math.max(0, g * this.brightness));
          b = Math.min(255, Math.max(0, b * this.brightness));
        }

        // Color-aware luminance for rich, glowing colored ASCII art on pitch black
        const maxC = Math.max(r, g, b);
        let lum = (0.55 * (maxC / 255) + 0.45 * (0.299 * r + 0.587 * g + 0.114 * b) / 255);

        if (this.gamma !== 1.0) {
          lum = Math.pow(lum, 1 / this.gamma);
        }

        if (this.invert) {
          lum = 1.0 - lum;
        }

        lum = Math.max(0, Math.min(1, lum));

        const charIndex = Math.floor(lum * maxIdx);
        const char = this.chars[charIndex];

        // Format color based on selected color mode
        const color = this.computeColor(r, g, b, lum, a);

        row.push({
          char,
          r,
          g,
          b,
          lum,
          color,
          alpha: a
        });
      }
      frameGrid.push(row);
    }

    return {
      grid: frameGrid,
      cols,
      rows,
      srcW,
      srcH
    };
  }

  computeColor(r, g, b, lum, a) {
    if (a < 0.1) return 'rgba(0,0,0,0)';

    switch (this.colorMode) {
      case 'crimsonglow': {
        // Boost rich reds and ruby highlights specifically for roses
        const boostedR = Math.min(255, Math.floor(r * 1.25 + 14));
        const boostedG = Math.floor(g * 0.95);
        const boostedB = Math.floor(b * 0.95 + 8);
        return `rgb(${boostedR}, ${boostedG}, ${boostedB})`;
      }

      case 'matrix': {
        // Cyberpunk Matrix green phosphor
        const green = Math.floor(lum * 255);
        const whiteCore = Math.floor(Math.pow(lum, 3) * 255);
        return `rgb(${whiteCore}, ${green}, ${Math.floor(whiteCore * 0.7)})`;
      }

      case 'amber': {
        // Retro amber CRT phosphor
        const amberR = Math.floor(lum * 255);
        const amberG = Math.floor(lum * 175);
        const amberB = Math.floor(lum * 35);
        return `rgb(${amberR}, ${amberG}, ${amberB})`;
      }

      case 'cyberpunk': {
        // Neon magenta & cyan gradient based on luminance & color
        if (r > g && r > b) {
          // Warm pixels become neon hot magenta
          return `rgb(255, ${Math.floor(lum * 60)}, 160)`;
        } else {
          // Cool/green pixels become vibrant cyan
          return `rgb(0, ${Math.floor(lum * 255)}, 255)`;
        }
      }

      case 'mono': {
        // High contrast pure grayscale
        const v = Math.floor(lum * 255);
        return `rgb(${v}, ${v}, ${v})`;
      }

      case 'truecolor':
      default: {
        // True 24-bit RGB of the source rose
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
      }
    }
  }

  /**
   * Fast Blit: Renders the ASCII frame directly to target HTML5 canvas
   */
  renderToCanvas(targetCanvas, frameData) {
    const ctx = targetCanvas.getContext('2d');
    const { grid, cols, rows } = frameData;

    const w = targetCanvas.width;
    const h = targetCanvas.height;

    // Calculate cell dimensions
    const cellW = w / cols;
    const cellH = h / rows;

    // 100% transparent background — borderless, seamless floating ASCII art
    ctx.clearRect(0, 0, w, h);

    ctx.font = `${cellH * 0.95}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Optional subtle blooming glow
    if (this.glow) {
      ctx.shadowBlur = 6;
    } else {
      ctx.shadowBlur = 0;
    }

    const halfCellW = cellW * 0.5;
    const halfCellH = cellH * 0.5;

    for (let y = 0; y < rows; y++) {
      const row = grid[y];
      const posY = y * cellH + halfCellH;

      for (let x = 0; x < cols; x++) {
        const cell = row[x];
        if (cell.lum < 0.025) continue; // Skip truly empty background for contrast

        const posX = x * cellW + halfCellW;

        if (this.glow) {
          ctx.shadowColor = cell.color;
        }

        ctx.fillStyle = cell.color;
        ctx.fillText(cell.char, posX, posY);
      }
    }
  }

  /**
   * Converts the frame to plain text
   */
  toPlainText(frameData) {
    return frameData.grid
      .map(row => row.map(cell => cell.char).join(''))
      .join('\n');
  }

  /**
   * Converts the frame to rich HTML with colored spans
   */
  toColoredHTML(frameData) {
    let html = `<pre style="font-family: monospace; line-height: 0.65; background: #050308; padding: 16px; border-radius: 8px; overflow-x: auto;">\n`;
    for (let row of frameData.grid) {
      for (let cell of row) {
        if (cell.lum < 0.05) {
          html += ' ';
        } else {
          html += `<span style="color: ${cell.color};">${cell.char}</span>`;
        }
      }
      html += '\n';
    }
    html += '</pre>';
    return html;
  }
}

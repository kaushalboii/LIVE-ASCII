# ⚘ LIVE ASCII — Realistic Blooming Rose & Creative ASCII Studio

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-ff2a55?style=for-the-badge&logo=github)](https://kaushalboii.github.io/LIVE-ASCII/)
[![License: MIT](https://img.shields.io/badge/License-MIT-38bdf8?style=for-the-badge)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-2e8540?style=for-the-badge)](#)

> **Experience a photorealistic blooming crimson rose rendered in living true-color ASCII art.**  
> Built with pure vanilla HTML5, Canvas 2D, and ES6 Modules. Features an interactive hand-click transformation, side-by-side comparison slider, X-Ray lens, and a comprehensive ASCII creation studio.

🌐 **Live Demo:** [https://kaushalboii.github.io/LIVE-ASCII/](https://kaushalboii.github.io/LIVE-ASCII/)

---

## ✨ Key Features

### 🌹 1. Photorealistic Blooming Rose Simulation
- **Botanical Petal Modeling**: 25+ individually layered petals arranged in Fibonacci whorls (outer guard petals, mid whorls, and tight spiraling core).
- **Organic Blooming Stages**: Sepals peel back, outer petals gently uncurl with ruffled lips, inner core loosens and reveals golden pollen stamens.
- **Velvet Shading & Subsurface Scattering**: Multi-stop radial gradients replicating deep burgundy shadows (`#260207`), rich crimson body (`#9b0d24`), and luminous ruby rim highlights (`#ff4d73`).
- **Glistening Dew Drops**: Micro-droplets with realistic water refraction and specular lens highlights.
- **Natural Sway & Breathing**: Micro-oscillations simulating a gentle botanical breeze.

### 👆 2. Interactive Hand Click Transformation
- **Rose First Experience**: The user first witnesses the photorealistic blooming rose in all its rich color and fluid motion.
- **Tactile Hand Click**: An animated hand pointer (`👆`) invites the user to touch the rose.
- **Radial Ripple Dissolve**: Clicking spawns an organic shockwave ripple that dissolves the photographic petals into a matrix of living colored ASCII glyphs.
- **Multiple Comparison Modes**:
  - **Hand Click Mode**: Click anywhere to toggle smoothly between Photoreal and Colored ASCII.
  - **Split Comparison Slider**: Interactive vertical divider with drag handle to inspect Photoreal and ASCII side by side.
  - **X-Ray Lens Mode**: Move cursor or finger to reveal an ASCII portal through the blooming petals.

### ⚡ 3. High-Performance True-Color ASCII Engine (60 FPS)
- **True 24-bit RGB Color**: Captures the exact crimson, ruby, and emerald hues of the rose.
- **Monospace Aspect Ratio Compensation**: Adjusts vertical sampling step (~0.55 aspect) so shapes retain accurate proportions without vertical stretching.
- **Perceptual Human Eye Luminance**: Maps brightness using photometric standard $Y = 0.2126R + 0.7152G + 0.0722B$.
- **Multiple Color Palettes**:
  - `True Color RGB` (Exact original rose tones)
  - `Velvet Crimson Glow` (Intensified scarlet radiance)
  - `Cyber Matrix Green` (Terminal phosphor glow)
  - `Retro Amber CRT` (Vintage 80s amber monitor)
  - `Synthwave Neon` (Magenta & Cyan duel tone)
  - `Silver Monochrome` (Clean high-contrast grayscale)
- **Custom Character Glyphs**: Standard density, botanical symbols (`❀✿⚘✾✦★`), half-tone shading blocks (`░▒▓█`), and binary cyber (`0 1`).

### 🎨 4. Complete ASCII Creation Studio
- **🖼️ Image to ASCII**: Drag & drop any photo (PNG, JPG, WebP) or test with built-in presets (Rose, Blue Lotus, Sunflower). Export as high-res PNG or copy plain text.
- **🎥 Video to ASCII**: Upload custom MP4/WebM videos to watch live video playback converted to colored ASCII stream in real-time.
- **📷 Live Camera Mirror**: Turn on your webcam for an instantaneous 60 FPS colored ASCII mirror selfie with snapshot capture.
- **🔤 Text Banner Generator**: Type any custom word to generate multi-line ASCII typography banners using FIGlet fonts (Standard Blocky, Slant Italic).

### 🎵 5. Procedural Web Audio Soundscapes
- Real-time synthesized harmonic chimes and tactile click sounds via Web Audio API.
- Zero audio file downloads: 0 KB network payload, instant responsiveness, toggleable mute button.

---

## 🚀 Launching on GitHub Pages

This project requires **zero build steps** and runs out-of-the-box on GitHub Pages.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Initial launch: Realistic blooming rose and live ASCII studio"
git push origin main
```

### Step 2: Enable GitHub Pages
1. Open your repository on GitHub: [`https://github.com/kaushalboii/LIVE-ASCII`](https://github.com/kaushalboii/LIVE-ASCII)
2. Go to **Settings** &rarr; **Pages** (under the "Code and automation" section).
3. Under **Build and deployment &rarr; Source**:
   - Select **Deploy from a branch**.
   - Under **Branch**, select `main` and `/ (root)`.
   - Click **Save**.
4. Within 1-2 minutes, your website will be live at:  
   👉 **`https://kaushalboii.github.io/LIVE-ASCII/`**

*(Alternatively, an automated GitHub Actions workflow is pre-configured in `.github/workflows/deploy.yml` if you choose "GitHub Actions" as the build source).*

---

## 💻 Local Development

To run locally on your computer:

```bash
# Clone the repository
git clone https://github.com/kaushalboii/LIVE-ASCII.git
cd LIVE-ASCII

# Serve with any lightweight local web server:
# Using Python 3:
python3 -m http.server 8000

# Or using Node.js npx:
npx serve .
```

Open your browser at `http://localhost:8000`.

---

## 📁 Project Architecture

```
LIVE-ASCII/
├── index.html                  # Main landing page & interactive workspace
├── .nojekyll                   # Bypasses Jekyll processing for GitHub Pages
├── README.md                   # Project documentation
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Pages deployment workflow
├── css/
│   └── style.css               # Dark luxury botanical & cyberpunk glassmorphism
├── js/
│   ├── app.js                  # Main application orchestrator & 60 FPS animation loop
│   ├── rose-sim.js             # Photorealistic procedural blooming rose simulation
│   ├── ascii-engine.js         # True-color 24-bit ASCII rendering & sampling engine
│   ├── hand-interaction.js     # Hand click transition, ripple physics, split slider
│   ├── studio.js               # Image, Video, Camera, and Text Banner controller
│   ├── audio-fx.js             # Web Audio procedural chimes & tactile clicks
│   └── figlet-fonts.js         # FIGlet ASCII banner font matrices
└── assets/
    ├── favicon.svg             # Glowing botanical ASCII vector icon
    └── sample-images.js        # High-res preset generators (Rose, Lotus, Sunflower)
```

---

## 📄 License

MIT License &copy; 2026 Kaushal. Free to use, adapt, and share.

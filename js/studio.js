/**
 * ASCII Studio Controller
 * Manages tabs: Image to ASCII, Video to ASCII, Live Camera to ASCII, and Text Banners.
 */

import { generatePreset } from '../assets/sample-images.js';
import { AsciiBannerGenerator } from './figlet-fonts.js';

export class AsciiStudio {
  constructor(asciiEngine, audioManager) {
    this.asciiEngine = asciiEngine;
    this.audioManager = audioManager;

    // Studio Elements
    this.imgCanvas = document.getElementById('studio-img-canvas');
    this.videoCanvas = document.getElementById('studio-video-canvas');
    this.cameraCanvas = document.getElementById('studio-camera-canvas');
    this.bannerOutput = document.getElementById('banner-output');

    // Video & Camera state
    this.videoElement = document.createElement('video');
    this.videoElement.crossOrigin = 'anonymous';
    this.videoElement.loop = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;

    this.cameraStream = null;
    this.isCameraActive = false;
    this.activeTab = 'rose'; // 'rose', 'image', 'video', 'camera', 'text'

    this.currentSourceCanvas = null;
    this.lastFrameData = null;

    this.initTabs();
    this.initImageStudio();
    this.initVideoStudio();
    this.initCameraStudio();
    this.initTextStudio();
  }

  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast show';
    setTimeout(() => {
      toast.className = 'toast';
    }, 2500);
  }

  initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update active tab buttons
    document.querySelectorAll('.nav-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });

    // Update sections
    document.querySelectorAll('.studio-view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${tabId}`);
    });

    // Pause camera or video if leaving their tabs
    if (tabId !== 'camera' && this.isCameraActive) {
      this.stopCamera();
    }
    if (tabId !== 'video' && !this.videoElement.paused) {
      this.videoElement.pause();
    }

    if (tabId === 'image' && !this.currentSourceCanvas) {
      this.loadImagePreset('rose');
    }

    this.audioManager.playClick();
  }

  // --- IMAGE STUDIO ---
  initImageStudio() {
    const dropzone = document.getElementById('img-dropzone');
    const fileInput = document.getElementById('img-file-input');
    const presetBtns = document.querySelectorAll('.preset-btn');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
          this.handleImageFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleImageFile(e.target.files[0]);
        }
      });
    }

    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadImagePreset(btn.dataset.preset);
      });
    });

    // Export buttons
    document.getElementById('btn-copy-img-text')?.addEventListener('click', () => {
      if (this.lastFrameData) {
        navigator.clipboard.writeText(this.asciiEngine.toPlainText(this.lastFrameData));
        this.showToast('Copied Plain Text ASCII to clipboard!');
        this.audioManager.playBloomChime();
      }
    });

    document.getElementById('btn-download-img')?.addEventListener('click', () => {
      if (this.imgCanvas) {
        const link = document.createElement('a');
        link.download = 'live-ascii-art.png';
        link.href = this.imgCanvas.toDataURL('image/png');
        link.click();
        this.showToast('Downloaded High-Res ASCII PNG!');
        this.audioManager.playBloomChime();
      }
    });
  }

  loadImagePreset(presetName) {
    const presetCanvas = generatePreset(presetName, 800, 800);
    this.currentSourceCanvas = presetCanvas;
    this.renderImageToAscii();
  }

  handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 800;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        this.currentSourceCanvas = canvas;
        this.renderImageToAscii();
        this.showToast('Image converted to colored ASCII!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  renderImageToAscii() {
    if (!this.currentSourceCanvas || !this.imgCanvas) return;
    this.lastFrameData = this.asciiEngine.processFrame(this.currentSourceCanvas);
    this.imgCanvas.width = 800;
    this.imgCanvas.height = Math.round(800 * (this.lastFrameData.rows / (this.lastFrameData.cols * this.asciiEngine.fontAspectRatio)));
    this.asciiEngine.renderToCanvas(this.imgCanvas, this.lastFrameData);
  }

  // --- VIDEO STUDIO ---
  initVideoStudio() {
    const videoInput = document.getElementById('video-file-input');
    const playBtn = document.getElementById('btn-video-play');
    const seekbar = document.getElementById('video-seekbar');

    if (videoInput) {
      videoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          this.videoElement.src = url;
          this.videoElement.play();
          if (playBtn) playBtn.textContent = 'Pause';
          this.startVideoAsciiLoop();
          this.showToast('Playing video as colored ASCII!');
        }
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (this.videoElement.paused) {
          this.videoElement.play();
          playBtn.textContent = 'Pause';
          this.startVideoAsciiLoop();
        } else {
          this.videoElement.pause();
          playBtn.textContent = 'Play';
        }
      });
    }

    if (seekbar) {
      this.videoElement.addEventListener('timeupdate', () => {
        if (!isNaN(this.videoElement.duration) && this.videoElement.duration > 0) {
          seekbar.value = (this.videoElement.currentTime / this.videoElement.duration) * 100;
        }
      });

      seekbar.addEventListener('input', () => {
        if (!isNaN(this.videoElement.duration)) {
          this.videoElement.currentTime = (seekbar.value / 100) * this.videoElement.duration;
        }
      });
    }
  }

  startVideoAsciiLoop() {
    if (!this.videoCanvas) return;
    const render = () => {
      if (this.activeTab === 'video' && !this.videoElement.paused && !this.videoElement.ended) {
        if (this.videoElement.videoWidth > 0) {
          if (this.videoCanvas.width !== 800) {
            this.videoCanvas.width = 800;
            this.videoCanvas.height = Math.round(800 * (this.videoElement.videoHeight / this.videoElement.videoWidth));
          }
          const frameData = this.asciiEngine.processFrame(this.videoElement);
          this.asciiEngine.renderToCanvas(this.videoCanvas, frameData);
        }
        requestAnimationFrame(render);
      }
    };
    requestAnimationFrame(render);
  }

  // --- CAMERA STUDIO ---
  initCameraStudio() {
    const toggleBtn = document.getElementById('btn-camera-toggle');
    const snapBtn = document.getElementById('btn-camera-snap');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.isCameraActive) {
          this.stopCamera();
          toggleBtn.textContent = 'Start Camera Mirror';
          toggleBtn.classList.remove('btn-danger');
        } else {
          this.startCamera(toggleBtn);
        }
      });
    }

    if (snapBtn) {
      snapBtn.addEventListener('click', () => {
        if (this.cameraCanvas) {
          const link = document.createElement('a');
          link.download = 'ascii-camera-snapshot.png';
          link.href = this.cameraCanvas.toDataURL('image/png');
          link.click();
          this.showToast('Camera snapshot saved as ASCII PNG!');
          this.audioManager.playBloomChime();
        }
      });
    }
  }

  async startCamera(toggleBtn) {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      const camVideo = document.createElement('video');
      camVideo.srcObject = this.cameraStream;
      camVideo.playsInline = true;
      camVideo.play();
      this.camVideo = camVideo;
      this.isCameraActive = true;

      if (toggleBtn) {
        toggleBtn.textContent = 'Stop Camera';
        toggleBtn.classList.add('btn-danger');
      }

      this.showToast('Camera connected! Streaming colored ASCII.');
      this.startCameraLoop();
    } catch (err) {
      alert('Could not access camera: ' + err.message);
    }
  }

  stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    this.isCameraActive = false;
  }

  startCameraLoop() {
    if (!this.cameraCanvas) return;
    const render = () => {
      if (this.activeTab === 'camera' && this.isCameraActive && this.camVideo) {
        if (this.camVideo.videoWidth > 0) {
          if (this.cameraCanvas.width !== 640) {
            this.cameraCanvas.width = 640;
            this.cameraCanvas.height = Math.round(640 * (this.camVideo.videoHeight / this.camVideo.videoWidth));
          }
          const frameData = this.asciiEngine.processFrame(this.camVideo);
          this.asciiEngine.renderToCanvas(this.cameraCanvas, frameData);
        }
        requestAnimationFrame(render);
      }
    };
    requestAnimationFrame(render);
  }

  // --- TEXT BANNER STUDIO ---
  initTextStudio() {
    const input = document.getElementById('banner-input');
    const fontSelect = document.getElementById('banner-font-select');
    const copyBtn = document.getElementById('btn-copy-banner');

    const updateBanner = () => {
      if (!this.bannerOutput) return;
      const text = input ? input.value : 'ROSE';
      const font = fontSelect ? fontSelect.value : 'standard';
      const asciiBanner = AsciiBannerGenerator.generate(text, font);
      this.bannerOutput.textContent = asciiBanner;
    };

    if (input) input.addEventListener('input', updateBanner);
    if (fontSelect) fontSelect.addEventListener('change', updateBanner);

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (this.bannerOutput) {
          navigator.clipboard.writeText(this.bannerOutput.textContent);
          this.showToast('Copied ASCII Banner to clipboard!');
          this.audioManager.playBloomChime();
        }
      });
    }

    updateBanner();
  }
}

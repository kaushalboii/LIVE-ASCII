/**
 * Built-in Preset Samples for the ASCII Studio
 * Generates beautiful botanical and artistic presets directly on canvas without external assets.
 */

export function generatePreset(type = 'rose', width = 600, height = 600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (type === 'rose') {
    // Velvet Rose Bloom Preset
    const bg = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width*0.7);
    bg.addColorStop(0, '#150810');
    bg.addColorStop(1, '#020004');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2 + 30);

    // Stem
    ctx.fillStyle = '#1b3b16';
    ctx.fillRect(-6, 20, 12, height/2);

    // Petal whorls
    const whorls = [
      { r: 160, count: 6, c1: '#40020a', c2: '#910b24', c3: '#d6183e' },
      { r: 120, count: 7, c1: '#54030e', c2: '#ad0f2e', c3: '#e62249' },
      { r: 85, count: 8, c1: '#6e0514', c2: '#c91638', c3: '#fa345e' },
      { r: 50, count: 6, c1: '#8a091b', c2: '#e31e44', c3: '#ff5479' },
      { r: 25, count: 5, c1: '#40020a', c2: '#a30d29', c3: '#ffccd6' }
    ];

    for (let w of whorls) {
      for (let i = 0; i < w.count; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / w.count + w.r * 0.05);

        const g = ctx.createRadialGradient(0, -w.r * 0.5, 5, 0, -w.r * 0.8, w.r);
        g.addColorStop(0, w.c1);
        g.addColorStop(0.5, w.c2);
        g.addColorStop(1, w.c3);
        ctx.fillStyle = g;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-w.r * 0.6, -w.r * 0.4, -w.r * 0.7, -w.r * 0.9, 0, -w.r);
        ctx.bezierCurveTo(w.r * 0.7, -w.r * 0.9, w.r * 0.6, -w.r * 0.4, 0, 0);
        ctx.fill();

        ctx.restore();
      }
    }

    // Stamens
    ctx.fillStyle = '#ffcc00';
    for (let i = 0; i < 20; i++) {
      const a = i * 2.4;
      const d = Math.sqrt(i) * 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  } else if (type === 'lotus') {
    // Sacred Blue/Pink Lotus Preset
    ctx.fillStyle = '#020b14';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2 + 20);

    const petals = 16;
    for (let i = 0; i < petals; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / petals);

      const g = ctx.createLinearGradient(0, 0, 0, -170);
      g.addColorStop(0, '#100030');
      g.addColorStop(0.5, '#00b4d8');
      g.addColorStop(1, '#90e0ef');
      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-45, -60, -35, -140, 0, -180);
      ctx.bezierCurveTo(35, -140, 45, -60, 0, 0);
      ctx.fill();

      ctx.restore();
    }

    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  } else if (type === 'sunflower') {
    // Golden Sunflower Preset
    ctx.fillStyle = '#0c0702';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    const petals = 28;
    for (let i = 0; i < petals; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / petals);

      const g = ctx.createLinearGradient(0, 0, 0, -180);
      g.addColorStop(0, '#d97706');
      g.addColorStop(0.7, '#fbbf24');
      g.addColorStop(1, '#fef08a');
      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-28, -50, -20, -150, 0, -190);
      ctx.bezierCurveTo(20, -150, 28, -50, 0, 0);
      ctx.fill();

      ctx.restore();
    }

    // Seed florets
    const florets = 150;
    for (let i = 0; i < florets; i++) {
      const a = i * 2.39996;
      const d = Math.sqrt(i) * 5.2;
      ctx.fillStyle = i % 2 === 0 ? '#451a03' : '#78350f';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  return canvas;
}


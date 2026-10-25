import { AudioAnalysis, VisualizerSettings } from '../types/visualizer';
import { hexToRgba } from './canvasUtils';

let globalRotation = 0;

export function renderGeometricFlow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analysis: AudioAnalysis,
  settings: VisualizerSettings,
  time: number
) {
  const { frequencyData, bass, mid, treble, isBeat, beatIntensity } = analysis;
  const { sensitivity, bassIntensity, midIntensity, trebleIntensity, speed, glow, theme } = settings;

  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const baseScale = (minDim * 0.42) * sensitivity;

  globalRotation += 0.004 * speed;

  // Background mandala aura
  ctx.save();
  const aura = ctx.createRadialGradient(cx, cy, 5, cx, cy, baseScale * 1.5);
  aura.addColorStop(0, hexToRgba(theme.primary, 0.35 * (1 + bass * 0.5)));
  aura.addColorStop(0.5, hexToRgba(theme.secondary, 0.15));
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Polygon layers: [Sides, RadiusMultiplier, SpeedMultiplier, FreqBand]
  const layers = [
    { sides: 3, radius: 0.22, speedMult: 1.0, band: 'bass' as const, color: theme.primary },
    { sides: 4, radius: 0.35, speedMult: -0.8, band: 'bass' as const, color: theme.secondary },
    { sides: 6, radius: 0.52, speedMult: 0.65, band: 'mid' as const, color: theme.primary },
    { sides: 8, radius: 0.70, speedMult: -0.5, band: 'mid' as const, color: theme.secondary },
    { sides: 12, radius: 0.88, speedMult: 0.35, band: 'treble' as const, color: theme.accent },
    { sides: 16, radius: 1.05, speedMult: -0.25, band: 'treble' as const, color: theme.accent },
  ];

  ctx.save();
  ctx.translate(cx, cy);

  // Draw concentric morphing polygons
  layers.forEach((layer, idx) => {
    let bandScale = 1;
    let freqIdx = 0;

    if (layer.band === 'bass') {
      bandScale = 1 + bass * 0.9 * bassIntensity;
      freqIdx = 2 + idx * 3;
    } else if (layer.band === 'mid') {
      bandScale = 1 + mid * 0.8 * midIntensity;
      freqIdx = 20 + idx * 10;
    } else {
      bandScale = 1 + treble * 1.1 * trebleIntensity;
      freqIdx = 90 + idx * 25;
    }

    const freqVal = frequencyData[freqIdx % frequencyData.length] / 255;
    const r = baseScale * layer.radius * bandScale * (1 + freqVal * 0.35);
    const rot = globalRotation * layer.speedMult + (isBeat ? idx * 0.1 * beatIntensity : 0);

    ctx.save();
    ctx.rotate(rot);

    ctx.beginPath();
    for (let s = 0; s < layer.sides; s++) {
      const angle = s * (Math.PI * 2 / layer.sides);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;

      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.strokeStyle = hexToRgba(layer.color, 0.85);
    ctx.lineWidth = 2 + (isBeat && layer.band === 'bass' ? 2 : 0);

    if (glow > 0) {
      ctx.shadowColor = layer.color;
      ctx.shadowBlur = (glow / 100) * (12 + (layer.band === 'treble' ? treble * 10 : 0));
    }

    ctx.stroke();

    // Sacred geometric radial vertices & spokes
    for (let s = 0; s < layer.sides; s++) {
      const angle = s * (Math.PI * 2 / layer.sides);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;

      // Draw vertex nodes
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(px, py, 2.5 + (layer.band === 'treble' ? treble * 4 : 0), 0, Math.PI * 2);
      ctx.fill();

      // Faint spokes connecting to center
      if (layer.sides <= 8) {
        ctx.strokeStyle = hexToRgba(layer.color, 0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }

    ctx.restore();
  });

  // Central sacred flower / star
  const coreRadius = 24 * (1 + bass * 0.6 * bassIntensity);
  ctx.save();
  ctx.fillStyle = theme.accent;
  if (glow > 0) {
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = (glow / 100) * 20;
  }
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4 + globalRotation * 2;
    const dist = i % 2 === 0 ? coreRadius : coreRadius * 0.45;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

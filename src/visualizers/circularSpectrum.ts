import { AudioAnalysis, VisualizerSettings } from '../types/visualizer';
import { hexToRgba } from './canvasUtils';

let rotationAngle = 0;

export function renderCircularSpectrum(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analysis: AudioAnalysis,
  settings: VisualizerSettings,
  time: number
) {
  const { frequencyData, bass, mid, treble, isBeat, beatIntensity } = analysis;
  const { sensitivity, bassIntensity, midIntensity, trebleIntensity, speed, glow, theme, mirrorEffect } = settings;

  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const baseRadius = minDim * 0.18 + (bass * 35 * bassIntensity);

  // Rotation increment
  rotationAngle += 0.003 * speed + (isBeat ? 0.015 * (1 + beatIntensity) : 0);

  // Central Pulsing Orb
  ctx.save();
  const coreRadius = baseRadius * 0.75 * (1 + bass * 0.4 * bassIntensity);

  // Core radial aura
  const coreAura = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreRadius * 1.8);
  coreAura.addColorStop(0, hexToRgba(theme.primary, 0.9));
  coreAura.addColorStop(0.4, hexToRgba(theme.secondary, 0.45));
  coreAura.addColorStop(1, 'transparent');

  ctx.fillStyle = coreAura;
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Core solid sphere
  ctx.fillStyle = theme.primary;
  if (glow > 0) {
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = (glow / 100) * (20 + bass * 25);
  }
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
  ctx.fill();

  // Beat shockwave ring
  if (isBeat || bass > 0.6) {
    const shockwaveRadius = baseRadius * (1.3 + beatIntensity * 0.8);
    ctx.strokeStyle = hexToRgba(theme.accent, 0.7);
    ctx.lineWidth = 2 + beatIntensity * 3;
    ctx.beginPath();
    ctx.arc(cx, cy, shockwaveRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Radial bars count
  const count = Math.min(180, Math.max(64, Math.floor(settings.particleCount / 2)));
  const angleStep = (Math.PI * 2) / count;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationAngle);

  for (let i = 0; i < count; i++) {
    // Symmetrical frequency indexing around circle
    const normIndex = mirrorEffect
      ? Math.abs(i - count / 2) / (count / 2)
      : i / count;

    const freqIndex = Math.floor(normIndex * (frequencyData.length * 0.65));
    const rawVal = frequencyData[freqIndex] / 255;

    let bandMultiplier = 1;
    if (normIndex < 0.25) {
      bandMultiplier = 1 + bass * 0.9 * bassIntensity;
    } else if (normIndex < 0.7) {
      bandMultiplier = 1 + mid * 0.7 * midIntensity;
    } else {
      bandMultiplier = 1 + treble * 1.1 * trebleIntensity;
    }

    const barLength = Math.max(6, rawVal * (minDim * 0.32) * sensitivity * bandMultiplier);
    const angle = i * angleStep;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const x1 = cos * baseRadius;
    const y1 = sin * baseRadius;
    const x2 = cos * (baseRadius + barLength);
    const y2 = sin * (baseRadius + barLength);

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, theme.secondary);
    grad.addColorStop(0.6, theme.primary);
    grad.addColorStop(1, theme.accent);

    ctx.strokeStyle = grad;
    ctx.lineWidth = Math.max(2, (Math.PI * 2 * baseRadius / count) * 0.75);
    ctx.lineCap = 'round';

    if (glow > 0) {
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = (glow / 100) * 10;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Treble star sparks on tips
    if (treble > 0.4 && normIndex > 0.65 && i % 3 === 0) {
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(x2, y2, 2 + treble * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

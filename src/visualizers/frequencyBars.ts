import { AudioAnalysis, VisualizerSettings } from '../types/visualizer';
import { hexToRgba } from './canvasUtils';

interface PeakData {
  value: number;
  velocity: number;
}

const peaks: PeakData[] = [];

export function renderFrequencyBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analysis: AudioAnalysis,
  settings: VisualizerSettings,
  time: number
) {
  const { frequencyData, bass, mid, treble, isBeat, beatIntensity } = analysis;
  const { sensitivity, bassIntensity, midIntensity, trebleIntensity, glow, theme, mirrorEffect } = settings;

  const barCount = Math.min(128, Math.max(32, Math.floor(width / 14)));
  const barWidth = (width / barCount) * 0.75;
  const gap = (width / barCount) * 0.25;

  while (peaks.length < barCount) {
    peaks.push({ value: 0, velocity: 0 });
  }

  const baselineY = mirrorEffect ? height * 0.58 : height * 0.88;
  const maxHeight = (mirrorEffect ? height * 0.45 : height * 0.75) * sensitivity;

  // Background subtle glow pulse on beat
  if (isBeat && glow > 20) {
    const pulseRadius = Math.max(width, height) * 0.45;
    const radGrad = ctx.createRadialGradient(width / 2, baselineY, 10, width / 2, baselineY, pulseRadius);
    radGrad.addColorStop(0, hexToRgba(theme.primary, (glow / 100) * 0.25 * (1 + beatIntensity)));
    radGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw each spectrum bar
  for (let i = 0; i < barCount; i++) {
    // Non-linear frequency sampling (more resolution in bass and mids)
    const freqIdx = Math.floor(Math.pow(i / barCount, 1.4) * (frequencyData.length * 0.75));
    const rawVal = frequencyData[freqIdx] / 255;

    // Apply frequency band scaling
    let bandScale = 1;
    if (i < barCount * 0.2) {
      bandScale = 1 + (bass * 0.8 * bassIntensity);
    } else if (i < barCount * 0.6) {
      bandScale = 1 + (mid * 0.6 * midIntensity);
    } else {
      bandScale = 1 + (treble * 0.9 * trebleIntensity);
    }

    const barHeight = Math.max(4, rawVal * maxHeight * bandScale);
    const x = i * (barWidth + gap) + gap / 2;

    // Peak tracking with gravity
    const peak = peaks[i];
    if (barHeight > peak.value) {
      peak.value = barHeight;
      peak.velocity = 0;
    } else {
      peak.velocity += 0.35;
      peak.value = Math.max(0, peak.value - peak.velocity);
    }

    // Bar Gradient
    const grad = ctx.createLinearGradient(0, baselineY - barHeight, 0, baselineY);
    grad.addColorStop(0, theme.accent);
    grad.addColorStop(0.5, theme.secondary);
    grad.addColorStop(1, theme.primary);

    ctx.save();

    // Glow effect
    if (glow > 0) {
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = (glow / 100) * (12 + (isBeat ? 10 : 0));
    }

    ctx.fillStyle = grad;

    // Rounded top bar
    const radius = Math.min(barWidth / 2, 4);
    ctx.beginPath();
    ctx.roundRect(x, baselineY - barHeight, barWidth, barHeight, [radius, radius, 0, 0]);
    ctx.fill();

    // Peak cap line
    ctx.fillStyle = theme.accent;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 8;
    ctx.fillRect(x, baselineY - peak.value - 3, barWidth, 2.5);

    // Mirror reflection if enabled
    if (mirrorEffect) {
      const reflectHeight = barHeight * 0.42;
      const reflectGrad = ctx.createLinearGradient(0, baselineY, 0, baselineY + reflectHeight);
      reflectGrad.addColorStop(0, hexToRgba(theme.primary, 0.35));
      reflectGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = reflectGrad;
      ctx.beginPath();
      ctx.roundRect(x, baselineY + 2, barWidth, reflectHeight, [0, 0, radius, radius]);
      ctx.fill();
    }

    ctx.restore();
  }

  // Baseline neon line
  ctx.save();
  ctx.strokeStyle = hexToRgba(theme.secondary, 0.6);
  ctx.lineWidth = 1.5;
  ctx.shadowColor = theme.primary;
  ctx.shadowBlur = glow > 0 ? 10 : 0;
  ctx.beginPath();
  ctx.moveTo(0, baselineY);
  ctx.lineTo(width, baselineY);
  ctx.stroke();
  ctx.restore();
}

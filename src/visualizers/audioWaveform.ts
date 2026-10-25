import { AudioAnalysis, VisualizerSettings } from '../types/visualizer';
import { hexToRgba } from './canvasUtils';

export function renderAudioWaveform(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analysis: AudioAnalysis,
  settings: VisualizerSettings,
  time: number
) {
  const { timeDomainData, bass, mid, treble, isBeat, beatIntensity } = analysis;
  const { sensitivity, bassIntensity, trebleIntensity, glow, theme, mirrorEffect } = settings;

  const centerY = height * 0.5;
  const bufferLength = timeDomainData.length;
  const sliceWidth = width / (bufferLength - 1);

  // Background subtle wave ambience
  if (glow > 15) {
    const ambientGrad = ctx.createRadialGradient(width / 2, centerY, 5, width / 2, centerY, width * 0.5);
    ambientGrad.addColorStop(0, hexToRgba(theme.primary, (glow / 100) * 0.2 * (1 + bass * 0.5)));
    ambientGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw 3 layers:
  // Layer 1: Ambient Ribbon / Fill
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, centerY);

  for (let i = 0; i < bufferLength; i += 2) {
    const v = (timeDomainData[i] - 128) / 128; // -1 to 1
    const amp = v * (height * 0.38) * sensitivity * (1 + bass * 0.6 * bassIntensity);
    const x = i * sliceWidth;
    const y = centerY + amp;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.lineTo(width, centerY);
  ctx.closePath();

  const fillGrad = ctx.createLinearGradient(0, centerY - 150, 0, centerY + 150);
  fillGrad.addColorStop(0, hexToRgba(theme.primary, 0.25));
  fillGrad.addColorStop(0.5, hexToRgba(theme.secondary, 0.12));
  fillGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = fillGrad;
  ctx.fill();
  ctx.restore();

  // Layer 2: Harmonic Echo Wave (Phase shifted)
  ctx.save();
  ctx.beginPath();
  const phase = time * 0.003;
  ctx.strokeStyle = hexToRgba(theme.secondary, 0.45);
  ctx.lineWidth = 1.5;

  for (let i = 0; i < bufferLength; i += 3) {
    const v = (timeDomainData[i] - 128) / 128;
    const secondaryAmp = v * (height * 0.28) * sensitivity + Math.sin(i * 0.05 + phase) * (15 * (1 + mid));
    const x = i * sliceWidth;
    const y = centerY + secondaryAmp;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();

  // Layer 3: Primary Glowing Laser Waveform
  ctx.save();
  ctx.beginPath();

  if (glow > 0) {
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = (glow / 100) * (16 + (isBeat ? 12 : 0));
  }

  const waveGrad = ctx.createLinearGradient(0, 0, width, 0);
  waveGrad.addColorStop(0, theme.primary);
  waveGrad.addColorStop(0.5, theme.accent);
  waveGrad.addColorStop(1, theme.secondary);

  ctx.strokeStyle = waveGrad;
  ctx.lineWidth = 3 + (isBeat ? 1.5 : 0) + (bass * 2 * bassIntensity);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const peakPoints: { x: number; y: number }[] = [];

  for (let i = 0; i < bufferLength; i++) {
    const v = (timeDomainData[i] - 128) / 128;
    const amp = v * (height * 0.38) * sensitivity * (1 + bass * 0.7 * bassIntensity);
    const x = i * sliceWidth;
    const y = centerY + amp;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    // Capture peaks for sparkling treble nodes
    if (Math.abs(v) > 0.65 && i % 18 === 0) {
      peakPoints.push({ x, y });
    }
  }
  ctx.stroke();

  // Draw sparkling nodes on treble peaks
  if (treble > 0.3) {
    ctx.fillStyle = theme.accent;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 10;
    peakPoints.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + treble * 4 * trebleIntensity, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Symmetrical mirror wave if enabled
  if (mirrorEffect) {
    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(theme.primary, 0.4);
    ctx.lineWidth = 1.5;

    for (let i = 0; i < bufferLength; i += 2) {
      const v = (timeDomainData[i] - 128) / 128;
      const amp = -v * (height * 0.28) * sensitivity;
      const x = i * sliceWidth;
      const y = centerY + amp;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

import { AudioAnalysis, VisualizerSettings } from '../types/visualizer';
import { hexToRgba } from './canvasUtils';

interface TunnelRing {
  z: number; // 0 to 1000
  rotation: number;
}

const RING_COUNT = 32;
let rings: TunnelRing[] = [];
let initialized = false;
let globalTunnelRotation = 0;

function initRings() {
  rings = [];
  for (let i = 0; i < RING_COUNT; i++) {
    rings.push({
      z: (i / RING_COUNT) * 1000,
      rotation: (i * 0.15),
    });
  }
  initialized = true;
}

export function renderNeonTunnel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analysis: AudioAnalysis,
  settings: VisualizerSettings,
  time: number
) {
  const { frequencyData, bass, mid, treble, isBeat, beatIntensity } = analysis;
  const { sensitivity, bassIntensity, midIntensity, trebleIntensity, speed, glow, theme } = settings;

  if (!initialized) initRings();

  const cx = width / 2;
  const cy = height / 2;
  const fov = 350;

  // Flight speed through the tunnel
  const flightSpeed = (3.5 + bass * 8 * bassIntensity + (isBeat ? 12 : 0)) * speed;
  globalTunnelRotation += (0.005 + mid * 0.015 * midIntensity) * speed;

  // Move rings towards camera
  for (let i = 0; i < rings.length; i++) {
    rings[i].z -= flightSpeed;
    if (rings[i].z <= 10) {
      rings[i].z += 1000;
    }
  }

  // Sort rings back to front
  const sortedRings = [...rings].sort((a, b) => b.z - a.z);

  // Background deep cyber portal
  ctx.save();
  const portalGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(width, height) * 0.5);
  portalGrad.addColorStop(0, hexToRgba(theme.primary, 0.45 * (1 + bass * 0.5)));
  portalGrad.addColorStop(0.3, hexToRgba(theme.secondary, 0.18));
  portalGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = portalGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const sides = 8; // Octagonal tunnel
  const ringPoints: { x: number; y: number }[][] = [];

  // Render rings
  for (let r = 0; r < sortedRings.length; r++) {
    const ring = sortedRings[r];
    const scale = fov / Math.max(10, ring.z);
    const ringRadius = 160 * scale * sensitivity * (1 + bass * 0.35 * bassIntensity);

    const normZ = 1 - (ring.z / 1000); // 0 (far) to 1 (near)
    const ringAlpha = Math.min(1, Math.max(0.05, normZ * 1.3));

    const ringAngle = ring.rotation + globalTunnelRotation;
    const currentPoints: { x: number; y: number }[] = [];

    for (let s = 0; s < sides; s++) {
      const angle = ringAngle + (s * (Math.PI * 2 / sides));
      // Frequency distortion based on side
      const freqSample = frequencyData[(s * 15) % frequencyData.length] / 255;
      const distortion = 1 + freqSample * 0.3 * trebleIntensity;
      const px = cx + Math.cos(angle) * ringRadius * distortion;
      const py = cy + Math.sin(angle) * ringRadius * distortion;
      currentPoints.push({ x: px, y: py });
    }

    ringPoints.push(currentPoints);

    // Draw polygon ring
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
    for (let s = 1; s < sides; s++) {
      ctx.lineTo(currentPoints[s].x, currentPoints[s].y);
    }
    ctx.closePath();

    const isNearest = r > sortedRings.length - 4;
    const ringColor = isNearest ? theme.accent : (r % 2 === 0 ? theme.primary : theme.secondary);

    ctx.strokeStyle = hexToRgba(ringColor, ringAlpha);
    ctx.lineWidth = Math.max(1, 3.5 * scale);

    if (glow > 0 && isNearest) {
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = (glow / 100) * 16;
    }

    ctx.stroke();
    ctx.restore();
  }

  // Draw longitudinal tunnel rails connecting rings
  ctx.save();
  ctx.strokeStyle = hexToRgba(theme.primary, 0.35 + treble * 0.4 * trebleIntensity);
  ctx.lineWidth = 1.2;

  for (let s = 0; s < sides; s++) {
    ctx.beginPath();
    for (let r = 0; r < ringPoints.length; r++) {
      const pt = ringPoints[r][s];
      if (r === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Central cyber vanishing point starburst
  if (isBeat || bass > 0.5) {
    ctx.save();
    ctx.fillStyle = theme.accent;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, 3 + beatIntensity * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

import { AudioAnalysis, VisualizerSettings } from '../types/visualizer';
import { hexToRgba } from './canvasUtils';

interface Orb {
  id: number;
  orbitRadius: number;
  angle: number;
  speed: number;
  inclination: number; // orbital tilt in radians
  size: number;
  freqRange: 'bass' | 'mid' | 'treble';
  freqBin: number;
}

const orbs: Orb[] = [
  { id: 1, orbitRadius: 90, angle: 0, speed: 0.018, inclination: 0.25, size: 14, freqRange: 'bass', freqBin: 4 },
  { id: 2, orbitRadius: 150, angle: 1.2, speed: 0.014, inclination: -0.35, size: 18, freqRange: 'bass', freqBin: 8 },
  { id: 3, orbitRadius: 210, angle: 2.8, speed: 0.011, inclination: 0.45, size: 16, freqRange: 'mid', freqBin: 28 },
  { id: 4, orbitRadius: 270, angle: 4.1, speed: 0.009, inclination: -0.2, size: 20, freqRange: 'mid', freqBin: 55 },
  { id: 5, orbitRadius: 330, angle: 5.2, speed: 0.007, inclination: 0.55, size: 12, freqRange: 'treble', freqBin: 110 },
  { id: 6, orbitRadius: 390, angle: 0.8, speed: 0.006, inclination: -0.4, size: 10, freqRange: 'treble', freqBin: 190 },
  { id: 7, orbitRadius: 440, angle: 3.4, speed: 0.005, inclination: 0.15, size: 9, freqRange: 'treble', freqBin: 240 },
];

export function renderCosmicOrbs(
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
  const scaleFactor = (minDim / 900) * sensitivity;

  // Central Hyper-Star
  const starRadius = (32 + bass * 45 * bassIntensity + (isBeat ? 15 : 0)) * scaleFactor;

  // Corona flare
  ctx.save();
  const coronaGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, starRadius * 3.2);
  coronaGrad.addColorStop(0, hexToRgba(theme.primary, 0.9));
  coronaGrad.addColorStop(0.3, hexToRgba(theme.secondary, 0.4));
  coronaGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, starRadius * 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Solid core star with specular highlight
  const starBodyGrad = ctx.createRadialGradient(
    cx - starRadius * 0.3,
    cy - starRadius * 0.3,
    2,
    cx,
    cy,
    starRadius
  );
  starBodyGrad.addColorStop(0, '#ffffff');
  starBodyGrad.addColorStop(0.4, theme.primary);
  starBodyGrad.addColorStop(1, theme.secondary);

  ctx.fillStyle = starBodyGrad;
  if (glow > 0) {
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = (glow / 100) * (25 + bass * 30);
  }
  ctx.beginPath();
  ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Project orbs in 3D
  interface ProjectedOrb {
    x: number;
    y: number;
    z: number;
    radius: number;
    color: string;
    freqVal: number;
    orb: Orb;
  }

  const projectedOrbs: ProjectedOrb[] = [];

  for (let i = 0; i < orbs.length; i++) {
    const orb = orbs[i];
    orb.angle += orb.speed * speed;

    const r = orb.orbitRadius * scaleFactor;
    // 3D coordinates on inclined orbital plane
    const x3d = Math.cos(orb.angle) * r;
    const y3d = Math.sin(orb.angle) * r * Math.sin(orb.inclination);
    const z3d = Math.sin(orb.angle) * r * Math.cos(orb.inclination); // Depth

    // Perspective projection
    const fov = 700;
    const projScale = fov / (fov + z3d);
    const px = cx + x3d * projScale;
    const py = cy + y3d * projScale;

    // Reactivity to frequency band
    const rawFreq = frequencyData[orb.freqBin] / 255;
    let bandScale = 1;
    let orbColor = theme.secondary;

    if (orb.freqRange === 'bass') {
      bandScale = 1 + bass * 1.2 * bassIntensity;
      orbColor = theme.primary;
    } else if (orb.freqRange === 'mid') {
      bandScale = 1 + mid * 1.1 * midIntensity;
      orbColor = theme.secondary;
    } else {
      bandScale = 1 + treble * 1.4 * trebleIntensity;
      orbColor = theme.accent;
    }

    const currentRadius = Math.max(3, orb.size * scaleFactor * projScale * (1 + rawFreq * 0.9 * bandScale));

    projectedOrbs.push({
      x: px,
      y: py,
      z: z3d,
      radius: currentRadius,
      color: orbColor,
      freqVal: rawFreq,
      orb,
    });
  }

  // Draw faint orbital ellipses
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = hexToRgba(theme.primary, 0.18);
  for (let i = 0; i < orbs.length; i++) {
    const orb = orbs[i];
    const r = orb.orbitRadius * scaleFactor;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * Math.abs(Math.sin(orb.inclination)) * 0.9 + 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Sort orbs by depth (back to front)
  projectedOrbs.sort((a, b) => a.z - b.z);

  // Laser filaments between orbs when treble harmonics active
  if (treble > 0.35) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(theme.accent, 0.45 * treble * trebleIntensity);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < projectedOrbs.length; i++) {
      for (let j = i + 1; j < projectedOrbs.length; j++) {
        const o1 = projectedOrbs[i];
        const o2 = projectedOrbs[j];
        const dist = Math.hypot(o1.x - o2.x, o1.y - o2.y);
        if (dist < 220 * scaleFactor) {
          ctx.beginPath();
          ctx.moveTo(o1.x, o1.y);
          ctx.lineTo(o2.x, o2.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // Draw each orb
  for (const pOrb of projectedOrbs) {
    ctx.save();

    // Orb 3D Shading
    const orbGrad = ctx.createRadialGradient(
      pOrb.x - pOrb.radius * 0.35,
      pOrb.y - pOrb.radius * 0.35,
      1,
      pOrb.x,
      pOrb.y,
      pOrb.radius
    );
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.3, pOrb.color);
    orbGrad.addColorStop(1, '#000000');

    ctx.fillStyle = orbGrad;
    if (glow > 0) {
      ctx.shadowColor = pOrb.color;
      ctx.shadowBlur = (glow / 100) * 14;
    }

    ctx.beginPath();
    ctx.arc(pOrb.x, pOrb.y, pOrb.radius, 0, Math.PI * 2);
    ctx.fill();

    // Equatorial planetary ring for mid and bass orbs
    if (pOrb.orb.id % 2 === 0) {
      ctx.strokeStyle = hexToRgba(pOrb.color, 0.7);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(pOrb.x, pOrb.y, pOrb.radius * 1.8, pOrb.radius * 0.45, 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

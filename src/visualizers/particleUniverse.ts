import { AudioAnalysis, VisualizerSettings } from '../types/visualizer';
import { hexToRgb, hexToRgba } from './canvasUtils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originDist: number;
  angle: number;
  angularSpeed: number;
  size: number;
  baseSize: number;
  alpha: number;
  colorType: 'primary' | 'secondary' | 'accent';
}

let particles: Particle[] = [];
let initialized = false;

function initParticles(count: number, width: number, height: number) {
  particles = [];
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.45;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Distribute with higher density near center
    const dist = Math.pow(Math.random(), 0.7) * maxRadius;
    const colorType = Math.random() > 0.6 ? 'accent' : Math.random() > 0.3 ? 'primary' : 'secondary';
    const baseSize = 1.2 + Math.random() * 2.8;

    particles.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
      originDist: dist,
      angle,
      angularSpeed: (0.004 + Math.random() * 0.012) * (Math.random() > 0.5 ? 1 : -1),
      size: baseSize,
      baseSize,
      alpha: 0.3 + Math.random() * 0.7,
      colorType,
    });
  }
  initialized = true;
}

export function renderParticleUniverse(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analysis: AudioAnalysis,
  settings: VisualizerSettings,
  time: number
) {
  const { bass, mid, treble, isBeat, beatIntensity } = analysis;
  const { sensitivity, bassIntensity, midIntensity, trebleIntensity, speed, glow, theme, particleCount } = settings;

  if (!initialized || particles.length !== particleCount) {
    initParticles(particleCount, width, height);
  }

  const cx = width / 2;
  const cy = height / 2;

  // Central singularity glowing pulse
  const singularityRadius = 15 + bass * 35 * bassIntensity;
  ctx.save();
  const singGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, singularityRadius * 2.5);
  singGrad.addColorStop(0, hexToRgba(theme.accent, 0.9));
  singGrad.addColorStop(0.3, hexToRgba(theme.primary, 0.4));
  singGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = singGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, singularityRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Supernova shockwave on beat
  if (isBeat) {
    const shockDist = 80 + beatIntensity * 220;
    particles.forEach(p => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (1 - Math.min(1, dist / (width * 0.4))) * 18 * (1 + beatIntensity);
      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;
    });
  }

  // Update and draw particles
  const rotSpeedMult = (0.5 + mid * 1.5 * midIntensity) * speed;

  ctx.save();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // Angular orbital motion
    p.angle += p.angularSpeed * rotSpeedMult;
    const targetX = cx + Math.cos(p.angle) * (p.originDist * (1 + bass * 0.3 * bassIntensity));
    const targetY = cy + Math.sin(p.angle) * (p.originDist * (1 + bass * 0.3 * bassIntensity));

    // Spring attraction towards target orbit
    p.vx += (targetX - p.x) * 0.04;
    p.vy += (targetY - p.y) * 0.04;

    // Friction
    p.vx *= 0.88;
    p.vy *= 0.88;

    p.x += p.vx;
    p.y += p.vy;

    // Reactivity to treble (sparkle and scale)
    const currentSize = p.baseSize * (1 + treble * 1.8 * trebleIntensity + (isBeat ? 1.0 : 0));

    let colorHex = theme.primary;
    if (p.colorType === 'accent') colorHex = theme.accent;
    if (p.colorType === 'secondary') colorHex = theme.secondary;

    ctx.fillStyle = hexToRgba(colorHex, p.alpha);
    if (glow > 0 && p.colorType === 'accent') {
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = (glow / 100) * 8;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
    ctx.fill();

    // Laser filaments between nearby particles when energy is high
    if (mid > 0.45 && i % 3 === 0) {
      for (let j = i + 1; j < Math.min(particles.length, i + 12); j++) {
        const p2 = particles[j];
        const distSq = (p.x - p2.x) * (p.x - p2.x) + (p.y - p2.y) * (p.y - p2.y);
        if (distSq < 3200) { // < ~56px
          const lineAlpha = (1 - Math.sqrt(distSq) / 56) * 0.35 * mid;
          ctx.strokeStyle = hexToRgba(theme.secondary, lineAlpha);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();
}

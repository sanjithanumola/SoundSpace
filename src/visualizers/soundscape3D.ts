import { AudioAnalysis, VisualizerSettings } from '../types/visualizer';
import { hexToRgba } from './canvasUtils';

const GRID_COLS = 28;
const GRID_ROWS = 24;
let gridZOffset = 0;

export function renderSoundscape3D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analysis: AudioAnalysis,
  settings: VisualizerSettings,
  time: number
) {
  const { frequencyData, bass, mid, treble, isBeat, beatIntensity } = analysis;
  const { sensitivity, bassIntensity, midIntensity, trebleIntensity, speed, glow, theme } = settings;

  const horizonY = height * 0.44;
  const fov = 380;
  const cellWidth = 70;
  const cellDepth = 55;

  // Forward grid motion
  gridZOffset = (gridZOffset + (1.2 + bass * 2.8 * bassIntensity + (isBeat ? 3.5 : 0)) * speed) % cellDepth;

  // 1. Horizon Sun & Neon Sky
  ctx.save();
  const sunX = width / 2;
  const sunY = horizonY - 10;
  const sunRadius = Math.min(width, height) * 0.16 * (1 + bass * 0.25 * bassIntensity);

  // Sky backdrop gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#020205');
  skyGrad.addColorStop(0.6, hexToRgba(theme.primary, 0.25));
  skyGrad.addColorStop(1, hexToRgba(theme.secondary, 0.5));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, horizonY);

  // Sun radial aura
  const sunAura = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 2.5);
  sunAura.addColorStop(0, hexToRgba(theme.accent, 0.9));
  sunAura.addColorStop(0.4, hexToRgba(theme.secondary, 0.4));
  sunAura.addColorStop(1, 'transparent');
  ctx.fillStyle = sunAura;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Sun Body with horizontal blinds
  const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
  sunGrad.addColorStop(0, theme.accent);
  sunGrad.addColorStop(0.5, theme.secondary);
  sunGrad.addColorStop(1, theme.primary);

  ctx.fillStyle = sunGrad;
  if (glow > 0) {
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = (glow / 100) * (20 + bass * 25);
  }
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // Retro horizontal sun cut lines
  ctx.fillStyle = '#050508';
  ctx.shadowBlur = 0;
  for (let y = sunY - sunRadius * 0.2; y < sunY + sunRadius; y += 7) {
    const blindHeight = Math.max(1.5, ((y - (sunY - sunRadius * 0.2)) / sunRadius) * 4.5);
    ctx.fillRect(sunX - sunRadius * 1.1, y, sunRadius * 2.2, blindHeight);
  }

  // Horizon laser line
  ctx.strokeStyle = hexToRgba(theme.accent, 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(width, horizonY);
  ctx.stroke();

  ctx.restore();

  // 2. 3D Audio-Reactive Terrain Wireframe
  // Calculate vertex coordinates: x, y (elevation), z (depth)
  const gridPoints: { x: number; y: number; z: number; elev: number }[][] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    const rowPoints: { x: number; y: number; z: number; elev: number }[] = [];
    const z = (GRID_ROWS - r) * cellDepth - gridZOffset;

    for (let c = 0; c < GRID_COLS; c++) {
      const xOffset = (c - GRID_COLS / 2) * cellWidth;

      // Distance from center valley (0 at center, 1 at edges)
      const distFromCenter = Math.abs(c - GRID_COLS / 2) / (GRID_COLS / 2);

      // Valley in center, towering mountain ranges on flanks
      const mountainProfile = Math.pow(distFromCenter, 2.2) * 220;

      // Sample frequency spectrum based on column
      const freqIndex = Math.floor(distFromCenter * (frequencyData.length * 0.55));
      const freqVal = frequencyData[freqIndex] / 255;

      let bandAmp = 1;
      if (distFromCenter < 0.3) {
        // Valley floor reacts to sub-bass
        bandAmp = 1 + bass * 1.4 * bassIntensity;
      } else if (distFromCenter < 0.7) {
        // Slopes react to mids
        bandAmp = 1 + mid * 1.2 * midIntensity;
      } else {
        // Mountain peaks react to treble
        bandAmp = 1 + treble * 1.5 * trebleIntensity;
      }

      // Elevation height (negative Y is up)
      const elev = (mountainProfile * 0.6 + freqVal * 140 * bandAmp) * sensitivity;

      // 3D perspective projection
      const projScale = fov / (fov + z);
      const projX = (width / 2) + (xOffset * projScale);
      const projY = horizonY + (120 * projScale) - (elev * projScale);

      rowPoints.push({ x: projX, y: projY, z, elev });
    }
    gridPoints.push(rowPoints);
  }

  // Draw Terrain wireframe grid
  ctx.save();

  // Draw Horizontal lines (depth rings)
  for (let r = 0; r < GRID_ROWS; r++) {
    const row = gridPoints[r];
    const normDepth = r / GRID_ROWS; // 0 near horizon, 1 near camera
    const lineAlpha = Math.max(0.1, normDepth * 0.95);

    ctx.beginPath();
    ctx.moveTo(row[0].x, row[0].y);
    for (let c = 1; c < GRID_COLS; c++) {
      ctx.lineTo(row[c].x, row[c].y);
    }

    const lineColor = r % 2 === 0 ? theme.primary : theme.secondary;
    ctx.strokeStyle = hexToRgba(lineColor, lineAlpha);
    ctx.lineWidth = Math.max(0.8, normDepth * 2.2);

    if (glow > 0 && r > GRID_ROWS - 5) {
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = (glow / 100) * 12;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.stroke();
  }

  // Draw Longitudinal lines (perspective rays towards horizon)
  for (let c = 0; c < GRID_COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(gridPoints[0][c].x, gridPoints[0][c].y);
    for (let r = 1; r < GRID_ROWS; r++) {
      ctx.lineTo(gridPoints[r][c].x, gridPoints[r][c].y);
    }

    const isFlankPeak = Math.abs(c - GRID_COLS / 2) > (GRID_COLS / 2) * 0.65;
    ctx.strokeStyle = hexToRgba(isFlankPeak ? theme.accent : theme.primary, 0.45);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();

  // 3. Floating audio-reactive monoliths / crystal cubes in center valley
  ctx.save();
  const monolithCount = 3;
  for (let m = 0; m < monolithCount; m++) {
    const mZ = 180 + m * 240;
    const mScale = fov / (fov + mZ);
    const mX = (width / 2) + ((m - 1) * 140 * mScale);
    const mY = horizonY - 45 * mScale - (bass * 60 * mScale * bassIntensity);
    const mSize = 36 * mScale * (1 + (m === 1 ? bass * 0.5 : mid * 0.4));

    // Monolith body
    ctx.fillStyle = hexToRgba(m === 1 ? theme.accent : theme.secondary, 0.85);
    if (glow > 0) {
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = (glow / 100) * 18;
    }

    ctx.beginPath();
    // Diamond / isometric cube shape
    ctx.moveTo(mX, mY - mSize);
    ctx.lineTo(mX + mSize * 0.7, mY);
    ctx.lineTo(mX, mY + mSize);
    ctx.lineTo(mX - mSize * 0.7, mY);
    ctx.closePath();
    ctx.fill();

    // Laser beam down to terrain
    ctx.strokeStyle = hexToRgba(theme.accent, 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mX, mY + mSize);
    ctx.lineTo(mX, horizonY + 80 * mScale);
    ctx.stroke();
  }
  ctx.restore();
}

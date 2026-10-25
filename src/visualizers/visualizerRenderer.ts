import { AudioAnalysis, VisualizerSettings } from '../types/visualizer';
import { renderFrequencyBars } from './frequencyBars';
import { renderCircularSpectrum } from './circularSpectrum';
import { renderAudioWaveform } from './audioWaveform';
import { renderParticleUniverse } from './particleUniverse';
import { renderNeonTunnel } from './neonTunnel';
import { renderCosmicOrbs } from './cosmicOrbs';
import { renderGeometricFlow } from './geometricFlow';
import { renderSoundscape3D } from './soundscape3D';

export function renderVisualizerFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analysis: AudioAnalysis,
  settings: VisualizerSettings,
  time: number
) {
  // Clear canvas with theme background
  ctx.save();
  ctx.fillStyle = settings.theme.background;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Dispatch to the active visualizer mode
  switch (settings.mode) {
    case 'frequency-bars':
      renderFrequencyBars(ctx, width, height, analysis, settings, time);
      break;
    case 'circular-spectrum':
      renderCircularSpectrum(ctx, width, height, analysis, settings, time);
      break;
    case 'audio-waveform':
      renderAudioWaveform(ctx, width, height, analysis, settings, time);
      break;
    case 'particle-universe':
      renderParticleUniverse(ctx, width, height, analysis, settings, time);
      break;
    case 'neon-tunnel':
      renderNeonTunnel(ctx, width, height, analysis, settings, time);
      break;
    case 'cosmic-orbs':
      renderCosmicOrbs(ctx, width, height, analysis, settings, time);
      break;
    case 'geometric-flow':
      renderGeometricFlow(ctx, width, height, analysis, settings, time);
      break;
    case 'soundscape-3d':
      renderSoundscape3D(ctx, width, height, analysis, settings, time);
      break;
    default:
      renderFrequencyBars(ctx, width, height, analysis, settings, time);
      break;
  }
}

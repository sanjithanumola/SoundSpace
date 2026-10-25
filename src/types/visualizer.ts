export type VisualizerMode =
  | 'frequency-bars'
  | 'circular-spectrum'
  | 'audio-waveform'
  | 'particle-universe'
  | 'neon-tunnel'
  | 'cosmic-orbs'
  | 'geometric-flow'
  | 'soundscape-3d';

export interface VisualizerPreset {
  id: string;
  name: string;
  description: string;
  theme: VisualTheme;
  settings: Partial<VisualizerSettings>;
}

export interface VisualTheme {
  name: string;
  primary: string;    // Main accents & peak frequencies
  secondary: string;  // Mid frequencies
  accent: string;     // Treble highlights
  background: string; // Scene backdrop
  glowColor: string;  // Bloom/blur glow
}

export interface VisualizerSettings {
  mode: VisualizerMode;
  sensitivity: number;     // 0.5 - 2.5 (default 1.2)
  bassIntensity: number;   // 0.0 - 2.0 (default 1.2)
  midIntensity: number;    // 0.0 - 2.0 (default 1.0)
  trebleIntensity: number; // 0.0 - 2.0 (default 1.1)
  speed: number;           // 0.5 - 2.5 (default 1.0)
  glow: number;            // 0 - 100 (default 65)
  particleCount: number;   // 50 - 600 (default 250)
  mirrorEffect: boolean;   // default true
  wireframeMode: boolean;  // default false
  theme: VisualTheme;
}

export interface AudioAnalysis {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  bass: number;       // 0 - 1
  mid: number;        // 0 - 1
  treble: number;     // 0 - 1
  energy: number;     // 0 - 1
  isBeat: boolean;    // Transient detection
  beatIntensity: number;
}

export type AudioSourceType = 'file' | 'mic' | 'demo' | 'none';

export interface AudioTrackInfo {
  name: string;
  artist: string;
  duration: number;
  currentTime: number;
  sourceType: AudioSourceType;
  fileName?: string;
}

import React, { useState } from 'react';
import { VisualizerMode, VisualizerSettings, VisualTheme } from '../types/visualizer';
import { PRESETS, DEFAULT_SETTINGS } from '../visualizers/presets';
import { 
  BarChart2, 
  Disc, 
  Activity, 
  Sparkles, 
  Layers, 
  Orbit, 
  Hexagon, 
  Mountain,
  Sliders, 
  Palette, 
  Gauge, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';

interface ControlDockProps {
  settings: VisualizerSettings;
  onUpdateSettings: (newSettings: Partial<VisualizerSettings>) => void;
  onSelectPreset: (presetId: string) => void;
  onResetDefaults: () => void;
  isVisible: boolean;
  onToggleVisible: () => void;
  bassEnergy: number;
  midEnergy: number;
  trebleEnergy: number;
  isBeat: boolean;
}

type TabType = 'modes' | 'visuals' | 'eq' | 'themes';

export const ControlDock: React.FC<ControlDockProps> = ({
  settings,
  onUpdateSettings,
  onSelectPreset,
  onResetDefaults,
  isVisible,
  onToggleVisible,
  bassEnergy,
  midEnergy,
  trebleEnergy,
  isBeat,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('modes');

  const modes: { id: VisualizerMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'frequency-bars', label: 'Frequency Bars', icon: <BarChart2 className="w-4 h-4" />, shortcut: '1' },
    { id: 'circular-spectrum', label: 'Circular Spectrum', icon: <Disc className="w-4 h-4" />, shortcut: '2' },
    { id: 'audio-waveform', label: 'Audio Waveform', icon: <Activity className="w-4 h-4" />, shortcut: '3' },
    { id: 'particle-universe', label: 'Particle Universe', icon: <Sparkles className="w-4 h-4" />, shortcut: '4' },
    { id: 'neon-tunnel', label: 'Neon Tunnel', icon: <Layers className="w-4 h-4" />, shortcut: '5' },
    { id: 'cosmic-orbs', label: 'Cosmic Orbs', icon: <Orbit className="w-4 h-4" />, shortcut: '6' },
    { id: 'geometric-flow', label: 'Geometric Flow', icon: <Hexagon className="w-4 h-4" />, shortcut: '7' },
    { id: 'soundscape-3d', label: '3D Soundscape', icon: <Mountain className="w-4 h-4" />, shortcut: '8' },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl transition-all duration-300 pointer-events-auto">
      {/* Collapse / Expand Tab */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={onToggleVisible}
          className="px-4 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-t border-x border-white/10 rounded-t-xl text-xs font-medium flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-colors cursor-pointer"
        >
          {isVisible ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Studio Dock (H)</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Studio Dock (H)</span>
            </>
          )}
        </button>
      </div>

      {isVisible && (
        <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 shadow-2xl overflow-hidden">
          {/* Dock Header Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3 gap-2 overflow-x-auto">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('modes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'modes'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Visual Modes</span>
              </button>

              <button
                onClick={() => setActiveTab('visuals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'visuals'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Controls & Glow</span>
              </button>

              <button
                onClick={() => setActiveTab('eq')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'eq'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Audio Reactivity</span>
                {isBeat && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('themes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'themes'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Presets & Color</span>
              </button>
            </div>

            <button
              onClick={onResetDefaults}
              title="Reset all settings to defaults"
              className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-xs flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Tab 1: Visual Modes Selection */}
          {activeTab === 'modes' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {modes.map(mode => {
                const isSelected = settings.mode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onUpdateSettings({ mode: mode.id })}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/30 border-purple-500/60 text-white shadow-lg shadow-purple-950/50 scale-[1.02]'
                        : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-300'}`}>
                      {mode.icon}
                    </div>
                    <span className="text-[11px] font-medium leading-tight">
                      {mode.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      Key [{mode.shortcut}]
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Visual Controls (Sensitivity, Speed, Glow, Particles, Mirror) */}
          {activeTab === 'visuals' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-1">
              {/* Sensitivity */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Sensitivity</span>
                  <span className="font-mono text-purple-400 tabular-nums">{settings.sensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.sensitivity}
                  onChange={(e) => onUpdateSettings({ sensitivity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Speed */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Animation Speed</span>
                  <span className="font-mono text-purple-400 tabular-nums">{settings.speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.speed}
                  onChange={(e) => onUpdateSettings({ speed: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Glow Intensity */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Glow Intensity</span>
                  <span className="font-mono text-purple-400 tabular-nums">{settings.glow}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={settings.glow}
                  onChange={(e) => onUpdateSettings({ glow: parseInt(e.target.value, 10) })}
                  className="w-full"
                />
              </div>

              {/* Particle / Geometry Density */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Visual Density</span>
                  <span className="font-mono text-purple-400 tabular-nums">{settings.particleCount}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="500"
                  step="20"
                  value={settings.particleCount}
                  onChange={(e) => onUpdateSettings({ particleCount: parseInt(e.target.value, 10) })}
                  className="w-full"
                />
              </div>

              {/* Mirror effect toggle */}
              <div className="col-span-full pt-1 flex items-center justify-between border-t border-white/5">
                <span className="text-xs text-slate-300">Symmetrical Symmetry / Mirror Reflection</span>
                <button
                  onClick={() => onUpdateSettings({ mirrorEffect: !settings.mirrorEffect })}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    settings.mirrorEffect ? 'bg-purple-600 text-white' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {settings.mirrorEffect ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: EQ & Audio Reactivity (Bass, Mid, Treble multipliers + live meters) */}
          {activeTab === 'eq' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-1">
              {/* Bass Band */}
              <div className="flex flex-col gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="font-medium text-white">Bass Response</span>
                  </div>
                  <span className="font-mono text-purple-400 tabular-nums">{settings.bassIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={settings.bassIntensity}
                  onChange={(e) => onUpdateSettings({ bassIntensity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                {/* Live meter bar */}
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-75"
                    style={{ width: `${Math.min(100, bassEnergy * 100 * settings.bassIntensity)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">Controls scale, shockwaves, tunnel velocity</span>
              </div>

              {/* Midrange Band */}
              <div className="flex flex-col gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500" />
                    <span className="font-medium text-white">Midrange Response</span>
                  </div>
                  <span className="font-mono text-fuchsia-400 tabular-nums">{settings.midIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={settings.midIntensity}
                  onChange={(e) => onUpdateSettings({ midIntensity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                {/* Live meter bar */}
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-fuchsia-500 rounded-full transition-all duration-75"
                    style={{ width: `${Math.min(100, midEnergy * 100 * settings.midIntensity)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">Controls rotation, vortex swirl, ribbon body</span>
              </div>

              {/* Treble Band */}
              <div className="flex flex-col gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="font-medium text-white">Treble Response</span>
                  </div>
                  <span className="font-mono text-cyan-400 tabular-nums">{settings.trebleIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                  value={settings.trebleIntensity}
                  onChange={(e) => onUpdateSettings({ trebleIntensity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                {/* Live meter bar */}
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-75"
                    style={{ width: `${Math.min(100, trebleEnergy * 100 * settings.trebleIntensity)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">Controls sparkle, laser filaments, outer crests</span>
              </div>
            </div>
          )}

          {/* Tab 4: Presets & Themes */}
          {activeTab === 'themes' && (
            <div className="flex flex-col gap-3 py-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {PRESETS.map(preset => {
                  const isActive = settings.theme.name === preset.theme.name;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onSelectPreset(preset.id)}
                      className={`p-2.5 rounded-xl border flex flex-col gap-2 text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/25 border-purple-500/60 shadow-md'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white truncate">{preset.name}</span>
                        {isActive && <Check className="w-3 h-3 text-purple-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.theme.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.theme.secondary }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.theme.accent }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.theme.background }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Pickers */}
              <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-300 font-medium">Fine-tune Theme Colors:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-slate-400">Primary</span>
                    <input
                      type="color"
                      value={settings.theme.primary}
                      onChange={(e) => onUpdateSettings({
                        theme: { ...settings.theme, primary: e.target.value }
                      })}
                      className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-slate-400">Secondary</span>
                    <input
                      type="color"
                      value={settings.theme.secondary}
                      onChange={(e) => onUpdateSettings({
                        theme: { ...settings.theme, secondary: e.target.value }
                      })}
                      className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-slate-400">Accent</span>
                    <input
                      type="color"
                      value={settings.theme.accent}
                      onChange={(e) => onUpdateSettings({
                        theme: { ...settings.theme, accent: e.target.value }
                      })}
                      className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <span className="text-slate-400">Backdrop</span>
                    <input
                      type="color"
                      value={settings.theme.background}
                      onChange={(e) => onUpdateSettings({
                        theme: { ...settings.theme, background: e.target.value }
                      })}
                      className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

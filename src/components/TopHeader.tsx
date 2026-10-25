import React, { useState, useRef } from 'react';
import { AudioSourceType } from '../types/visualizer';
import { DEMO_TRACKS } from '../audio/audioSynthesizer';
import { PRESETS } from '../visualizers/presets';
import { 
  Camera, 
  Maximize, 
  Minimize, 
  Mic, 
  MicOff, 
  Upload, 
  Music, 
  Sliders, 
  HelpCircle,
  ChevronDown
} from 'lucide-react';

interface TopHeaderProps {
  sourceType: AudioSourceType;
  micActive: boolean;
  isFullscreen: boolean;
  activePresetId: string;
  onPlayDemo: (trackId: string) => void;
  onTriggerUpload: () => void;
  onToggleMic: () => void;
  onCaptureScreenshot: () => void;
  onToggleFullscreen: () => void;
  onSelectPreset: (presetId: string) => void;
  onOpenShortcuts: () => void;
  onToggleControls: () => void;
  controlsVisible: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  sourceType,
  micActive,
  isFullscreen,
  activePresetId,
  onPlayDemo,
  onTriggerUpload,
  onToggleMic,
  onCaptureScreenshot,
  onToggleFullscreen,
  onSelectPreset,
  onOpenShortcuts,
  onToggleControls,
  controlsVisible,
}) => {
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <header className="relative z-30 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3 bg-black/60 backdrop-blur-md border-b border-white/10 select-none">
      {/* Zone 1: Single Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2 text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-cyan-300 font-extrabold text-xs">S</span>
            </div>
          </div>
          <span>SoundSpace</span>
        </a>
      </div>

      {/* Zone 2: Navigation & Audio Input Mode Controls */}
      <nav className="flex items-center gap-1.5 md:gap-3 text-xs md:text-sm font-medium">
        {/* Demo Tracks Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setDemoMenuOpen(!demoMenuOpen);
              setPresetMenuOpen(false);
            }}
            className={`px-2.5 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              sourceType === 'demo'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">Demo Tracks</span>
            <span className="sm:hidden">Demo</span>
            <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
          </button>

          {demoMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-48 bg-slate-900/95 border border-white/10 rounded-xl p-1.5 shadow-2xl backdrop-blur-lg z-50">
              {DEMO_TRACKS.map(track => (
                <button
                  key={track.id}
                  onClick={() => {
                    onPlayDemo(track.id);
                    setDemoMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/10 text-slate-200 flex flex-col gap-0.5 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-white">{track.name}</span>
                  <span className="text-[11px] text-slate-400">{track.genre} · {track.bpm} BPM</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload Audio Button */}
        <button
          onClick={onTriggerUpload}
          className={`px-2.5 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            sourceType === 'file'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Upload</span>
        </button>

        {/* Microphone Mode Toggle */}
        <button
          onClick={onToggleMic}
          className={`px-2.5 md:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
            micActive
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          {micActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Mic Live (Stop)</span>
              <span className="sm:hidden">Stop Mic</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Microphone</span>
            </>
          )}
        </button>

        {/* Presets Quick Selector */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => {
              setPresetMenuOpen(!presetMenuOpen);
              setDemoMenuOpen(false);
            }}
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
            <span>Preset: {PRESETS.find(p => p.id === activePresetId)?.name || 'Custom'}</span>
            <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
          </button>

          {presetMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-52 bg-slate-900/95 border border-white/10 rounded-xl p-1.5 shadow-2xl backdrop-blur-lg z-50">
              {PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset.id);
                    setPresetMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    activePresetId === preset.id ? 'bg-purple-600/30 text-purple-200' : 'hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <span className="font-medium">{preset.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.theme.primary }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.theme.secondary }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Zone 3: Primary Action & Utilities */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Toggle Controls Dock */}
        <button
          onClick={onToggleControls}
          title={controlsVisible ? "Hide Studio Controls (H)" : "Show Studio Controls (H)"}
          className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            controlsVisible ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Primary Action: Capture Screenshot */}
        <button
          onClick={onCaptureScreenshot}
          title="Export HD Screenshot"
          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-md shadow-purple-900/40 transition-all cursor-pointer whitespace-nowrap"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export Art</span>
        </button>
      </div>
    </header>
  );
};

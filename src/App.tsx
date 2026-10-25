/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioEngine } from './audio/useAudioEngine';
import { VisualizerSettings, VisualizerMode } from './types/visualizer';
import { DEFAULT_SETTINGS, PRESETS } from './visualizers/presets';
import { VisualizerCanvas, VisualizerCanvasHandle } from './components/VisualizerCanvas';
import { TopHeader } from './components/TopHeader';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { ControlDock } from './components/ControlDock';
import { TrackUploadModal } from './components/TrackUploadModal';
import { ShortcutsModal } from './components/ShortcutsModal';

const SETTINGS_STORAGE_KEY = 'soundspace_user_settings_v1';

export default function App() {
  const [settings, setSettings] = useState<VisualizerSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [activePresetId, setActivePresetId] = useState<string>('electric-purple');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [dragOverGlobal, setDragOverGlobal] = useState<boolean>(false);

  // Audio Engine Hook
  const {
    sourceType,
    isPlaying,
    isMuted,
    volume,
    micActive,
    micError,
    trackInfo,
    setVolume,
    toggleMute,
    togglePlay,
    playDemoTrack,
    loadAudioFile,
    startMicrophone,
    stopMicrophone,
    seek,
    getAudioAnalysis,
  } = useAudioEngine();

  const canvasRef = useRef<VisualizerCanvasHandle | null>(null);
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  // Live audio bands for UI feedback
  const [liveAudioBands, setLiveAudioBands] = useState({
    bass: 0,
    mid: 0,
    treble: 0,
    isBeat: false,
  });

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }
  }, [settings]);

  // Update live audio bands for UI meters (throttled ~15fps for UI)
  useEffect(() => {
    const interval = setInterval(() => {
      const analysis = getAudioAnalysis();
      setLiveAudioBands({
        bass: analysis.bass,
        mid: analysis.mid,
        treble: analysis.treble,
        isBeat: analysis.isBeat,
      });
    }, 65);
    return () => clearInterval(interval);
  }, [getAudioAnalysis]);

  // Settings update handler
  const handleUpdateSettings = useCallback((newSettings: Partial<VisualizerSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  // Preset selector handler
  const handleSelectPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    setSettings(prev => ({
      ...prev,
      theme: preset.theme,
      ...preset.settings,
    }));
  }, []);

  // Reset to defaults
  const handleResetDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setActivePresetId('electric-purple');
  }, []);

  // Screenshot capture handler
  const handleCaptureScreenshot = useCallback(() => {
    canvasRef.current?.captureScreenshot();
  }, []);

  // Fullscreen toggle handler
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Microphone toggle
  const handleToggleMic = useCallback(() => {
    if (micActive) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  }, [micActive, startMicrophone, stopMicrophone]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or contentEditable
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (key === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (key === 'h') {
        e.preventDefault();
        setControlsVisible(prev => !prev);
      } else if (key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (key === 's') {
        e.preventDefault();
        handleCaptureScreenshot();
      } else if (key >= '1' && key <= '8') {
        const modeMap: Record<string, VisualizerMode> = {
          '1': 'frequency-bars',
          '2': 'circular-spectrum',
          '3': 'audio-waveform',
          '4': 'particle-universe',
          '5': 'neon-tunnel',
          '6': 'cosmic-orbs',
          '7': 'geometric-flow',
          '8': 'soundscape-3d',
        };
        const targetMode = modeMap[key];
        if (targetMode) {
          handleUpdateSettings({ mode: targetMode });
        }
      } else if (key === 'escape') {
        setUploadModalOpen(false);
        setShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCaptureScreenshot, handleToggleFullscreen, handleUpdateSettings, toggleMute, togglePlay]);

  // Global Drag and Drop for Audio Files
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverGlobal(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverGlobal(false);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverGlobal(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)) {
        loadAudioFile(file);
      }
    }
  };

  return (
    <div
      ref={appContainerRef}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      className="relative w-screen h-screen overflow-hidden bg-black text-slate-100 flex flex-col font-sans select-none"
    >
      {/* Top Header Bar */}
      <TopHeader
        sourceType={sourceType}
        micActive={micActive}
        isFullscreen={isFullscreen}
        activePresetId={activePresetId}
        onPlayDemo={playDemoTrack}
        onTriggerUpload={() => setUploadModalOpen(true)}
        onToggleMic={handleToggleMic}
        onCaptureScreenshot={handleCaptureScreenshot}
        onToggleFullscreen={handleToggleFullscreen}
        onSelectPreset={handleSelectPreset}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onToggleControls={() => setControlsVisible(prev => !prev)}
        controlsVisible={controlsVisible}
      />

      {/* Main Visualizer Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <VisualizerCanvas
          ref={canvasRef}
          settings={settings}
          getAudioAnalysis={getAudioAnalysis}
          isPlaying={isPlaying}
          sourceType={sourceType}
          onStartDemo={() => playDemoTrack('neon-nightdrive')}
          onTriggerUpload={() => setUploadModalOpen(true)}
          onStartMic={handleToggleMic}
        />

        {/* Floating Audio Playback Bar (Visible when dock is open or track is active) */}
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-4xl transition-all duration-300 pointer-events-auto ${
            controlsVisible ? 'bottom-[235px] sm:bottom-[215px]' : 'bottom-6'
          }`}
        >
          <AudioPlayerBar
            trackInfo={trackInfo}
            isPlaying={isPlaying}
            isMuted={isMuted}
            volume={volume}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
            onVolumeChange={setVolume}
            onSeek={seek}
            bassEnergy={liveAudioBands.bass}
            midEnergy={liveAudioBands.mid}
            trebleEnergy={liveAudioBands.treble}
          />
        </div>

        {/* Collapsible Studio Control Dock */}
        <ControlDock
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onSelectPreset={handleSelectPreset}
          onResetDefaults={handleResetDefaults}
          isVisible={controlsVisible}
          onToggleVisible={() => setControlsVisible(prev => !prev)}
          bassEnergy={liveAudioBands.bass}
          midEnergy={liveAudioBands.mid}
          trebleEnergy={liveAudioBands.treble}
          isBeat={liveAudioBands.isBeat}
        />
      </main>

      {/* Global Drag-over Indicator Overlay */}
      {dragOverGlobal && (
        <div className="absolute inset-0 z-50 bg-purple-950/70 backdrop-blur-md border-4 border-dashed border-purple-400 flex flex-col items-center justify-center pointer-events-none">
          <div className="p-6 bg-slate-900/90 rounded-2xl border border-purple-500/40 text-center shadow-2xl">
            <span className="text-xl font-bold text-white block mb-1">Drop Audio File to Play</span>
            <span className="text-sm text-purple-300">Supports MP3, WAV, FLAC, OGG, AAC</span>
          </div>
        </div>
      )}

      {/* Track Upload Modal */}
      <TrackUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onFileSelected={loadAudioFile}
      />

      {/* Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
}

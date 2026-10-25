import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { AudioAnalysis, AudioSourceType, VisualizerSettings } from '../types/visualizer';
import { renderVisualizerFrame } from '../visualizers/visualizerRenderer';
import { Play, Upload, Mic, Sparkles } from 'lucide-react';

export interface VisualizerCanvasHandle {
  captureScreenshot: () => void;
}

interface VisualizerCanvasProps {
  settings: VisualizerSettings;
  getAudioAnalysis: () => AudioAnalysis;
  isPlaying: boolean;
  sourceType: AudioSourceType;
  onStartDemo: () => void;
  onTriggerUpload: () => void;
  onStartMic: () => void;
}

export const VisualizerCanvas = forwardRef<VisualizerCanvasHandle, VisualizerCanvasProps>(({
  settings,
  getAudioAnalysis,
  isPlaying,
  sourceType,
  onStartDemo,
  onTriggerUpload,
  onStartMic,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const settingsRef = useRef<VisualizerSettings>(settings);

  // Keep settings ref fresh for animation loop
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Screenshot export function
  const captureScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `soundspace_${settingsRef.current.mode}_${timestamp}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    captureScreenshot,
  }), [captureScreenshot]);

  // Main animation frame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const width = canvas.width;
      const height = canvas.height;

      const analysis = getAudioAnalysis();

      renderVisualizerFrame(
        ctx,
        width,
        height,
        analysis,
        settingsRef.current,
        elapsed
      );

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [getAudioAnalysis]);

  // Handle Resize and Retina/HiDPI displayPixelRatio
  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const showEmptyState = sourceType === 'none' && !isPlaying;

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Helpful studio empty state overlay */}
      {showEmptyState && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 px-4">
          <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-2xl p-6 md:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-7 h-7" />
            </div>

            <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight mb-2">
              Welcome to SoundSpace
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Transform sound into reactive digital art. Choose an audio source below to start the visualizer.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onStartDemo}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-purple-900/40 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Demo Track (Neon Nightdrive)</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onTriggerUpload}
                  className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload Audio</span>
                </button>

                <button
                  onClick={onStartMic}
                  className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>Live Microphone</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>8 visual modes</span>
              <span aria-hidden="true">·</span>
              <span>Audio-reactive EQ</span>
              <span aria-hidden="true">·</span>
              <span>4K screenshot export</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VisualizerCanvas.displayName = 'VisualizerCanvas';

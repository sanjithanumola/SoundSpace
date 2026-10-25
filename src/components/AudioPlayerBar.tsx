import React from 'react';
import { AudioTrackInfo } from '../types/visualizer';
import { Play, Pause, Volume2, VolumeX, Mic } from 'lucide-react';

interface AudioPlayerBarProps {
  trackInfo: AudioTrackInfo;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onSeek: (timeSeconds: number) => void;
  bassEnergy: number;
  midEnergy: number;
  trebleEnergy: number;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  trackInfo,
  isPlaying,
  isMuted,
  volume,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSeek,
  bassEnergy,
  midEnergy,
  trebleEnergy,
}) => {
  const isMic = trackInfo.sourceType === 'mic';
  const progressPercent = trackInfo.duration > 0
    ? Math.min(100, (trackInfo.currentTime / trackInfo.duration) * 100)
    : 0;

  return (
    <div className="w-full bg-slate-950/85 backdrop-blur-md border border-white/10 rounded-2xl p-3 md:p-3.5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 text-slate-200">
      {/* Left: Play/Pause button + Track Info */}
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-md shadow-purple-900/40 cursor-pointer shrink-0"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate max-w-[180px] md:max-w-[220px]">
              {trackInfo.name}
            </span>
            {isMic && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <Mic className="w-2.5 h-2.5" /> LIVE
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 truncate max-w-[200px]">
            {trackInfo.artist}
          </span>
        </div>

        {/* Mini Audio Equalizer Visualizer */}
        <div className="flex items-end gap-1 h-5 ml-auto md:ml-2 px-2 py-0.5 bg-black/40 rounded-lg shrink-0">
          <span 
            className="w-1 bg-purple-400 rounded-sm transition-all duration-75" 
            style={{ height: `${Math.max(3, (bassEnergy || 0.1) * 18)}px` }}
          />
          <span 
            className="w-1 bg-fuchsia-400 rounded-sm transition-all duration-75" 
            style={{ height: `${Math.max(3, (midEnergy || 0.15) * 18)}px` }}
          />
          <span 
            className="w-1 bg-cyan-400 rounded-sm transition-all duration-75" 
            style={{ height: `${Math.max(3, (trebleEnergy || 0.1) * 18)}px` }}
          />
          <span 
            className="w-1 bg-indigo-400 rounded-sm transition-all duration-75" 
            style={{ height: `${Math.max(3, ((bassEnergy + midEnergy) / 2 || 0.1) * 18)}px` }}
          />
        </div>
      </div>

      {/* Middle: Progress Bar & Time Stamps (Disabled for Mic) */}
      <div className="flex items-center gap-3 w-full flex-1 max-w-xl">
        <span className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
          {formatTime(trackInfo.currentTime)}
        </span>

        <div className="relative flex-1 flex items-center group">
          <input
            type="range"
            min="0"
            max={trackInfo.duration || 100}
            step="0.5"
            value={trackInfo.currentTime || 0}
            disabled={isMic || !trackInfo.duration}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          />
          {/* Active progress fill */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <span className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
          {isMic ? '∞' : formatTime(trackInfo.duration)}
        </span>
      </div>

      {/* Right: Volume & Mute */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
        <button
          onClick={onToggleMute}
          className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={isMuted ? "Unmute (M)" : "Mute (M)"}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-20 md:w-24 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
          title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
        />
      </div>
    </div>
  );
};

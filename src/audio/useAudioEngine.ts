import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioAnalysis, AudioSourceType, AudioTrackInfo } from '../types/visualizer';
import { ProceduralSynthesizer, DEMO_TRACKS } from './audioSynthesizer';

export function useAudioEngine() {
  const [sourceType, setSourceType] = useState<AudioSourceType>('none');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  const [trackInfo, setTrackInfo] = useState<AudioTrackInfo>({
    name: 'Neon Nightdrive',
    artist: 'SoundSpace Synth',
    duration: 128,
    currentTime: 0,
    sourceType: 'demo',
  });

  // Web Audio Nodes refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Source nodes
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaElementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const synthRef = useRef<ProceduralSynthesizer | null>(null);

  // Audio analysis data buffers
  const freqDataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(512));
  const timeDataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(512));
  const lastBassRef = useRef<number>(0);
  const bassHistoryRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef<number>(0);

  // Initialize or resume AudioContext
  const getOrCreateAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, ctx.currentTime);
      masterGain.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      masterGainRef.current = masterGain;

      // Initialize synthesizer connected to analyser and masterGain
      synthRef.current = new ProceduralSynthesizer(ctx, analyser);
      analyser.connect(masterGain);
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
      if (synthRef.current) {
        synthRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Volume control
  const setVolume = useCallback((newVol: number) => {
    const val = Math.max(0, Math.min(1, newVol));
    setVolumeState(val);
    if (audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : val;
    }
    if (synthRef.current) {
      synthRef.current.setVolume(isMuted ? 0 : val);
    }
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setTargetAtTime(isMuted ? 0 : val, audioContextRef.current.currentTime, 0.02);
    }
  }, [isMuted]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      const effectiveVol = next ? 0 : volume;
      if (audioElementRef.current) {
        audioElementRef.current.volume = effectiveVol;
      }
      if (synthRef.current) {
        synthRef.current.setVolume(effectiveVol);
      }
      if (masterGainRef.current && audioContextRef.current) {
        masterGainRef.current.gain.setTargetAtTime(effectiveVol, audioContextRef.current.currentTime, 0.02);
      }
      return next;
    });
  }, [volume]);

  // Stop microphone
  const stopMicrophone = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }
    setMicActive(false);
  }, []);

  // Start microphone
  const startMicrophone = useCallback(async () => {
    setMicError(null);
    try {
      const ctx = getOrCreateAudioContext();
      if (!analyserRef.current) return;

      // Stop any playing demo or file
      if (synthRef.current) {
        synthRef.current.pause();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      stopMicrophone();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const micSource = ctx.createMediaStreamSource(stream);
      // Connect to analyser ONLY, NEVER to destination to avoid speaker feedback
      micSource.connect(analyserRef.current);

      micStreamRef.current = stream;
      micSourceRef.current = micSource;

      setMicActive(true);
      setSourceType('mic');
      setIsPlaying(true);
      setTrackInfo({
        name: 'Live Microphone Input',
        artist: 'Ambient Sound Capture',
        duration: 0,
        currentTime: 0,
        sourceType: 'mic',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Microphone access denied';
      setMicError(errorMessage);
      setMicActive(false);
      console.warn('Microphone permission or access error:', err);
    }
  }, [getOrCreateAudioContext, stopMicrophone]);

  // Play procedural demo track
  const playDemoTrack = useCallback((trackId: string = 'neon-nightdrive') => {
    getOrCreateAudioContext();
    stopMicrophone();

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const trackDef = DEMO_TRACKS.find(t => t.id === trackId) || DEMO_TRACKS[0];

    if (synthRef.current) {
      synthRef.current.setVolume(isMuted ? 0 : volume);
      synthRef.current.start(trackId, (currentTime) => {
        setTrackInfo(prev => ({ ...prev, currentTime }));
      });
    }

    setSourceType('demo');
    setIsPlaying(true);
    setTrackInfo({
      name: trackDef.name,
      artist: `SoundSpace • ${trackDef.genre}`,
      duration: trackDef.duration,
      currentTime: 0,
      sourceType: 'demo',
    });
  }, [getOrCreateAudioContext, isMuted, stopMicrophone, volume]);

  // Load and play uploaded audio file
  const loadAudioFile = useCallback((file: File) => {
    getOrCreateAudioContext();
    stopMicrophone();

    if (synthRef.current) {
      synthRef.current.pause();
    }

    const ctx = audioContextRef.current!;
    const analyser = analyserRef.current!;

    // Create or reuse Audio element
    if (!audioElementRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audioElementRef.current = audio;

      const sourceNode = ctx.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      mediaElementSourceRef.current = sourceNode;
    }

    const audio = audioElementRef.current;
    const fileUrl = URL.createObjectURL(file);
    audio.src = fileUrl;
    audio.volume = isMuted ? 0 : volume;

    const trackName = file.name.replace(/\.[^/.]+$/, '');

    audio.onloadedmetadata = () => {
      setTrackInfo({
        name: trackName,
        artist: 'Uploaded Local Track',
        duration: audio.duration || 180,
        currentTime: 0,
        sourceType: 'file',
        fileName: file.name,
      });
      setSourceType('file');
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Autoplay prevented:', err);
      });
    };

    audio.ontimeupdate = () => {
      setTrackInfo(prev => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onerror = () => {
      console.error('Audio file playback error');
    };
  }, [getOrCreateAudioContext, isMuted, stopMicrophone, volume]);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    getOrCreateAudioContext();

    if (sourceType === 'mic') {
      stopMicrophone();
      setIsPlaying(false);
      setSourceType('none');
      return;
    }

    if (sourceType === 'demo') {
      if (isPlaying) {
        synthRef.current?.pause();
        setIsPlaying(false);
      } else {
        synthRef.current?.start(undefined, (currentTime) => {
          setTrackInfo(prev => ({ ...prev, currentTime }));
        });
        setIsPlaying(true);
      }
      return;
    }

    if (sourceType === 'file' && audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
      return;
    }

    // If none currently playing, default to demo track
    playDemoTrack('neon-nightdrive');
  }, [getOrCreateAudioContext, isPlaying, playDemoTrack, sourceType, stopMicrophone]);

  // Seek
  const seek = useCallback((timeSeconds: number) => {
    if (sourceType === 'file' && audioElementRef.current) {
      audioElementRef.current.currentTime = timeSeconds;
      setTrackInfo(prev => ({ ...prev, currentTime: timeSeconds }));
    } else if (sourceType === 'demo' && synthRef.current) {
      synthRef.current.seek(timeSeconds);
    }
  }, [sourceType]);

  // Audio Analysis reader (called in animation frame)
  const getAudioAnalysis = useCallback((): AudioAnalysis => {
    const analyser = analyserRef.current;
    if (!analyser) {
      return {
        frequencyData: freqDataRef.current,
        timeDomainData: timeDataRef.current,
        bass: 0,
        mid: 0,
        treble: 0,
        energy: 0,
        isBeat: false,
        beatIntensity: 0,
      };
    }

    analyser.getByteFrequencyData(freqDataRef.current);
    analyser.getByteTimeDomainData(timeDataRef.current);

    const freqData = freqDataRef.current;
    const bufferLength = freqData.length;

    // Bass: 20Hz - 250Hz (bins 1 to 14 approx for fftSize 1024, sampleRate 48kHz -> bin is ~46.8Hz)
    let bassSum = 0;
    const bassEnd = Math.min(14, bufferLength);
    for (let i = 1; i < bassEnd; i++) {
      bassSum += freqData[i];
    }
    const rawBass = bassSum / (bassEnd - 1) / 255;

    // Mid: 250Hz - 2500Hz (bins 14 to 80 approx)
    let midSum = 0;
    const midEnd = Math.min(80, bufferLength);
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += freqData[i];
    }
    const rawMid = midSum / (midEnd - bassEnd) / 255;

    // Treble: 2500Hz - 16000Hz (bins 80 to 280 approx)
    let trebleSum = 0;
    const trebleEnd = Math.min(280, bufferLength);
    for (let i = midEnd; i < trebleEnd; i++) {
      trebleSum += freqData[i];
    }
    const rawTreble = trebleSum / (trebleEnd - midEnd) / 255;

    // Total Energy RMS
    let totalEnergySum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = freqData[i] / 255;
      totalEnergySum += normalized * normalized;
    }
    const energy = Math.sqrt(totalEnergySum / bufferLength);

    // Dynamic Beat Detection on Bass
    const now = performance.now();
    let isBeat = false;
    let beatIntensity = 0;

    // Keep running average of bass history (last 30 samples)
    bassHistoryRef.current.push(rawBass);
    if (bassHistoryRef.current.length > 30) {
      bassHistoryRef.current.shift();
    }
    const avgBass = bassHistoryRef.current.reduce((a, b) => a + b, 0) / bassHistoryRef.current.length;

    if (rawBass > 0.35 && rawBass > avgBass * 1.35 && now - lastBeatTimeRef.current > 180) {
      isBeat = true;
      beatIntensity = Math.min(1, (rawBass - avgBass) * 2.5);
      lastBeatTimeRef.current = now;
    }

    lastBassRef.current = rawBass;

    return {
      frequencyData: freqData,
      timeDomainData: timeDataRef.current,
      bass: rawBass,
      mid: rawMid,
      treble: rawTreble,
      energy,
      isBeat,
      beatIntensity,
    };
  }, []);

  return {
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
    analyserNode: analyserRef.current,
    audioContext: audioContextRef.current,
  };
}

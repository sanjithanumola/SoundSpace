/**
 * SoundSpace Procedural Audio Synthesizer
 * Generates rich, authentic electronic music tracks in real-time using Web Audio API nodes.
 * Guarantees zero 404 network errors and instant playback readiness.
 */

export interface DemoTrackDef {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  duration: number; // in seconds
}

export const DEMO_TRACKS: DemoTrackDef[] = [
  {
    id: 'neon-nightdrive',
    name: 'Neon Nightdrive',
    genre: 'Synthwave',
    bpm: 120,
    duration: 128,
  },
  {
    id: 'cosmic-ambient',
    name: 'Cosmic Ambient',
    genre: 'Ambient Space',
    bpm: 80,
    duration: 144,
  },
  {
    id: 'cyber-pulse',
    name: 'Cyber Pulse',
    genre: 'Cyber Electro',
    bpm: 130,
    duration: 118,
  },
];

export class ProceduralSynthesizer {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private isPlaying: boolean = false;
  private currentTrackId: string = 'neon-nightdrive';
  private timerId: number | null = null;
  private currentStep: number = 0;
  private playbackTime: number = 0;
  private onTimeUpdate?: (currentTime: number) => void;
  private trackStartTime: number = 0;

  constructor(audioContext: AudioContext, destinationNode: AudioNode) {
    this.ctx = audioContext;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(destinationNode);
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.03);
  }

  public start(trackId: string = 'neon-nightdrive', onTime?: (t: number) => void) {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.currentTrackId = trackId;
    this.onTimeUpdate = onTime;
    this.isPlaying = true;
    this.currentStep = 0;
    this.trackStartTime = this.ctx.currentTime - this.playbackTime;
    this.scheduleLoop();
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public stop() {
    this.pause();
    this.playbackTime = 0;
    this.currentStep = 0;
    if (this.onTimeUpdate) {
      this.onTimeUpdate(0);
    }
  }

  public seek(seconds: number) {
    this.playbackTime = Math.max(0, seconds);
    const track = DEMO_TRACKS.find(t => t.id === this.currentTrackId);
    if (track && this.playbackTime >= track.duration) {
      this.playbackTime = 0;
    }
    const bpm = track ? track.bpm : 120;
    const stepDuration = 60 / bpm / 4; // 16th notes
    this.currentStep = Math.floor(this.playbackTime / stepDuration);
    this.trackStartTime = this.ctx.currentTime - this.playbackTime;
    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.playbackTime);
    }
  }

  private scheduleLoop = () => {
    if (!this.isPlaying) return;

    const track = DEMO_TRACKS.find(t => t.id === this.currentTrackId) || DEMO_TRACKS[0];
    const bpm = track.bpm;
    const stepTime = 60 / bpm / 4; // 16th note step in seconds

    // Play next beat element
    this.playStep(this.currentTrackId, this.currentStep, this.ctx.currentTime);

    this.currentStep++;
    this.playbackTime += stepTime;

    if (this.playbackTime >= track.duration) {
      this.playbackTime = 0;
      this.currentStep = 0;
    }

    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.playbackTime);
    }

    this.timerId = window.setTimeout(this.scheduleLoop, stepTime * 1000);
  };

  private playStep(trackId: string, step: number, time: number) {
    if (trackId === 'neon-nightdrive') {
      this.playSynthwaveStep(step, time);
    } else if (trackId === 'cosmic-ambient') {
      this.playCosmicStep(step, time);
    } else {
      this.playCyberPulseStep(step, time);
    }
  }

  // --- Synthwave Engine ---
  private playSynthwaveStep(step: number, time: number) {
    const isDownbeat = step % 16 === 0;
    const isSnare = step % 16 === 8;
    const isKick = step % 4 === 0;
    const isHiHat = step % 2 === 1;

    // 1. Kick Drum (Deep Bass punch 140Hz -> 45Hz)
    if (isKick) {
      this.synthesizeKick(time, 140, 42, 0.28, isDownbeat ? 1.0 : 0.85);
    }

    // 2. Snare Drum (Snappy noise + tone 220Hz)
    if (isSnare) {
      this.synthesizeSnare(time, 210, 0.25, 0.7);
    }

    // 3. Hi-Hat (Crisp Treble noise bandpassed at 9kHz)
    if (isHiHat) {
      this.synthesizeHiHat(time, step % 4 === 2 ? 0.08 : 0.04, 0.45);
    }

    // 4. Bassline (Classic Rolling 16th note synthwave saw bass)
    const chordIdx = Math.floor((step % 64) / 16);
    // Chord progression: Am -> F -> C -> G
    const bassFrequencies = [55, 43.65, 65.41, 48.99]; // A1, F1, C2, G1
    const baseFreq = bassFrequencies[chordIdx];
    
    // Octave jumping bass pattern
    const isHighOctave = step % 2 === 1;
    const noteFreq = isHighOctave ? baseFreq * 2 : baseFreq;
    this.synthesizeBassNote(time, noteFreq, 0.12, 0.45, 'sawtooth');

    // 5. Arpeggio / Lead
    const arpNotes = [
      [220, 261.63, 329.63, 440], // A minor
      [174.61, 220, 261.63, 349.23], // F major
      [261.63, 329.63, 392, 523.25], // C major
      [196, 246.94, 293.66, 392]     // G major
    ][chordIdx];
    
    if (step % 2 === 0) {
      const note = arpNotes[(step / 2) % arpNotes.length];
      this.synthesizeLeadNote(time, note, 0.18, 0.35);
    }
  }

  // --- Cosmic Ambient Engine ---
  private playCosmicStep(step: number, time: number) {
    // Slower, deeper, ethereal
    const chordIdx = Math.floor((step % 64) / 16);
    const ambientChords = [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [110.00, 130.81, 164.81, 196.00], // Am7
      [87.31, 110.00, 130.81, 164.81],  // Fmaj7
      [98.00, 123.47, 146.83, 174.61],  // G7
    ][chordIdx];

    // Deep sub bass pulse every 8 steps
    if (step % 8 === 0) {
      const subFreq = ambientChords[0] / 2;
      this.synthesizeSubBass(time, subFreq, 1.2, 0.6);
    }

    // Soft kick every 16 steps
    if (step % 16 === 0) {
      this.synthesizeKick(time, 90, 36, 0.45, 0.6);
    }

    // Shimmering Bell note
    if (step % 4 === 0 || step % 7 === 0) {
      const noteIdx = (step * 3) % ambientChords.length;
      const note = ambientChords[noteIdx] * 4;
      this.synthesizeBell(time, note, 0.6, 0.3);
    }

    // Lush Pad tone
    if (step % 16 === 0) {
      ambientChords.forEach((freq) => {
        this.synthesizePadNote(time, freq, 2.2, 0.15);
      });
    }
  }

  // --- Cyber Pulse Engine ---
  private playCyberPulseStep(step: number, time: number) {
    const isKick = step % 4 === 0;
    const isSnare = step % 16 === 8;
    const isHat = step % 2 === 0;
    const isFastHat = step % 4 === 2;

    // Hard electronic kick
    if (isKick) {
      this.synthesizeKick(time, 180, 48, 0.22, 1.0);
    }

    // Aggressive snare / clap
    if (isSnare) {
      this.synthesizeSnare(time, 240, 0.2, 0.85);
    }

    // Sizzling metallic hats
    if (isHat || isFastHat) {
      this.synthesizeHiHat(time, isFastHat ? 0.03 : 0.06, isFastHat ? 0.35 : 0.6);
    }

    // Acid 303 Bassline
    const bassline = [
      65.41, 65.41, 77.78, 65.41, 87.31, 65.41, 98.00, 116.54,
      65.41, 130.81, 77.78, 65.41, 58.27, 65.41, 77.78, 87.31
    ];
    const freq = bassline[step % 16];
    const accent = (step % 4 === 0 || step % 8 === 6);
    this.synthesizeAcidBass(time, freq, 0.14, accent ? 0.6 : 0.35, accent);
  }

  // --- Drum and Instrument Synthesizers ---

  private synthesizeKick(time: number, startFreq: number, endFreq: number, duration: number, gainVal: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthesizeSnare(time: number, toneFreq: number, duration: number, gainVal: number) {
    // Noise component
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(gainVal * 0.7, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Body tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(toneFreq, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + duration * 0.6);

    oscGain.gain.setValueAtTime(gainVal * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration);
    osc.start(time);
    osc.stop(time + duration);
  }

  private synthesizeHiHat(time: number, duration: number, gainVal: number) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  private synthesizeBassNote(time: number, freq: number, duration: number, gainVal: number, type: OscillatorType) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(250, time + duration);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthesizeSubBass(time: number, freq: number, duration: number, gainVal: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthesizeLeadNote(time: number, freq: number, duration: number, gainVal: number) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.setValueAtTime(2.5, time);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthesizeBell(time: number, freq: number, duration: number, gainVal: number) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, time); // Inharmonic metallic ratio

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  private synthesizePadNote(time: number, freq: number, duration: number, gainVal: number) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthesizeAcidBass(time: number, freq: number, duration: number, gainVal: number, accent: boolean) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(accent ? 12 : 6, time);
    const startFilterFreq = accent ? 3200 : 1200;
    filter.frequency.setValueAtTime(startFilterFreq, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + duration);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }
}

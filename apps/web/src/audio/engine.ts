// Audio engine: the 4-layer safety chain from architecture/audio_safety_subsystem.md.
// Implements REQ-SAF-01 (ceiling), REQ-SAF-02 (no autoplay), REQ-SAF-03 (fade-in), REQ-SAF-04 (stop < 200 ms),
// REQ-SAF-07 (slew limit), REQ-M3-03 (normalised recordings), REQ-NFR-06 (low-latency drum).
// Every number comes from @harmony/core; nothing here decides a loudness on its own.
import {
  EXPOSURE, clampDb, clipperCurve, softLimitCurve, dbToLinear, fadeInMs, normalisationGain, policyFor, rampDurationMs,
  type AudioMode, type AudioPolicy,
} from '@harmony/core';
import type { AudioExample } from '@harmony/content';

export interface SafetyChain {
  input: GainNode;
  session: GainNode;
  /** L3 soft-knee limiter (static WaveShaper curve; no make-up gain, see DEF-009). */
  limiter: WaveShaperNode;
  clipper: WaveShaperNode;
}

/** Builds layers L2–L4 on any context (live or offline). Exported for the offline-render safety test. */
export function buildSafetyChain(ctx: BaseAudioContext, policy: AudioPolicy): SafetyChain {
  const input = ctx.createGain();
  const session = ctx.createGain();
  session.gain.value = 0;
  const limiter = ctx.createWaveShaper();
  const clipper = ctx.createWaveShaper();
  configureChain({ input, session, limiter, clipper }, policy);
  input.connect(session).connect(limiter).connect(clipper).connect(ctx.destination);
  return { input, session, limiter, clipper };
}

function configureChain(chain: SafetyChain, policy: AudioPolicy): void {
  chain.limiter.curve = softLimitCurve(policy.ceilingDb) as Float32Array<ArrayBuffer>;
  chain.limiter.oversample = '4x'; // reduces aliasing from the knee
  chain.clipper.curve = clipperCurve(policy.ceilingDb) as Float32Array<ArrayBuffer>;
  chain.clipper.oversample = 'none';
  // Child Mode: mono downmix, so no per-ear differences are possible (ADR-0002).
  chain.clipper.channelCount = policy.mono ? 1 : 2;
  chain.clipper.channelCountMode = 'explicit';
  chain.clipper.channelInterpretation = 'speakers';
}

/** Caps a level at the mode ceiling without raising it; non-finite input fails quiet (silence). */
function capDb(db: number, policy: AudioPolicy): number {
  return Number.isFinite(db) ? Math.min(policy.ceilingDb, db) : -Infinity;
}

/** Mono mixdown of a decoded buffer, peak-normalised to targetDb (layer L1). Silence stays silent. */
export function normalisedMono(ctx: BaseAudioContext, src: AudioBuffer, targetDb: number): AudioBuffer {
  const out = ctx.createBuffer(1, src.length, src.sampleRate);
  const d = out.getChannelData(0);
  for (let c = 0; c < src.numberOfChannels; c++) {
    const ch = src.getChannelData(c);
    for (let i = 0; i < ch.length; i++) d[i] = d[i]! + ch[i]! / src.numberOfChannels;
  }
  let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]!));
  const g = normalisationGain(peak, targetDb);
  for (let i = 0; i < d.length; i++) d[i] = d[i]! * g;
  return out;
}

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12); // A4 = 440 Hz, fixed

export interface StopRecord { requestedAt: number; source: string; rampMs: number }

type Listener = () => void;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private chain: SafetyChain | null = null;
  private policy: AudioPolicy = policyFor('parent');
  private volumeDb: number = this.policy.defaultDb;
  private voices = new Set<AudioScheduledSourceNode>();
  private lastSoundAt = -Infinity;
  /** Set by stopAll(): the session gain is at zero, so the next sound must fade in again. */
  private stopped = true;
  /** While graded exposure plays, its level is fixed; volume buttons cannot raise it. */
  private exposureLevelDb: number | null = null;
  private listeners = new Set<Listener>();
  lastStop: StopRecord | null = null;
  onStop: ((r: StopRecord) => void) | null = null;

  /** True once a user gesture has created the context. REQ-SAF-02 */
  get started(): boolean { return this.ctx !== null; }
  get mode(): AudioMode { return this.policy.mode; }
  get ceilingDb(): number { return this.policy.ceilingDb; }
  get volume(): number { return this.volumeDb; }
  get playing(): boolean { return this.voices.size > 0; }
  get exposureActive(): boolean { return this.exposureLevelDb !== null; }

  subscribe(fn: Listener): () => void { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit(): void { this.listeners.forEach((l) => l()); }

  private meter: AnalyserNode | null = null;
  private meterBuf: Float32Array<ArrayBuffer> | null = null;
  /** Incremented by stopAll(), so an async start (e.g. decoding a recording) cannot begin after a Stop. */
  private startToken = 0;

  /** Peak absolute sample of the last ~40 ms of real output, after all safety layers (0–1). */
  outputPeak(): number {
    if (!this.meter) return 0;
    this.meterBuf ??= new Float32Array(this.meter.fftSize);
    this.meter.getFloatTimeDomainData(this.meterBuf);
    let peak = 0;
    for (const v of this.meterBuf) peak = Math.max(peak, Math.abs(v));
    return peak;
  }

  /** Current session gain value (for tests and the level meter). */
  gainValue(): number { return this.chain ? this.chain.session.gain.value : 0; }

  /** Must be called from a user-gesture handler. Never called at import or render time (REQ-SAF-02). */
  private ensure(): { ctx: AudioContext; chain: SafetyChain } {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor({ latencyHint: 'interactive' });
      this.chain = buildSafetyChain(this.ctx, this.policy);
      // Output meter tapped AFTER the final clipper: measures what actually reaches the speakers.
      this.meter = this.ctx.createAnalyser();
      this.meter.fftSize = 2048;
      this.chain.clipper.connect(this.meter);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return { ctx: this.ctx, chain: this.chain! };
  }

  setMode(mode: AudioMode, volumeDb: number): void {
    this.policy = policyFor(mode);
    this.volumeDb = clampDb(volumeDb, this.policy);
    if (this.chain && this.ctx) {
      configureChain(this.chain, this.policy);
      this.applyGain(this.volumeDb, 20);
    }
    this.emit();
  }

  /** REQ-SAF-07 volume changes: rises are slew-limited, falls are fast. Returns the clamped level. */
  setVolume(requestedDb: number): number {
    if (this.exposureLevelDb !== null) return this.volumeDb;
    const target = clampDb(requestedDb, this.policy);
    const ms = rampDurationMs(this.volumeDb, target, this.policy);
    this.volumeDb = target;
    // Applied even when silent, so a lowered volume is in force before the next sound starts.
    if (!this.stopped) this.applyGain(target, ms);
    this.emit();
    return target;
  }

  private applyGain(db: number, ms: number): void {
    if (!this.ctx || !this.chain) return;
    const g = this.chain.session.gain;
    const t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(dbToLinear(clampDb(db, this.policy)), t + ms / 1000);
  }

  /**
   * REQ-SAF-03 when sound starts from silence (or after a Stop), the session gain fades in from zero.
   * An explicit level (graded exposure) always silences other voices and fades in from zero to that level,
   * so exposure can never inherit a louder session gain.
   */
  private beginSound(ctx: AudioContext, chain: SafetyChain, explicitLevelDb?: number): void {
    const g = chain.session.gain;
    const t = ctx.currentTime;
    const silentFor = t - this.lastSoundAt;
    if (explicitLevelDb !== undefined) {
      for (const v of this.voices) { try { v.stop(t); } catch { /* already stopped */ } }
    }
    if (explicitLevelDb !== undefined || (this.voices.size === 0 && (silentFor > 1 || this.stopped))) {
      // User volume is clamped into [floor, ceiling]. An explicit exposure level is only ever clamped DOWN:
      // raising it to the user-volume floor would make quiet exposure louder (defect DEF-001).
      const level = explicitLevelDb !== undefined ? capDb(explicitLevelDb, this.policy) : clampDb(this.volumeDb, this.policy);
      g.cancelScheduledValues(t);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(dbToLinear(level), t + fadeInMs(undefined, this.policy) / 1000);
    }
    this.stopped = false;
    this.lastSoundAt = t;
  }

  private track(node: AudioScheduledSourceNode, endAt: number): void {
    this.voices.add(node);
    node.onended = () => {
      this.voices.delete(node);
      if (this.ctx) this.lastSoundAt = Math.max(this.lastSoundAt, this.ctx.currentTime);
      this.emit();
    };
    node.stop(endAt);
    this.emit();
  }

  private tone(ctx: AudioContext, dest: AudioNode, hz: number, start: number, dur: number, timbre: 'soft' | 'bell', peak = 0.5): void {
    const osc = ctx.createOscillator();
    osc.type = timbre === 'bell' ? 'triangle' : 'sine';
    osc.frequency.value = hz;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(peak, start + 0.03); // soft attack; never a click
    env.gain.setTargetAtTime(0, start + Math.max(0.05, dur * 0.8), timbre === 'bell' ? 0.25 : 0.08);
    osc.connect(env).connect(dest);
    osc.start(start);
    this.track(osc, start + dur + 1);
  }

  /** Plays a governed melody or drum pattern (model audio, songs, calm tracks). Tap-initiated only. */
  play(example: AudioExample, opts: { loops?: number } = {}): void {
    const { ctx, chain } = this.ensure();
    this.beginSound(ctx, chain);
    const beat = 60 / example.bpm;
    let t = ctx.currentTime + 0.05;
    for (let loop = 0; loop < (opts.loops ?? 1); loop++) {
      if (example.kind === 'melody') {
        for (const [midi, beats] of example.notes) {
          // Synth peaks at -6 dBFS before the session gain (layer L1).
          if (midi > 0) this.tone(ctx, chain.input, midiToHz(midi), t, beats * beat, example.timbre, dbToLinear(-6));
          t += beats * beat;
        }
      } else {
        for (const hit of example.pattern) {
          if (hit) this.drumAt(ctx, chain.input, t, 'drum');
          t += beat / 2;
        }
      }
    }
  }

  /** Interactive instrument hit (drum pad, shaker, bells). REQ-NFR-06: scheduled immediately. */
  hit(kind: 'drum' | 'shaker' | 'bells'): number {
    const { ctx, chain } = this.ensure();
    this.beginSound(ctx, chain);
    const at = ctx.currentTime + 0.005;
    if (kind === 'bells') this.tone(ctx, chain.input, midiToHz(76), at, 0.6, 'bell', dbToLinear(-8));
    else this.drumAt(ctx, chain.input, at, kind);
    return (ctx.baseLatency ?? 0) * 1000 + 5;
  }

  private drumAt(ctx: AudioContext, dest: AudioNode, at: number, kind: 'drum' | 'shaker'): void {
    if (kind === 'drum') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, at);
      osc.frequency.exponentialRampToValueAtTime(60, at + 0.25);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(dbToLinear(-6), at + 0.005);
      env.gain.setTargetAtTime(0, at + 0.02, 0.08);
      osc.connect(env).connect(dest);
      osc.start(at);
      this.track(osc, at + 0.6);
    } else {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(ctx, 'shaker');
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(dbToLinear(-10), at + 0.01);
      env.gain.setTargetAtTime(0, at + 0.05, 0.04);
      src.connect(env).connect(dest);
      src.start(at);
      this.track(src, at + 0.4);
    }
  }

  private buffers = new Map<string, AudioBuffer>();

  /** Built-in practice sounds, generated in code and peak-normalised to -1 dBFS (no filter nodes; ADR-0002). */
  private noiseBuffer(ctx: BaseAudioContext, kind: 'shaker' | 'hum' | 'whirr' | 'beep' | 'bell'): AudioBuffer {
    const cached = this.buffers.get(kind);
    if (cached) return cached;
    const seconds = kind === 'shaker' ? 0.4 : 4;
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let seed = 12345, last = 0;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
    for (let i = 0; i < n; i++) {
      const t = i / ctx.sampleRate;
      if (kind === 'shaker') d[i] = rnd();
      else if (kind === 'hum') { last = 0.97 * last + 0.03 * rnd(); d[i] = last * 6 + 0.2 * Math.sin(2 * Math.PI * 120 * t); }
      else if (kind === 'whirr') { last = 0.8 * last + 0.2 * rnd(); d[i] = last * 2 * (0.8 + 0.2 * Math.sin(2 * Math.PI * 30 * t)); }
      else if (kind === 'beep') d[i] = (t % 1 < 0.25 ? 1 : 0) * Math.sin(2 * Math.PI * 1000 * t);
      else d[i] = Math.sin(2 * Math.PI * 660 * t) * Math.exp(-(t % 2) * 1.5);
    }
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]!));
    const g = normalisationGain(peak, -1);
    for (let i = 0; i < n; i++) d[i] = d[i]! * g;
    this.buffers.set(kind, buf);
    return buf;
  }

  /**
   * Graded-exposure playback at an absolute level (REQ-M5-05). The level is clamped by the exposure
   * ceiling here AND by the Child Mode chain (L2–L4).
   */
  playExposure(kind: 'hum' | 'whirr' | 'beep' | 'bell', levelDb: number, maxMs: number = EXPOSURE.maxSessionMs): void {
    const { ctx, chain } = this.ensure();
    this.startExposure(ctx, chain, this.noiseBuffer(ctx, kind), levelDb, maxMs);
  }

  /**
   * Graded exposure with the family's own recording of the difficult sound (sub-study §6.2, C-026; limitation L-03).
   * The recording is mixed to mono and peak-normalised to -1 dBFS, exactly like the built-in sounds, so the plan
   * level means the same thing whichever sound is used. Returns false if a Stop happened while decoding.
   */
  async playExposureRecording(blob: Blob, levelDb: number, maxMs: number = EXPOSURE.maxSessionMs): Promise<boolean> {
    const { ctx, chain } = this.ensure();
    const token = this.startToken;
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    if (token !== this.startToken) return false;
    this.startExposure(ctx, chain, normalisedMono(ctx, decoded, -1), levelDb, maxMs);
    return true;
  }

  private startExposure(ctx: AudioContext, chain: SafetyChain, buffer: AudioBuffer, levelDb: number, maxMs: number): void {
    const level = Math.max(EXPOSURE.minLevelDb, capDb(Math.min(EXPOSURE.ceilingDb, levelDb), this.policy));
    this.beginSound(ctx, chain, level);
    this.exposureLevelDb = level;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(chain.input);
    const at = ctx.currentTime + 0.02;
    src.start(at);
    this.track(src, at + maxMs / 1000);
    src.addEventListener('ended', () => { this.exposureLevelDb = null; });
  }

  /** Plays a caregiver recording through the chain, normalised to -6 dBFS peak (REQ-M3-03). */
  async playRecording(blob: Blob): Promise<void> {
    const { ctx, chain } = this.ensure();
    const token = this.startToken;
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    if (token !== this.startToken) return;
    let peak = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) for (const v of buf.getChannelData(c)) peak = Math.max(peak, Math.abs(v));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const norm = ctx.createGain();
    norm.gain.value = normalisationGain(peak);
    src.connect(norm).connect(chain.input);
    this.beginSound(ctx, chain);
    const at = ctx.currentTime + 0.02;
    src.start(at);
    this.track(src, at + buf.duration);
  }

  /** REQ-SAF-04 synchronous stop: 30 ms ramp to silence, sources stopped at +60 ms. */
  stopAll(source = 'user'): void {
    const requestedAt = performance.now();
    this.lastStop = { requestedAt, source, rampMs: this.policy.stopRampMs };
    this.stopped = true;
    this.exposureLevelDb = null;
    this.startToken++;
    if (this.ctx && this.chain) {
      const g = this.chain.session.gain;
      const t = this.ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0, t + this.policy.stopRampMs / 1000);
      for (const v of this.voices) {
        try { v.stop(t + 0.06); } catch { /* already stopped */ }
      }
    }
    this.onStop?.(this.lastStop);
    this.emit();
  }
}

export const engine = new AudioEngine();

// Read-only hooks for the automated audio-safety tests (tests/audio_safety_report.md). They expose no user data.
declare global {
  interface Window { __harmonyAudio?: { engine: AudioEngine; buildSafetyChain: typeof buildSafetyChain; policyFor: typeof policyFor } }
}
if (typeof window !== 'undefined') window.__harmonyAudio = { engine, buildSafetyChain, policyFor };

import type { AudioFallback, MusicTrack, SfxDefinition } from '../../types/config'

export interface AudioDiagnostics {
  /** 'none' — Web Audio недоступен, 'suspended' — ждёт жеста, 'running' — играет. */
  contextState: 'none' | 'suspended' | 'running' | 'closed'
  /** Что происходит с файловым треком. */
  fileState: 'none' | 'loading' | 'loaded' | 'failed'
  /** Последняя ошибка загрузки короткого звука. */
  sfxError: string
  fileBytes: number
  fileError: string
  /** Пик последнего измерения в дБ, -inf — сигнала нет. */
  peakDb: number
  currentTrackId: string
  fromFile: boolean
}

interface Voice {
  gain: GainNode
  nodes: Array<OscillatorNode | AudioBufferSourceNode>
  cleanup: () => void
}

interface OscillatorSpec {
  frequency: number
  type: OscillatorType
  gain: number
  detune?: number
}

interface Preset {
  oscillators: OscillatorSpec[]
  noise: number
  noiseType: BiquadFilterType
  noiseFrequency: number
  tremolo: number
}

/**
 * The synthesized layers are ambience, not silence: without this boost they
 * land around -50 dBFS and cannot be heard at all.
 */
const SYNTH_LEVEL = 22

const PRESETS: Record<Exclude<AudioFallback, 'silence'>, Preset> = {
  'generated:hum': {
    oscillators: [
      { frequency: 55, type: 'sine', gain: 0.032 },
      { frequency: 82.41, type: 'triangle', gain: 0.016 },
    ],
    noise: 0.009,
    noiseType: 'lowpass',
    noiseFrequency: 420,
    tremolo: 0.08,
  },
  'generated:night': {
    oscillators: [
      { frequency: 110, type: 'sine', gain: 0.026 },
      { frequency: 164.81, type: 'sine', gain: 0.014 },
      { frequency: 220, type: 'triangle', gain: 0.008 },
    ],
    noise: 0.006,
    noiseType: 'lowpass',
    noiseFrequency: 900,
    tremolo: 0.05,
  },
  'generated:chase': {
    oscillators: [
      { frequency: 73.42, type: 'sawtooth', gain: 0.011 },
      { frequency: 110, type: 'square', gain: 0.006 },
    ],
    noise: 0.013,
    noiseType: 'bandpass',
    noiseFrequency: 1400,
    tremolo: 3.4,
  },
  'generated:seal': {
    oscillators: [
      { frequency: 130.81, type: 'sine', gain: 0.03 },
      { frequency: 196, type: 'sine', gain: 0.016 },
      { frequency: 261.63, type: 'triangle', gain: 0.009 },
    ],
    noise: 0.004,
    noiseType: 'lowpass',
    noiseFrequency: 700,
    tremolo: 0.06,
  },
  'generated:radio': {
    oscillators: [{ frequency: 440, type: 'sine', gain: 0.006 }],
    noise: 0.016,
    noiseType: 'bandpass',
    noiseFrequency: 1800,
    tremolo: 0.22,
  },
}

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.2
  }
  return buffer
}

function toDb(value: number): number {
  if (!(value > 0)) return Number.NEGATIVE_INFINITY
  return 20 * Math.log10(value)
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private analyserData: Float32Array<ArrayBuffer> | null = null
  private current: Voice | null = null
  private currentId = ''
  private currentIsFile = false
  private playToken = 0
  private volume = 0.32
  private muted = false
  private sfxEnabled = true
  private noiseBuffer: AudioBuffer | null = null
  private buffers = new Map<string, AudioBuffer>()
  private rawBuffers = new Map<string, ArrayBuffer>()
  private pending = new Map<string, Promise<AudioBuffer | null>>()
  private missing = new Set<string>()
  private peakHoldDb = Number.NEGATIVE_INFINITY
  private peakHoldAt = 0
  private diagnostics: AudioDiagnostics = {
    contextState: 'none',
    fileState: 'none',
    sfxError: '',
    fileBytes: 0,
    fileError: '',
    peakDb: Number.NEGATIVE_INFINITY,
    currentTrackId: '',
    fromFile: false,
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    try {
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyserData = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4)) as Float32Array<ArrayBuffer>
      this.master.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)
      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = this.sfxEnabled && !this.muted ? 1 : 0
      this.sfxGain.connect(this.analyser)
      this.noiseBuffer = makeNoiseBuffer(this.ctx)
      this.syncContextState()
      return this.ctx
    } catch {
      return null
    }
  }

  private syncContextState(): void {
    const state = this.ctx?.state
    this.diagnostics.contextState =
      state === 'running' ? 'running' : state === 'suspended' ? 'suspended' : state ? 'closed' : 'none'
  }

  getDiagnostics(): AudioDiagnostics {
    this.syncContextState()
    this.diagnostics.peakDb = this.measurePeak()
    return { ...this.diagnostics }
  }

  /**
   * Peak level of the master bus in dB, with a slow decay so that a short
   * test tone stays visible in the diagnostics panel.
   */
  measurePeak(): number {
    const analyser = this.analyser
    const data = this.analyserData
    if (!analyser || !data) return Number.NEGATIVE_INFINITY
    analyser.getFloatTimeDomainData(data)
    let peak = 0
    for (const value of data) {
      const abs = Math.abs(value)
      if (abs > peak) peak = abs
    }
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const current = toDb(peak)
    if (current > this.peakHoldDb) {
      this.peakHoldDb = current
      this.peakHoldAt = now
    } else {
      const seconds = (now - this.peakHoldAt) / 1000
      this.peakHoldDb = Math.max(current, this.peakHoldDb - 8 * seconds)
    }
    return this.peakHoldDb
  }

  /** Plays a short test tone so the user can confirm the audio path works. */
  async testTone(): Promise<void> {
    const ctx = this.ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') await this.unlock()
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 880
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.03)
    gain.gain.setValueAtTime(0.4, ctx.currentTime + 0.35)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45)
    osc.connect(gain)
    gain.connect(this.master ?? ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }

  async unlock(): Promise<void> {
    const ctx = this.ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        // Autoplay policy can still block; the next gesture retries.
      }
    }
    this.syncContextState()
  }

  setVolume(volume: number, muted: boolean): void {
    this.volume = Math.min(1, Math.max(0, volume))
    this.muted = muted
    if (!this.master || !this.ctx) return
    const target = muted ? 0 : this.volume
    this.master.gain.cancelScheduledValues(this.ctx.currentTime)
    this.master.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.25)
    this.applySfxGain()
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled
    this.applySfxGain()
  }

  private applySfxGain(): void {
    if (!this.sfxGain || !this.ctx) return
    const target = this.sfxEnabled && !this.muted ? 1 : 0
    this.sfxGain.gain.cancelScheduledValues(this.ctx.currentTime)
    this.sfxGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.15)
  }

  getCurrentId(): string {
    return this.currentId
  }

  /** True when the playing track comes from a file rather than the synthesis. */
  isFileTrack(): boolean {
    return this.currentIsFile
  }

  async play(track: MusicTrack, volume: number, muted: boolean): Promise<void> {
    this.setVolume(volume, muted)
    this.diagnostics.currentTrackId = track.id
    if (this.currentId === track.id && this.current) return
    const ctx = this.ensureContext()
    if (!ctx || !this.master) return
    if (ctx.state === 'suspended') await this.unlock()
    this.stopCurrent()

    // Two overlapping play() calls would start the same track twice.
    const token = ++this.playToken
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(this.master)
    const target = muted ? 0 : Math.max(0.04, track.volume)
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.8)

    if (track.src) {
      const started = await this.playFile(track, gain, token)
      if (token !== this.playToken) {
        gain.disconnect()
        return
      }
      if (started) {
        this.currentId = track.id
        this.currentIsFile = true
        this.diagnostics.fromFile = true
        this.diagnostics.fileState = 'loaded'
        return
      }
    }

    if (token !== this.playToken) {
      gain.disconnect()
      return
    }
    this.current = this.playGenerated(track.fallback, gain)
    this.currentId = track.id
    this.currentIsFile = false
    this.diagnostics.fromFile = false
    if (track.src) this.diagnostics.fileState = 'failed'
  }

  /**
   * Fetches and decodes an audio file once, then keeps it in memory.
   * Returns null when the file is missing or unreadable.
   */
  private async loadBuffer(src: string, kind: 'music' | 'sfx' = 'music'): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(src)
    if (cached) return cached
    if (this.missing.has(src)) return null
    const pending = this.pending.get(src)
    if (pending) return pending
    const ctx = this.ctx
    if (!ctx) return null
    if (kind === 'music') this.diagnostics.fileState = 'loading'
    const request = (async () => {
      try {
        const raw = this.rawBuffers.get(src) ?? (await this.fetchRaw(src, kind))
        if (!raw) {
          this.missing.add(src)
          if (kind === 'music') {
            this.diagnostics.fileError = 'файл не найден или недоступен'
            this.diagnostics.fileState = 'failed'
          } else {
            this.diagnostics.sfxError = 'файл не найден или недоступен'
          }
          return null
        }
        if (kind === 'music') this.diagnostics.fileBytes = raw.byteLength
        const buffer = await ctx.decodeAudioData(raw.slice(0))
        this.buffers.set(src, buffer)
        return buffer
      } catch (error) {
        this.missing.add(src)
        if (kind === 'music') {
          this.diagnostics.fileError = error instanceof Error ? error.message : String(error)
          this.diagnostics.fileState = 'failed'
        } else {
          this.diagnostics.sfxError = error instanceof Error ? error.message : String(error)
        }
        return null
      } finally {
        this.pending.delete(src)
      }
    })()
    this.pending.set(src, request)
    return request
  }

  private async fetchRaw(src: string, kind: 'music' | 'sfx' = 'music'): Promise<ArrayBuffer | null> {
    try {
      const response = await fetch(src)
      if (!response.ok) {
        if (kind === 'music') this.diagnostics.fileError = `HTTP ${response.status}`
        else this.diagnostics.sfxError = `HTTP ${response.status}`
        return null
      }
      // A missing file on a static host can answer with the SPA fallback (HTML).
      // Decoding that would only produce noise, so treat it as a missing file.
      const type = response.headers.get('content-type') ?? ''
      if (type && !type.startsWith('audio/') && !type.includes('octet-stream')) {
        if (kind === 'music') this.diagnostics.fileError = `не тот формат (${type})`
        else this.diagnostics.sfxError = `не тот формат (${type})`
        return null
      }
      const raw = await response.arrayBuffer()
      this.rawBuffers.set(src, raw)
      return raw
    } catch (error) {
      if (kind === 'music') this.diagnostics.fileError = error instanceof Error ? error.message : String(error)
      else this.diagnostics.sfxError = error instanceof Error ? error.message : String(error)
      return null
    }
  }

  /**
   * Warms the cache so the first playback starts without waiting for the network.
   * Uses fetch only, so no AudioContext is created before the first gesture.
   */
  preload(track: MusicTrack): void {
    if (!track.src) return
    if (this.buffers.has(track.src) || this.rawBuffers.has(track.src)) return
    if (this.missing.has(track.src)) return
    void this.fetchRaw(track.src, 'music')
  }

  async playSfx(definition: SfxDefinition): Promise<void> {
    if (!definition.src || !this.sfxEnabled || this.muted) return
    const ctx = this.ensureContext()
    if (!ctx || !this.sfxGain) return
    if (ctx.state === 'suspended') await this.unlock()
    const buffer = await this.loadBuffer(definition.src, 'sfx')
    if (!buffer) return
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = definition.volume
    source.connect(gain)
    gain.connect(this.sfxGain)
    source.start()
  }

  private async playFile(track: MusicTrack, gain: GainNode, token: number): Promise<boolean> {
    if (!track.src) return false
    const ctx = this.ctx
    if (!ctx) return false
    const buffer = await this.loadBuffer(track.src)
    if (!buffer) return false
    if (token !== this.playToken) return false
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = track.loop
    source.connect(gain)
    source.start()
    this.current = {
      gain,
      nodes: [source],
      cleanup: () => {
        try {
          source.stop()
        } catch {
          // Already stopped.
        }
        source.disconnect()
        gain.disconnect()
      },
    }
    return true
  }

  private playGenerated(fallback: AudioFallback, gain: GainNode): Voice {
    const ctx = this.ctx
    if (!ctx || fallback === 'silence') {
      return { gain, nodes: [], cleanup: () => gain.disconnect() }
    }
    const preset = PRESETS[fallback]
    const nodes: Array<OscillatorNode | AudioBufferSourceNode> = []

    const bus = ctx.createGain()
    bus.gain.value = SYNTH_LEVEL
    bus.connect(gain)

    preset.oscillators.forEach((spec) => {
      const osc = ctx.createOscillator()
      osc.type = spec.type
      osc.frequency.value = spec.frequency
      if (spec.detune) osc.detune.value = spec.detune
      const oscGain = ctx.createGain()
      oscGain.gain.value = spec.gain
      osc.connect(oscGain)
      oscGain.connect(bus)
      osc.start()
      nodes.push(osc)
    })

    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource()
      noise.buffer = this.noiseBuffer
      noise.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = preset.noiseType
      filter.frequency.value = preset.noiseFrequency
      filter.Q.value = 0.8
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = preset.noise
      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(bus)
      noise.start()
      nodes.push(noise)
    }

    if (preset.tremolo > 0) {
      const lfo = ctx.createOscillator()
      const lfoDepth = ctx.createGain()
      lfo.frequency.value = preset.tremolo
      lfoDepth.gain.value = preset.tremolo > 1 ? 0.18 : 0.04
      lfo.connect(lfoDepth)
      lfoDepth.connect(gain.gain)
      lfo.start()
      nodes.push(lfo)
    }

    return {
      gain,
      nodes,
      cleanup: () => {
        nodes.forEach((node) => {
          try {
            node.stop()
          } catch {
            // Already stopped.
          }
          node.disconnect()
        })
        bus.disconnect()
        gain.disconnect()
      },
    }
  }

  private stopCurrent(): void {
    if (!this.current || !this.ctx) {
      this.current = null
      return
    }
    const voice = this.current
    const now = this.ctx.currentTime
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(Math.max(0.001, voice.gain.gain.value), now)
    voice.gain.gain.linearRampToValueAtTime(0, now + 0.45)
    window.setTimeout(() => voice.cleanup(), 600)
    this.current = null
  }

  stop(): void {
    this.stopCurrent()
    this.currentId = ''
    this.currentIsFile = false
  }

  destroy(): void {
    this.stop()
    this.buffers.clear()
    this.rawBuffers.clear()
    this.pending.clear()
    this.missing.clear()
    if (this.ctx) {
      this.ctx.close().catch(() => undefined)
      this.ctx = null
      this.master = null
      this.sfxGain = null
      this.analyser = null
      this.analyserData = null
    }
  }
}

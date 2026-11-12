import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { MUSIC_TRACKS, trackForScreen } from '../../config/music.config'
import { SFX } from '../../config/sfx.config'
import { AudioEngine } from '../../services/audio/AudioEngine'
import { useGameStore } from '../../store/gameStore'
import type { MusicTrack, SfxId } from '../../types/config'

interface AudioContextValue {
  currentTrack: MusicTrack
  enabled: boolean
  isPlaying: boolean
  volume: number
  muted: boolean
  sfxEnabled: boolean
  toggle: () => void
  selectTrack: (id: string) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  setSfxEnabled: (enabled: boolean) => void
  sfx: (id: SfxId) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

const CLICK_THROTTLE_MS = 60

export function AudioProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const audio = useGameStore((state) => state.audio)
  const setAudio = useGameStore((state) => state.setAudio)
  const [engine] = useState(() => new AudioEngine())
  const [currentTrackId, setCurrentTrackId] = useState(() => trackForScreen('boot').id)
  const lastClick = useRef(0)
  const firstScreen = useRef(true)

  const currentTrack = useMemo(
    () => MUSIC_TRACKS.find((track) => track.id === currentTrackId) ?? MUSIC_TRACKS[0],
    [currentTrackId],
  )

  const sfx = useCallback(
    (id: SfxId) => {
      const definition = SFX[id]
      if (!definition) return
      void engine.playSfx(definition)
    },
    [engine],
  )

  useEffect(() => {
    const track = trackForScreen(location.pathname.replace('/', '') || 'boot')
    setCurrentTrackId(track.id)
  }, [location.pathname])

  useEffect(() => {
    if (!engine) return
    engine.setSfxEnabled(audio.sfxEnabled)
  }, [audio.sfxEnabled, engine])

  useEffect(() => {
    if (!engine) return
    if (!audio.enabled) {
      engine.stop()
      return
    }
    let cancelled = false
    void engine.unlock().then(() => {
      if (!cancelled) void engine.play(currentTrack, audio.volume, audio.muted)
    })
    return () => {
      cancelled = true
    }
  }, [audio.enabled, audio.muted, audio.volume, currentTrack, engine])

  useEffect(() => {
    if (!engine) return
    engine.setVolume(audio.volume, audio.muted)
  }, [audio.muted, audio.volume, engine])

  useEffect(() => {
    if (!engine) return
    return () => engine.destroy()
  }, [engine])

  // Download the next track ahead of time so it starts without a delay.
  useEffect(() => {
    if (!engine) return
    engine.preload(currentTrack)
  }, [currentTrack, engine])

  useEffect(() => {
    if (!audio.enabled) return
    const onGesture = () => {
      void engine.unlock().then(() => engine.play(currentTrack, audio.volume, audio.muted))
    }
    window.addEventListener('pointerdown', onGesture, { once: true })
    return () => window.removeEventListener('pointerdown', onGesture)
  }, [audio.enabled, audio.muted, audio.volume, currentTrack, engine])

  // Every press on a control gets a click, throttled to avoid machine-gunning.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      const control = target?.closest('button, [role="button"], a')
      if (!control) return
      const now = Date.now()
      if (now - lastClick.current < CLICK_THROTTLE_MS) return
      lastClick.current = now
      sfx('ui-click')
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [sfx])

  // Screen changes get their own soft cue.
  useEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false
      return
    }
    sfx('ui-page')
  }, [location.pathname, sfx])

  const toggle = useCallback(() => {
    const next = !audio.enabled
    setAudio({ enabled: next })
    if (next) {
      void engine.unlock().then(() => engine.play(currentTrack, audio.volume, audio.muted))
    } else {
      engine.stop()
    }
  }, [audio.enabled, audio.volume, audio.muted, currentTrack, engine, setAudio])

  const selectTrack = useCallback(
    (id: string) => {
      setCurrentTrackId(id)
      if (!audio.enabled) setAudio({ enabled: true })
    },
    [audio.enabled, setAudio],
  )

  const setVolume = useCallback(
    (volume: number) => {
      setAudio({ volume: Math.min(1, Math.max(0, volume)) })
    },
    [setAudio],
  )

  const setMuted = useCallback(
    (muted: boolean) => {
      setAudio({ muted })
    },
    [setAudio],
  )

  const setSfxEnabled = useCallback(
    (enabled: boolean) => {
      setAudio({ sfxEnabled: enabled })
    },
    [setAudio],
  )

  const value = useMemo<AudioContextValue>(
    () => ({
      currentTrack,
      enabled: audio.enabled,
      isPlaying: audio.enabled,
      volume: audio.volume,
      muted: audio.muted,
      sfxEnabled: audio.sfxEnabled,
      toggle,
      selectTrack,
      setVolume,
      setMuted,
      setSfxEnabled,
      sfx,
    }),
    [
      audio.enabled,
      audio.muted,
      audio.sfxEnabled,
      audio.volume,
      currentTrack,
      selectTrack,
      setMuted,
      setSfxEnabled,
      setVolume,
      sfx,
      toggle,
    ],
  )

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useAudio must be used inside AudioProvider')
  return context
}

const NOOP_SFX = () => undefined

/**
 * Sound effects are decorative: outside the provider they stay silent
 * instead of breaking the screen that wanted them.
 */
export function useSfx(): (id: SfxId) => void {
  const context = useContext(AudioContext)
  return context?.sfx ?? NOOP_SFX
}

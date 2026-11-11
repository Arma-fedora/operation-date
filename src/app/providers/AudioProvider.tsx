import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { MUSIC_TRACKS, trackForScreen } from '../../config/music.config'
import { AudioEngine } from '../../services/audio/AudioEngine'
import { useGameStore } from '../../store/gameStore'
import type { MusicTrack } from '../../types/config'

interface AudioContextValue {
  currentTrack: MusicTrack
  enabled: boolean
  isPlaying: boolean
  volume: number
  muted: boolean
  toggle: () => void
  selectTrack: (id: string) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const audio = useGameStore((state) => state.audio)
  const setAudio = useGameStore((state) => state.setAudio)
  const [engine] = useState(() => new AudioEngine())
  const [currentTrackId, setCurrentTrackId] = useState(() => trackForScreen('boot').id)

  const currentTrack = useMemo(
    () => MUSIC_TRACKS.find((track) => track.id === currentTrackId) ?? MUSIC_TRACKS[0],
    [currentTrackId],
  )

  useEffect(() => {
    const track = trackForScreen(location.pathname.replace('/', '') || 'boot')
    setCurrentTrackId(track.id)
  }, [location.pathname])

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

  useEffect(() => {
    if (!audio.enabled) return
    const onGesture = () => {
      void engine.unlock().then(() => engine.play(currentTrack, audio.volume, audio.muted))
    }
    window.addEventListener('pointerdown', onGesture, { once: true })
    return () => window.removeEventListener('pointerdown', onGesture)
  }, [audio.enabled, audio.muted, audio.volume, currentTrack, engine])

  const toggle = useCallback(() => {
    const next = !audio.enabled
    setAudio({ enabled: next })
    if (next) {
      void engine.unlock().then(() => engine.play(currentTrack, audio.volume, audio.muted))
    } else {
      engine.stop()
    }
  }, [audio.enabled, audio.muted, audio.volume, currentTrack, engine, setAudio])

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

  const value = useMemo<AudioContextValue>(
    () => ({
      currentTrack,
      enabled: audio.enabled,
      isPlaying: audio.enabled,
      volume: audio.volume,
      muted: audio.muted,
      toggle,
      selectTrack,
      setVolume,
      setMuted,
    }),
    [audio.enabled, audio.muted, audio.volume, currentTrack, selectTrack, setMuted, setVolume, toggle],
  )

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useAudio must be used inside AudioProvider')
  return context
}

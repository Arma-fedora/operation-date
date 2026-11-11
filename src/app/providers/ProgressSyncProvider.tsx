import { useEffect, useRef } from 'react'
import { remoteAvailable, syncProgress } from '../../services/api/gameApi'
import { useGameStore } from '../../store/gameStore'

export function ProgressSyncProvider() {
  const timer = useRef<number | null>(null)
  const lastSynced = useRef('')

  useEffect(() => {
    if (!remoteAvailable()) return
    const unsubscribe = useGameStore.subscribe((state) => {
      if (state.updatedAt === lastSynced.current) return
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        lastSynced.current = state.updatedAt
        void syncProgress(state).catch(() => undefined)
      }, 1400)
    })

    const flush = () => {
      if (document.visibilityState !== 'hidden') return
      const state = useGameStore.getState()
      if (state.updatedAt !== lastSynced.current) {
        lastSynced.current = state.updatedAt
        void syncProgress(state).catch(() => undefined)
      }
    }

    document.addEventListener('visibilitychange', flush)
    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', flush)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  return null
}

import { useEffect, useState, type ReactNode } from 'react'
import { bootstrapSession, remoteAvailable } from '../../services/api/gameApi'
import { useGameStore } from '../../store/gameStore'

/**
 * Restores the archive copy from Supabase before the first screen renders.
 * Demo mode and offline use never block: local storage is the source of truth.
 */
export function BootstrapProvider({ children }: { children: ReactNode }) {
  const hydrate = useGameStore((store) => store.hydrate)
  const [ready, setReady] = useState(() => !remoteAvailable())

  useEffect(() => {
    if (!remoteAvailable()) return

    let active = true
    void bootstrapSession()
      .then((remote) => {
        if (!active || !remote) return
        hydrate(remote)
      })
      .finally(() => {
        if (active) setReady(true)
      })

    return () => {
      active = false
    }
  }, [hydrate])

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[var(--bg)] px-6 text-center">
        <div>
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">
            <span className="font-display text-lg">01</span>
          </div>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--fg-muted)]">
            архив поднимает дело…
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--fg-muted)]/70">
            Проверяем сохранённый прогресс
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

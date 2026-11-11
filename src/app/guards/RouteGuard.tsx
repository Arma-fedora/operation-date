import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { SCREEN_BY_ID } from '../../config/app.config'
import { useGameStore } from '../../store/gameStore'
import type { ScreenId } from '../../types/game'
import { isScreenUnlocked, latestAvailableScreen, lockReason } from '../../utils/conditions'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { Stamp } from '../../components/ui/Stamp'

export function RouteGuard({ screen, children }: { screen: ScreenId; children: ReactNode }) {
  const state = useGameStore()
  const navigate = useNavigate()

  if (isScreenUnlocked(screen, state)) return <>{children}</>

  const current = SCREEN_BY_ID[latestAvailableScreen(state)]
  const meta = SCREEN_BY_ID[screen]

  return (
    <div className="flex min-h-[60dvh] items-center justify-center py-6">
      <Panel variant="dark" className="w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-full border border-[var(--line)] text-[var(--fg-muted)]">
            <LockKeyhole className="size-5" />
          </span>
          <Stamp tone="red" rotate={5}>
            доступ закрыт
          </Stamp>
        </div>
        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
          дело {meta.chapter} · {meta.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-2xl uppercase leading-none">{meta.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">{lockReason(screen, state)}</p>
        <Button
          variant="primary"
          full
          className="mt-6"
          onClick={() => navigate(current.path)}
        >
          Вернуться к доступному этапу
        </Button>
        <p className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--fg-muted)]/60">
          спецпропуск выдаётся по мере расследования
        </p>
      </Panel>
    </div>
  )
}

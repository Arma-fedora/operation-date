import { Menu, Volume2, VolumeX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../../config/app.config'
import { useAudio } from '../../app/providers/AudioProvider'
import { progressPercent } from '../../utils/conditions'
import { useGameStore } from '../../store/gameStore'
import { IconButton } from '../ui/IconButton'
import { ProgressRing } from '../ui/ProgressRing'
import { cn } from '../../utils'

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate()
  const audio = useAudio()
  const percent = useGameStore((state) => progressPercent(state))

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[58px] w-full max-w-[820px] items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => navigate('/incident')}
          className="group flex min-w-0 items-center gap-2.5 text-left"
          aria-label="Вернуться к делу"
        >
          <span className="grid size-8 shrink-0 place-items-center border border-[var(--accent)]/50 bg-[var(--accent)]/10 font-mono text-[9px] font-bold text-[var(--accent)]">
            01:03
          </span>
          <span className="min-w-0">
            <span className="block truncate font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
              дело №{APP_CONFIG.caseNumber}
            </span>
            <span className="block truncate font-display text-[11px] uppercase tracking-[0.08em] text-[var(--fg)]">
              Операция «Свидание»
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          {APP_CONFIG.demoMode ? (
            <span className="hidden border border-[var(--gold)]/40 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--gold)] sm:inline-block">
              демо
            </span>
          ) : null}
          <span
            className="hidden font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/70 sm:inline-block"
            title="Состояние звука"
          >
            {audio.diagnostics.contextState === 'running'
              ? Number.isFinite(audio.diagnostics.peakDb)
                ? `${audio.diagnostics.peakDb.toFixed(0)} дБ`
                : 'звук'
              : audio.diagnostics.contextState === 'suspended'
                ? 'ждём касания'
                : 'нет звука'}
          </span>
          <IconButton label={audio.enabled ? 'Выключить звук' : 'Включить звук'} size="sm" onClick={audio.toggle}>
            {audio.enabled && !audio.muted ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          </IconButton>
          <button
            type="button"
            onClick={onMenu}
            className={cn(
              'flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg-elev)]/80 py-1 pl-1 pr-2.5 transition-colors hover:border-[var(--accent)]',
            )}
            aria-label="Открыть дело"
          >
            <ProgressRing value={percent} size={28} stroke={2} label="Прогресс расследования" />
            <Menu className="size-4 text-[var(--fg-muted)]" />
          </button>
        </div>
      </div>
    </div>
  )
}

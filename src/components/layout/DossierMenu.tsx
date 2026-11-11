import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronRight,
  Lock,
  Moon,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { APP_CONFIG, CORE_SCREENS, SCREENS } from '../../config/app.config'
import { useAudio } from '../../app/providers/AudioProvider'
import { useRegisterBackHandler } from '../../app/providers/BackButtonProvider'
import { useToast } from '../../app/providers/ToastProvider'
import { useTelegram } from '../../app/providers/TelegramProvider'
import { useGameStore } from '../../store/gameStore'
import { isScreenUnlocked, lockReason } from '../../utils/conditions'
import { cn } from '../../utils'
import { IconButton } from '../ui/IconButton'
import { ProgressRing } from '../ui/ProgressRing'
import { Stamp } from '../ui/Stamp'

export function DossierMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const state = useGameStore()
  const audio = useAudio()
  const { theme, setTheme, isTelegram, user } = useTelegram()
  const { showToast } = useToast()
  const [confirmReset, setConfirmReset] = useState(false)

  useRegisterBackHandler(onClose, open)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, open])

  const go = (path: string, unlocked: boolean, reason: string) => {
    if (!unlocked) {
      showToast(reason, 'warning')
      return
    }
    onClose()
    navigate(path)
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 330, damping: 34 }}
            onClick={(event) => event.stopPropagation()}
            className="ml-auto flex h-full w-full max-w-[420px] flex-col border-l border-[var(--line-strong)] bg-[var(--bg-elev)] text-[var(--fg)] shadow-[-30px_0_100px_rgba(0,0,0,0.5)]"
            role="dialog"
            aria-modal="true"
            aria-label="Дело №0103"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))]">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[var(--accent)]">
                  дело №{APP_CONFIG.caseNumber}
                </p>
                <h2 className="mt-1 font-display text-xl uppercase leading-none tracking-tight">Операция «Свидание»</h2>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  {isTelegram ? `агент @${user.username ?? 'без_ника'}` : 'локальный демо-доступ'}
                </p>
              </div>
              <IconButton label="Закрыть дело" size="sm" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              <div className="flex items-center gap-4 border border-[var(--line)] bg-[var(--bg)]/50 p-4">
                <ProgressRing value={Math.round((CORE_SCREENS.filter((screen) => state.completed.includes(screen.id)).length / CORE_SCREENS.length) * 100)} size={54} stroke={3} />
                <div className="min-w-0">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">прогресс</p>
                  <p className="mt-1 font-display text-lg uppercase leading-none">
                    {state.evidence.length}/4 улик
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--fg-muted)]">
                    {state.secrets.length} секретов · {state.completed.length} этапов
                  </p>
                </div>
                <Stamp tone="acid" rotate={4} className="ml-auto self-start">
                  01:03
                </Stamp>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--fg-muted)]">материалы дела</p>
                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--fg-muted)]/60">
                  {state.completed.length}/{SCREENS.length - 2}
                </span>
              </div>

              <nav className="mt-2 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {SCREENS.filter((screen) => !screen.hidden || (screen.id === 'epilogue' && state.finalResponse) || (screen.id === 'secret' && state.evidence.length >= 2)).map((screen) => {
                  const unlocked = isScreenUnlocked(screen.id, state)
                  const done = state.completed.includes(screen.id)
                  const reason = lockReason(screen.id, state)
                  return (
                    <button
                      key={screen.id}
                      type="button"
                      onClick={() => go(screen.path, unlocked, reason)}
                      className={cn(
                        'group flex w-full items-center gap-3 py-3 text-left transition-colors',
                        unlocked ? 'hover:text-[var(--accent)]' : 'opacity-55',
                      )}
                    >
                      <span className="w-6 shrink-0 font-mono text-[9px] text-[var(--fg-muted)]">{screen.chapter}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[11px] uppercase tracking-[0.08em]">
                          {screen.menuTitle}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-[var(--fg-muted)]">
                          {done ? 'завершено' : unlocked ? 'доступно' : 'закрыто'}
                        </span>
                      </span>
                      {done ? (
                        <Check className="size-3.5 shrink-0 text-[var(--accent)]" />
                      ) : unlocked ? (
                        <ChevronRight className="size-3.5 shrink-0 text-[var(--fg-muted)]" />
                      ) : (
                        <Lock className="size-3 shrink-0 text-[var(--fg-muted)]" />
                      )}
                    </button>
                  )
                })}
              </nav>

              <div className="mt-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--fg-muted)]">радиорубка</p>
                <div className="mt-2 border border-[var(--line)] bg-[var(--bg)]/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em]">
                        {audio.currentTrack.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--fg-muted)]">{audio.currentTrack.mood}</p>
                    </div>
                    <button
                      type="button"
                      onClick={audio.toggle}
                      className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--accent)]"
                      aria-label={audio.enabled ? 'Выключить звук' : 'Включить звук'}
                    >
                      {audio.enabled && !audio.muted ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={audio.volume}
                      onChange={(event) => audio.setVolume(Number(event.target.value))}
                      className="range-acid h-1 w-full"
                      aria-label="Громкость"
                    />
                    <span className="w-8 text-right font-mono text-[9px] text-[var(--fg-muted)]">
                      {Math.round(audio.volume * 100)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate('/radio')
                    }}
                    className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-4"
                  >
                    Открыть все треки
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--fg-muted)]">система</p>
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex w-full items-center justify-between gap-3 border-b border-[var(--line)] py-3 text-left text-[var(--fg)]"
                >
                  <span className="flex items-center gap-2 text-sm">
                    {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                    Тема: {theme === 'dark' ? 'ночной архив' : 'бумажное дело'}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">сменить</span>
                </button>

                {confirmReset ? (
                  <div className="mt-3 border border-[var(--stamp)]/40 bg-[var(--stamp)]/5 p-3">
                    <p className="text-[11px] leading-relaxed text-[var(--fg-muted)]">
                      Сбросить локальный прогресс? Финальный ответ, уже отправленный на сервер, останется в архиве.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          state.resetGame()
                          setConfirmReset(false)
                          onClose()
                          navigate('/incident')
                          showToast('Дело очищено. Можно начать заново.', 'warning')
                        }}
                        className="border border-[var(--stamp)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--stamp)]"
                      >
                        Сбросить
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="border border-[var(--line)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)]"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="flex w-full items-center gap-2 py-3 text-left text-[11px] text-[var(--fg-muted)] hover:text-[var(--stamp)]"
                  >
                    <RotateCcw className="size-3.5" />
                    Сбросить прогресс
                  </button>
                )}
              </div>

              <p className="mt-6 border-t border-[var(--line)] pt-4 font-mono text-[8px] uppercase leading-relaxed tracking-[0.14em] text-[var(--fg-muted)]/60">
                {APP_CONFIG.demoMode
                  ? 'демо-режим: данные хранятся на устройстве'
                  : 'канал защищён: подпись telegram initData'}
              </p>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

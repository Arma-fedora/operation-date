import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, Radio, ShieldCheck } from 'lucide-react'
import { APP_CONFIG, SCREEN_BY_ID } from '../config/app.config'
import { useToast } from '../app/providers/ToastProvider'
import { useGameStore } from '../store/gameStore'
import { latestAvailableScreen } from '../utils/conditions'
import { haptic, requestFullscreen } from '../services/telegram/telegram'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Typewriter } from '../components/fx/Typewriter'
import { GlitchText } from '../components/fx/Reveal'
import { cn } from '../utils'

export function BootPage() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const state = useGameStore()
  const completeScreen = useGameStore((store) => store.completeScreen)
  const discoverSecret = useGameStore((store) => store.discoverSecret)
  const { showToast } = useToast()
  const [ready, setReady] = useState(false)
  const [clicks, setClicks] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), reduced ? 200 : 2200)
    return () => window.clearTimeout(timer)
  }, [reduced])

  const hasProgress =
    state.completed.length > 0 || state.evidence.length > 0 || Boolean(state.finalResponse)
  const resumeId = state.currentScreen !== 'boot' ? state.currentScreen : latestAvailableScreen(state)
  const resumeScreen = SCREEN_BY_ID[resumeId]

  const start = (target = '/incident') => {
    haptic('success')
    requestFullscreen()
    completeScreen('boot')
    navigate(target)
  }

  const onClockClick = () => {
    const next = clicks + 1
    setClicks(next)
    if (next === 3 && !state.secrets.includes('boot-signal')) {
      discoverSecret('boot-signal')
      haptic('success')
      showToast('Секрет: сигнал пришёл изнутри архива. Кто-то очень старался.', 'secret')
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[16%] size-[70vmin] -translate-x-1/2 rounded-full border border-[var(--accent)]/10" />
        <div className="absolute left-1/2 top-[16%] size-[52vmin] -translate-x-1/2 rounded-full border border-dashed border-[var(--line-strong)]/50" />
        <div className="absolute left-1/2 top-[16%] size-[34vmin] -translate-x-1/2 rounded-full bg-[var(--accent)]/[0.035] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--accent)]/30" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
          <Radio className="size-3.5 text-[var(--accent)] animate-pulse-soft" />
          архив·13 / входящий канал
        </div>
        <Stamp tone="acid" rotate={2}>
          signal 01:03
        </Stamp>
      </div>

      <div className="flex flex-1 flex-col justify-center py-10">
        <motion.button
          type="button"
          onClick={onClockClick}
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="group self-start text-left"
          aria-label="Часы 01:03. Нажмите три раза, если любопытно."
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-[var(--stamp)]">неопознанный сигнал</p>
          <p className="mt-2 font-display text-[clamp(4.6rem,24vw,9rem)] leading-[0.78] tracking-[-0.08em] text-[var(--fg)] transition-colors group-active:text-[var(--accent)]">
            01:03
          </p>
          <span className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            <span className="size-1.5 rounded-full bg-[var(--stamp)] animate-pulse-soft" />
            время остановилось
          </span>
        </motion.button>

        <div className="mt-8 max-w-[440px] border-l border-[var(--accent)]/40 pl-4">
          <h1 className="font-display text-[clamp(1.6rem,7vw,2.5rem)] uppercase leading-[0.94] tracking-[-0.035em]">
            <GlitchText>Сигнал перехвачен</GlitchText>
          </h1>
          <div className="mt-4 space-y-1.5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-[var(--fg-muted)]">
            <Typewriter text="> объект: АЛЕКСАНДРА" speed={26} startDelay={450} cursor={false} />
            <Typewriter text="> статус: не в курсе" speed={24} startDelay={1100} cursor={false} />
            <Typewriter text="> рекомендация: открыть дело №0103" speed={18} startDelay={1750} cursor={false} />
          </div>
        </div>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <Button
          size="lg"
          full
          className={cn('justify-between', !ready && 'pointer-events-none')}
          onClick={() => start(hasProgress ? resumeScreen.path : '/incident')}
          icon={<Radio className="size-4" />}
        >
          <span className="flex-1 text-left">
            {hasProgress ? `Продолжить: ${resumeScreen.menuTitle}` : 'Открыть дело №0103'}
          </span>
          <ChevronRight className="size-4" />
        </Button>
        {hasProgress ? (
          <button
            type="button"
            onClick={() => start('/incident')}
            className="w-full py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
          >
            вернуться к началу происшествия
          </button>
        ) : null}
        <div className="flex items-start gap-2 border-t border-[var(--line)] pt-3">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--accent)]" />
          <p className="text-[10px] leading-relaxed text-[var(--fg-muted)]">
            Это вымышленное расследование. Приложение не читает переписки, не запрашивает геолокацию и не следит за
            тобой. Только сюжет, музыка и один конверт.
          </p>
        </div>
        <p className="text-center font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--fg-muted)]/50">
          {APP_CONFIG.title} · версия {APP_CONFIG.version}
        </p>
      </motion.div>
    </div>
  )
}

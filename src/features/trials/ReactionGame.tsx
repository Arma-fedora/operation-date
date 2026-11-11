import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Bird, Check, Play, RotateCcw, Timer } from 'lucide-react'
import { REACTION_CONFIG } from '../../config/trials.config'
import { useGameStore } from '../../store/gameStore'
import { haptic } from '../../services/telegram/telegram'
import { Button } from '../../components/ui/Button'
import { Tag } from '../../components/ui/Tag'
import { cn } from '../../utils'

type Phase = 'idle' | 'waiting' | 'target' | 'done'

interface Spot {
  x: number
  y: number
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function ReactionGame() {
  const progress = useGameStore((state) => state.trials)
  const setTrialResult = useGameStore((state) => state.setTrialResult)
  const [phase, setPhase] = useState<Phase>('idle')
  const [round, setRound] = useState(0)
  const [spot, setSpot] = useState<Spot>({ x: 45, y: 42 })
  const [times, setTimes] = useState<number[]>([])
  const [misses, setMisses] = useState(0)
  const [message, setMessage] = useState(REACTION_CONFIG.beforeStart)
  const startAt = useRef(0)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }

  useEffect(() => clearTimers, [])

  const finish = (nextTimes: number[], nextMisses: number) => {
    clearTimers()
    setPhase('done')
    const best = nextTimes.length ? Math.min(...nextTimes) : 0
    setTrialResult({
      reactionDone: true,
      reactionRuns: progress.reactionRuns + 1,
      reactionBest: progress.reactionBest > 0 ? Math.min(progress.reactionBest, best || progress.reactionBest) : best,
    })
    setMessage(
      best > 0
        ? `Лучший результат: ${best} мс. ${nextMisses > 0 ? `Промахов: ${nextMisses}.` : 'Ни одного промаха.'} Палыч уважительно кивнул.`
        : REACTION_CONFIG.done,
    )
    haptic('success')
  }

  const nextRound = (nextTimes: number[], nextMisses: number, nextRoundNumber: number) => {
    if (nextRoundNumber > REACTION_CONFIG.rounds) {
      finish(nextTimes, nextMisses)
      return
    }
    setRound(nextRoundNumber)
    setPhase('waiting')
    setMessage(REACTION_CONFIG.waiting)
    const delay = randomBetween(REACTION_CONFIG.minDelay, REACTION_CONFIG.maxDelay)
    timers.current.push(
      window.setTimeout(() => {
        setSpot({ x: randomBetween(14, 82), y: randomBetween(18, 76) })
        startAt.current = performance.now()
        setPhase('target')
        setMessage('Палыч здесь. Нажмите на него.')
        haptic('light')
        timers.current.push(
          window.setTimeout(() => {
            haptic('error')
            setMessage(REACTION_CONFIG.miss)
            const updatedMisses = nextMisses + 1
            setMisses(updatedMisses)
            setPhase('waiting')
            timers.current.push(
              window.setTimeout(() => nextRound(nextTimes, updatedMisses, nextRoundNumber + 1), 800),
            )
          }, REACTION_CONFIG.windowMs),
        )
      }, delay),
    )
  }

  const start = () => {
    clearTimers()
    setTimes([])
    setMisses(0)
    setPhase('waiting')
    setMessage(REACTION_CONFIG.waiting)
    haptic('selection')
    nextRound([], 0, 1)
  }

  const catchPigeon = () => {
    if (phase === 'waiting') {
      setMessage(REACTION_CONFIG.early)
      haptic('error')
      return
    }
    if (phase !== 'target') return
    const elapsed = Math.max(1, Math.round(performance.now() - startAt.current))
    const nextTimes = [...times, elapsed]
    clearTimers()
    setTimes(nextTimes)
    setMessage(`${REACTION_CONFIG.hit} ${elapsed} мс.`)
    setPhase('waiting')
    haptic('success')
    timers.current.push(
      window.setTimeout(() => nextRound(nextTimes, misses, round + 1), 750),
    )
  }

  const best = times.length ? Math.min(...times) : 0
  const priorBest = progress.reactionBest

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] leading-relaxed text-[var(--fg-muted)]">{REACTION_CONFIG.beforeStart}</p>
        <div className="flex items-center gap-2">
          {priorBest > 0 ? <Tag tone="gold">рекорд {priorBest} мс</Tag> : null}
          <Tag tone="acid">
            <Timer className="size-3" /> {REACTION_CONFIG.rounds} раунда
          </Tag>
        </div>
      </div>

      <div
        className="relative mt-4 aspect-[4/3] overflow-hidden border border-[var(--line-strong)] bg-[#0b0f0c] sm:aspect-[16/9]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(200,243,106,0.08), transparent 40%), repeating-linear-gradient(0deg, rgba(236,228,210,0.05) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, rgba(236,228,210,0.05) 0 1px, transparent 1px 28px)',
        }}
      >
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.18em] text-white/40">
          <span>архив · тренировочный полигон</span>
          <span>раунд {Math.min(REACTION_CONFIG.rounds, Math.max(1, round))}/{REACTION_CONFIG.rounds}</span>
        </div>

        {phase === 'idle' || phase === 'done' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-5 text-center">
            <span className="grid size-16 place-items-center rounded-full border border-dashed border-[var(--accent)]/40 text-[var(--accent)]">
              <Bird className="size-7" />
            </span>
            <div>
              <p className="font-display text-xl uppercase leading-none">
                {phase === 'done' ? 'Проверка завершена' : 'Палыч готов'}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[11px] leading-relaxed text-[var(--fg-muted)]">{message}</p>
            </div>
            <Button onClick={start} icon={phase === 'done' ? <RotateCcw className="size-4" /> : <Play className="size-4" />}>
              {phase === 'done' ? 'Пройти ещё раз' : 'Начать проверку'}
            </Button>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 grid place-items-center p-5">
              <div className="text-center">
                <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-[var(--fg-muted)]">
                  {message}
                </p>
                {best > 0 ? (
                  <p className="mt-3 font-display text-3xl uppercase text-[var(--accent)]">{best} мс</p>
                ) : null}
              </div>
            </div>
            {phase === 'waiting' ? (
              <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
                {[0, 1, 2].map((item) => (
                  <motion.span
                    key={item}
                    className="absolute size-2 rounded-full bg-[var(--gold)]"
                    initial={{ opacity: 0.15 }}
                    animate={{ opacity: [0.1, 0.5, 0.1] }}
                    transition={{ duration: 1.6, delay: item * 0.4, repeat: Infinity }}
                    style={{ left: `${20 + item * 29}%`, top: `${30 + ((item * 23) % 40)}%` }}
                  />
                ))}
              </div>
            ) : (
              <motion.button
                type="button"
                onClick={catchPigeon}
                initial={{ scale: 0.3, rotate: -18, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                className="absolute grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)] shadow-[0_0_40px_rgba(199,161,92,0.35)] focus-visible:outline-none"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                aria-label="Поймать голубя"
              >
                <Bird className="size-8" />
                <span className="absolute -bottom-6 whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.16em] text-[var(--gold)]/70">
                  нажми
                </span>
              </motion.button>
            )}
          </>
        )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">
          <span className={cn(phase === 'target' && 'text-[var(--stamp)]')}>
            {phase === 'target' ? 'цель в кадре' : phase === 'waiting' ? 'ожидание' : 'канал стабилен'}
          </span>
          <span className="flex items-center gap-1">
            <Check className="size-3" /> попадания {times.length}/{REACTION_CONFIG.rounds}
          </span>
        </div>
      </div>

      {times.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {times.map((time, index) => (
            <Tag key={`${time}-${index}`} tone="acid">
              попытка {index + 1}: {time} мс
            </Tag>
          ))}
          {misses ? <Tag tone="red">промахов: {misses}</Tag> : null}
        </div>
      ) : null}

      <div className="mt-3 flex items-start gap-2 border border-[var(--line)] bg-[var(--bg)]/40 p-3 text-[11px] leading-relaxed text-[var(--fg-muted)]">
        <Bird className="mt-0.5 size-4 shrink-0 text-[var(--gold)]" />
        Палыч не пострадал. Палыч никогда не страдает. Он просто появляется в следующий раз в другом месте.
      </div>
    </div>
  )
}

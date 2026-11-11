import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { RotateCcw, Sparkles } from 'lucide-react'
import { WHEEL_OPTIONS } from '../../config/trials.config'
import { useGameStore } from '../../store/gameStore'
import { haptic } from '../../services/telegram/telegram'
import { Button } from '../../components/ui/Button'
import { Tag } from '../../components/ui/Tag'
import { Stamp } from '../../components/ui/Stamp'

const SEGMENT = 360 / WHEEL_OPTIONS.length

export function WheelOfLeisure() {
  const reduced = useReducedMotion()
  const trials = useGameStore((state) => state.trials)
  const setTrialResult = useGameStore((state) => state.setTrialResult)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [pending, setPending] = useState<number | null>(null)
  const [result, setResult] = useState<string | undefined>(trials.wheelResult)
  const [spins, setSpins] = useState(0)

  const segmentGradient = useMemo(() => {
    const stops = WHEEL_OPTIONS.map((_, index) => {
      const color = index % 2 === 0 ? 'var(--bg-soft)' : 'var(--bg-elev)'
      return `${color} ${index * SEGMENT}deg ${(index + 1) * SEGMENT}deg`
    })
    return `conic-gradient(from -${SEGMENT / 2}deg, ${stops.join(', ')})`
  }, [])

  const spin = () => {
    if (spinning) return
    const index = Math.floor(Math.random() * WHEEL_OPTIONS.length)
    setPending(index)
    setSpinning(true)
    setResult(undefined)
    setRotation((current) => {
      const normalized = ((current % 360) + 360) % 360
      const landing = (360 - index * SEGMENT - normalized) % 360
      return current + 360 * 4 + landing
    })
    setSpins((value) => value + 1)
    haptic('selection')
  }

  const finish = () => {
    if (!spinning || pending === null) return
    const option = WHEEL_OPTIONS[pending]
    setSpinning(false)
    setResult(option.id)
    setTrialResult({ wheelDone: true, wheelResult: option.id })
    haptic('success')
  }

  const selected = WHEEL_OPTIONS.find((option) => option.id === result)

  return (
    <div>
      <p className="text-[13px] leading-relaxed text-[var(--fg-muted)]">
        Колесо не решает за вас. Оно просто напоминает, что вариантов больше, чем кажется в 01:03. Результат можно
        учитывать, а можно игнорировать — архив не обидится.
      </p>

      <div className="mt-5 flex flex-col items-center">
        <div className="relative">
          <div className="absolute left-1/2 top-[-10px] z-10 size-0 -translate-x-1/2 border-x-[9px] border-t-[16px] border-x-transparent border-t-[var(--stamp)]" />
          <motion.div
            className="relative grid size-[248px] place-items-center rounded-full border-2 border-[var(--line-strong)] shadow-[inset_0_0_40px_rgba(0,0,0,0.4)] sm:size-[280px]"
            style={{ background: segmentGradient }}
            animate={{ rotate: rotation }}
            transition={{ duration: reduced ? 0.01 : 3.2, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={finish}
          >
            {WHEEL_OPTIONS.map((option, index) => {
              const angle = index * SEGMENT
              return (
                <span
                  key={option.id}
                  className="absolute font-mono text-[9px] font-semibold text-[var(--fg-muted)]"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-92px) rotate(${-angle}deg)`,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              )
            })}
            <div className="absolute grid size-[104px] place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--bg)] text-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:size-[116px]">
              <div className="px-3">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">план Б</p>
                <p className="mt-1 font-display text-lg uppercase leading-none text-[var(--accent)]">01:03</p>
              </div>
            </div>
          </motion.div>
        </div>

        <Button
          full
          className="mt-5 max-w-xs"
          onClick={spin}
          disabled={spinning}
          icon={<Sparkles className="size-4" />}
        >
          {spinning ? 'Колесо думает…' : spins > 0 || selected ? 'Крутить ещё' : 'Запустить колесо'}
        </Button>
      </div>

      {selected ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 border border-[var(--gold)]/40 bg-[var(--gold)]/[0.04] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--gold)]">колесо выбрало</p>
              <h3 className="mt-1 font-display text-xl uppercase leading-none">{selected.label}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--fg-muted)]">{selected.note}</p>
            </div>
            <Stamp tone="gold" rotate={4}>
              {selected.stamp}
            </Stamp>
          </div>
        </motion.div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {WHEEL_OPTIONS.map((option, index) => (
          <div
            key={option.id}
            className="flex items-center gap-2 border border-[var(--line)] bg-[var(--bg)]/40 px-2 py-1.5"
          >
            <span className="font-mono text-[8px] text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>
            <span className="truncate text-[10px] text-[var(--fg-muted)]">{option.label}</span>
          </div>
        ))}
      </div>

      {trials.wheelDone && selected ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            результат сохранён в деле
          </p>
          <Button variant="ghost" size="sm" onClick={spin} disabled={spinning} icon={<RotateCcw className="size-3.5" />}>
            перекрутить
          </Button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Tag tone="gold">необязательно</Tag>
        <Tag>план Б не обязан быть умным</Tag>
        <Tag>можно игнорировать</Tag>
      </div>
    </div>
  )
}

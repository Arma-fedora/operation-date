import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Check, GripVertical, Info } from 'lucide-react'
import { CHRONOLOGY, PUZZLES } from '../../../config/puzzles.config'
import { Button } from '../../../components/ui/Button'
import { usePuzzleSolver } from '../usePuzzleSolver'
import { PuzzleSolved } from '../PuzzleSolved'

const SHUFFLED = ['printer', 'lights', 'envelope', 'clock']

export function ChronologyPuzzle({ onSolved }: { onSolved?: () => void }) {
  const definition = PUZZLES.chronology
  const solver = usePuzzleSolver(definition, onSolved)
  const [order, setOrder] = useState<string[]>(SHUFFLED)

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= order.length) return
    setOrder((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    solver.clearWrong()
  }

  const submit = () => {
    const correct = order.every((id, index) => id === CHRONOLOGY.correctOrder[index])
    solver.submitAnswer(correct)
  }

  if (solver.progress.solved) return <PuzzleSolved definition={definition} />

  return (
    <div>
      <p className="text-[13px] leading-relaxed text-[var(--fg-muted)]">{definition.description}</p>

      <div className="mt-4 border border-[var(--line)] bg-[var(--bg)]/50 p-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--accent)]">показания детектора</p>
        <ul className="mt-2 space-y-1.5">
          {CHRONOLOGY.clues.map((clue) => (
            <li key={clue} className="flex gap-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--accent)]" />
              {clue}
            </li>
          ))}
        </ul>
      </div>

      <motion.div key={solver.shake} animate={{ x: solver.shake ? [0, -6, 6, -3, 0] : 0 }} className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {order.map((id, index) => {
            const event = CHRONOLOGY.events.find((item) => item.id === id)
            if (!event) return null
            return (
              <motion.div
                layout
                key={id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 border border-[var(--line)] bg-[var(--bg-elev)] p-2.5"
              >
                <GripVertical className="size-4 shrink-0 text-[var(--fg-muted)]/50" />
                <span className="grid size-6 shrink-0 place-items-center border border-[var(--line)] font-mono text-[10px] text-[var(--accent)]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-tight text-[var(--fg)]">{event.label}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--fg-muted)]">{event.note}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`Поднять «${event.label}»`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="grid size-8 place-items-center border border-[var(--line)] text-[var(--fg-muted)] disabled:opacity-25"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Опустить «${event.label}»`}
                    disabled={index === order.length - 1}
                    onClick={() => move(index, 1)}
                    className="grid size-8 place-items-center border border-[var(--line)] text-[var(--fg-muted)] disabled:opacity-25"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {solver.wrongMessage ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-start gap-2 border border-[var(--stamp)]/30 bg-[var(--stamp)]/5 p-2.5 text-[11px] leading-relaxed text-[var(--stamp)]"
          >
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {solver.wrongMessage}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <Button full className="mt-4" onClick={submit} icon={<Check className="size-4" />}>
        Проверить хронологию
      </Button>

      <div className="mt-4 border-t border-[var(--line)] pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            подсказки: {solver.progress.hintsUsed}/3
          </p>
          <button
            type="button"
            onClick={solver.revealHint}
            disabled={solver.progress.hintsUsed >= 3}
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)] disabled:opacity-40"
          >
            {solver.nextHint ? 'открыть подсказку' : 'все подсказки открыты'}
          </button>
        </div>
        <div className="mt-2 space-y-1.5">
          {solver.hints.map((hint, index) => (
            <p key={hint} className="border-l border-[var(--accent)]/40 pl-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
              <span className="mr-1 font-mono text-[9px] text-[var(--accent)]">0{index + 1}</span> {hint}
            </p>
          ))}
        </div>
        {solver.canAcceptHelp ? (
          <button
            type="button"
            onClick={solver.acceptHelp}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-[var(--line-strong)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Info className="size-3" /> принять помощь инспектора
          </button>
        ) : null}
      </div>
    </div>
  )
}

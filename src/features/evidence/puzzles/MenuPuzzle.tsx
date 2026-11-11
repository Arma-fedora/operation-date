import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Utensils } from 'lucide-react'
import { MENU, PUZZLES } from '../../../config/puzzles.config'
import { Button } from '../../../components/ui/Button'
import { usePuzzleSolver } from '../usePuzzleSolver'
import { PuzzleSolved } from '../PuzzleSolved'
import { PuzzleHints } from '../PuzzleHints'
import { cn } from '../../../utils'

export function MenuPuzzle({ onSolved }: { onSolved?: () => void }) {
  const definition = PUZZLES.menu
  const solver = usePuzzleSolver(definition, onSolved)
  const [selected, setSelected] = useState<string>('')

  if (solver.progress.solved) return <PuzzleSolved definition={definition} />

  const submit = () => {
    if (!selected) return
    solver.submitAnswer(selected === MENU.answer)
  }

  return (
    <div>
      <p className="text-[13px] leading-relaxed text-[var(--fg-muted)]">{definition.description}</p>

      <div className="mt-4 border border-[#171410]/15 bg-[var(--paper)] p-5 text-[var(--paper-ink)]">
        <div className="flex items-center justify-between border-b border-[#171410]/15 pb-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] opacity-50">ночное кафе · меню</p>
            <h3 className="mt-1 font-display text-lg uppercase leading-none">После 01:00</h3>
          </div>
          <Utensils className="size-4 opacity-35" />
        </div>

        <div className="mt-4 space-y-2">
          {MENU.clues.map((clue, index) => (
            <p key={clue} className="flex gap-2 text-[12px] leading-relaxed">
              <span className="font-mono text-[9px] opacity-45">0{index + 1}</span>
              {clue}
            </p>
          ))}
        </div>

        <div className="mt-5 border-t border-[#171410]/15 pt-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] opacity-55">что подали вторым?</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {MENU.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelected(option.id)
                  solver.clearWrong()
                }}
                className={cn(
                  'border px-2 py-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors',
                  selected === option.id
                    ? 'border-[#171410] bg-[#171410] text-[#ece4d2]'
                    : 'border-[#171410]/25 hover:border-[#171410]/60',
                )}
                aria-pressed={selected === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {solver.wrongMessage ? (
        <motion.p
          key={solver.shake}
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
          className="mt-3 border-l border-[var(--stamp)]/60 pl-2 text-[11px] leading-relaxed text-[var(--stamp)]"
        >
          {solver.wrongMessage}
        </motion.p>
      ) : null}

      <Button full className="mt-4" onClick={submit} disabled={!selected} icon={<Check className="size-4" />}>
        Подтвердить выбор
      </Button>

      <PuzzleHints
        hints={solver.hints}
        hintsUsed={solver.progress.hintsUsed}
        nextHint={solver.nextHint}
        onHint={solver.revealHint}
        canAcceptHelp={solver.canAcceptHelp}
        onAcceptHelp={solver.acceptHelp}
      />
    </div>
  )
}

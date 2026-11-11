import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Info, Search } from 'lucide-react'
import { PHOTO, PUZZLES } from '../../../config/puzzles.config'
import { usePuzzleSolver } from '../usePuzzleSolver'
import { PuzzleSolved } from '../PuzzleSolved'
import { PuzzleHints } from '../PuzzleHints'
import { DeskScene } from './DeskScene'
import { cn } from '../../../utils'

export function PhotoPuzzle({ onSolved }: { onSolved?: () => void }) {
  const definition = PUZZLES.photo
  const solver = usePuzzleSolver(definition, onSolved)
  const [found, setFound] = useState<string[]>(() =>
    solver.progress.solved ? PHOTO.hotspots.filter((item) => item.correct).map((item) => item.id) : [],
  )
  const [quip, setQuip] = useState('')

  if (solver.progress.solved) return <PuzzleSolved definition={definition} />

  const inspect = (id: string) => {
    const hotspot = PHOTO.hotspots.find((item) => item.id === id)
    if (!hotspot || found.includes(id)) return
    if (hotspot.correct) {
      const next = [...found, id]
      setFound(next)
      setQuip(hotspot.quip)
      if (next.length === PHOTO.hotspots.filter((item) => item.correct).length) {
        solver.submitAnswer(true)
      }
    } else {
      setQuip(hotspot.quip)
      solver.submitAnswer(false)
    }
  }

  return (
    <div>
      <p className="text-[13px] leading-relaxed text-[var(--fg-muted)]">{definition.description}</p>

      <div className="relative mt-4 overflow-hidden border border-[var(--line-strong)] bg-black">
        <DeskScene />
        {PHOTO.hotspots.map((hotspot) => {
          const isFound = found.includes(hotspot.id)
          const showPulse = solver.progress.hintsUsed >= 2 && hotspot.correct && !isFound
          return (
            <button
              key={hotspot.id}
              type="button"
              onClick={() => inspect(hotspot.id)}
              aria-label={`Осмотреть: ${hotspot.label}`}
              title={hotspot.label}
              className={cn(
                'absolute grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-transparent transition-colors hover:border-[var(--accent)]/70 hover:bg-[var(--accent)]/10 focus-visible:border-[var(--accent)] focus-visible:bg-[var(--accent)]/10',
                isFound && 'border-[var(--stamp)] bg-[var(--stamp)]/15',
              )}
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            >
              {isFound ? (
                <span className="grid size-5 place-items-center rounded-full border border-[var(--stamp)] bg-black/70 text-[var(--stamp)]">
                  <Check className="size-3" />
                </span>
              ) : showPulse ? (
                <span className="size-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_6px_rgba(200,243,106,0.18)] animate-pulse-soft" />
              ) : null}
            </button>
          )
        })}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 font-mono text-[8px] uppercase tracking-[0.16em] text-white/50">
          <span>архив · снимок 0103</span>
          <span className="flex items-center gap-1">
            <Search className="size-3" /> найдено {found.length}/3
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {quip ? (
          <motion.p
            key={quip}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-start gap-2 border border-[var(--line)] bg-[var(--bg)]/60 p-2.5 font-mono text-[10px] leading-relaxed uppercase tracking-[0.06em] text-[var(--fg-muted)]"
          >
            <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--accent)]" />
            {quip}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {solver.wrongMessage ? (
        <p className="mt-2 border-l border-[var(--stamp)]/60 pl-2 text-[11px] leading-relaxed text-[var(--stamp)]">
          {solver.wrongMessage}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between border border-[var(--line)] px-3 py-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">осмотрено деталей</span>
        <span className="font-mono text-[11px] text-[var(--accent)]">{found.length}/3</span>
      </div>

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

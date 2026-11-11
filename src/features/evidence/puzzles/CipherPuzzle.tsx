import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Search } from 'lucide-react'
import { CIPHER, PUZZLES } from '../../../config/puzzles.config'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Field'
import { usePuzzleSolver } from '../usePuzzleSolver'
import { PuzzleSolved } from '../PuzzleSolved'
import { PuzzleHints } from '../PuzzleHints'

const normalize = (value: string) =>
  value
    .toUpperCase()
    .replaceAll('Ё', 'Е')
    .replace(/[^А-ЯA-Z]/g, '')

export function CipherPuzzle({ onSolved }: { onSolved?: () => void }) {
  const definition = PUZZLES.cipher
  const solver = usePuzzleSolver(definition, onSolved)
  const [value, setValue] = useState('')

  if (solver.progress.solved) return <PuzzleSolved definition={definition} />

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (!value.trim()) return
    solver.submitAnswer(normalize(value) === normalize(CIPHER.answer))
  }

  return (
    <form onSubmit={submit}>
      <p className="text-[13px] leading-relaxed text-[var(--fg-muted)]">{definition.description}</p>

      <div className="relative mt-4 overflow-hidden border border-[var(--line-strong)] bg-[var(--paper)] p-5 text-[var(--paper-ink)]">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #171410 0 1px, transparent 1px 5px)' }} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] opacity-50">оборот документа · 0103</span>
            <KeyRound className="size-4 opacity-30" />
          </div>
          <p className="mt-5 text-center font-mono text-[clamp(1.4rem,8vw,2.1rem)] tracking-[0.18em]">{CIPHER.encoded}</p>
          <div className="mt-4 grid grid-cols-5 gap-1 border-t border-[#171410]/15 pt-3 text-center font-mono text-[9px] opacity-55">
            {['А=1', 'Б=2', 'В=3', 'Г=4', 'Д=5'].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-[0.16em] opacity-40">
            и так далее, пока архив не устанет
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">
            <Search className="size-3.5" /> расшифрованное слово
          </span>
          <Input
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              solver.clearWrong()
            }}
            placeholder="Введите слово…"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="text-center text-lg tracking-[0.2em] uppercase"
            aria-label="Расшифрованное слово"
          />
        </label>
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

      <Button type="submit" full className="mt-4" icon={<KeyRound className="size-4" />}>
        Применить шифр
      </Button>

      <PuzzleHints
        hints={solver.hints}
        hintsUsed={solver.progress.hintsUsed}
        nextHint={solver.nextHint}
        onHint={solver.revealHint}
        canAcceptHelp={solver.canAcceptHelp}
        onAcceptHelp={solver.acceptHelp}
      />
    </form>
  )
}

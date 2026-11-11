import { Info } from 'lucide-react'

export function PuzzleHints({
  hints,
  hintsUsed,
  nextHint,
  onHint,
  canAcceptHelp,
  onAcceptHelp,
}: {
  hints: string[]
  hintsUsed: number
  nextHint?: string
  onHint: () => void
  canAcceptHelp: boolean
  onAcceptHelp: () => void
}) {
  return (
    <div className="mt-4 border-t border-[var(--line)] pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
          подсказки: {hintsUsed}/3
        </p>
        <button
          type="button"
          onClick={onHint}
          disabled={hintsUsed >= 3}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)] disabled:opacity-40"
        >
          {nextHint ? 'открыть подсказку' : 'все подсказки открыты'}
        </button>
      </div>
      <div className="mt-2 space-y-1.5">
        {hints.map((hint, index) => (
          <p key={hint} className="border-l border-[var(--accent)]/40 pl-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
            <span className="mr-1 font-mono text-[9px] text-[var(--accent)]">0{index + 1}</span> {hint}
          </p>
        ))}
      </div>
      {canAcceptHelp ? (
        <button
          type="button"
          onClick={onAcceptHelp}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-dashed border-[var(--line-strong)] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Info className="size-3" /> принять помощь инспектора
        </button>
      ) : null}
    </div>
  )
}

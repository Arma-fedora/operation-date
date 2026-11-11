import { Check, FileCheck2 } from 'lucide-react'
import type { PuzzleDefinition } from '../../types/config'

export function PuzzleSolved({ definition }: { definition: PuzzleDefinition }) {
  return (
    <div className="rounded-[2px] border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--accent)]/50 text-[var(--accent)]">
          <Check className="size-5" />
        </span>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--accent)]">улика приобщена</p>
          <h3 className="mt-1 font-display text-base uppercase leading-tight">{definition.evidenceTitle}</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--fg-muted)]">{definition.evidenceNote}</p>
          <p className="mt-2 border-l border-[var(--accent)]/40 pl-2 text-[11px] leading-relaxed text-[var(--accent)]">
            {definition.successText}
          </p>
        </div>
        <FileCheck2 className="ml-auto size-4 shrink-0 text-[var(--accent)]/40" />
      </div>
    </div>
  )
}

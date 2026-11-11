import type { ReactNode } from 'react'
import { cn } from '../../utils'

export function Tag({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'acid' | 'red' | 'gold'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[2px] border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em]',
        tone === 'default' && 'border-[var(--line)] text-[var(--fg-muted)]',
        tone === 'acid' && 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]',
        tone === 'red' && 'border-[var(--stamp)]/50 bg-[var(--stamp)]/10 text-[var(--stamp)]',
        tone === 'gold' && 'border-[var(--gold)]/50 bg-[var(--gold)]/10 text-[var(--gold)]',
        className,
      )}
    >
      {children}
    </span>
  )
}

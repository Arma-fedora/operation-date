import type { ReactNode } from 'react'
import { cn } from '../../utils'

export function PageHeader({
  chapter,
  eyebrow,
  title,
  description,
  right,
  className,
}: {
  chapter?: string
  eyebrow?: string
  title: string
  description?: string
  right?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('relative mb-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--fg-muted)]">
            {chapter ? <span className="text-[var(--accent)]">дело {chapter}</span> : null}
            {chapter && eyebrow ? <span className="h-px w-5 bg-[var(--line-strong)]" /> : null}
            {eyebrow ? <span className="truncate">{eyebrow}</span> : null}
          </div>
          <h1 className="mt-2 font-display text-[clamp(1.65rem,7vw,2.4rem)] uppercase leading-[0.94] tracking-[-0.03em] text-[var(--fg)]">
            {title}
          </h1>
        </div>
        {right ? <div className="shrink-0 pt-1">{right}</div> : null}
      </div>
      {description ? (
        <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-[var(--fg-muted)]">{description}</p>
      ) : null}
      <div className="mt-4 flex items-center gap-2">
        <span className="h-px flex-1 bg-[var(--line)]" />
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-muted)]/60">01:03</span>
      </div>
    </header>
  )
}

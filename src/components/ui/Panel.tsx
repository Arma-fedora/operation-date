import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'dark' | 'paper' | 'glass' | 'bare'
  label?: string
  corner?: ReactNode
}

export function Panel({ variant = 'dark', label, corner, className, children, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        'relative rounded-[3px] border',
        variant === 'dark' && 'border-[var(--line)] bg-[var(--bg-elev)]/90 text-[var(--fg)]',
        variant === 'paper' &&
          'paper-texture border-[#1b1814]/20 bg-[var(--paper)] text-[var(--paper-ink)] shadow-[0_24px_70px_-30px_rgba(0,0,0,0.85)]',
        variant === 'glass' &&
          'border-[var(--line)] bg-[var(--bg)]/70 text-[var(--fg)] backdrop-blur-md',
        variant === 'bare' && 'border-transparent bg-transparent',
        className,
      )}
      {...props}
    >
      {label ? (
        <div className="flex items-center justify-between gap-3 border-b border-current/10 px-4 py-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] opacity-60">{label}</span>
          {corner}
        </div>
      ) : null}
      {children}
    </div>
  )
}

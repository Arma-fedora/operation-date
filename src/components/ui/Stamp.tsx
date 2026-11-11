import type { ReactNode } from 'react'
import { cn } from '../../utils'

interface StampProps {
  children: ReactNode
  tone?: 'red' | 'acid' | 'gold' | 'ink'
  shape?: 'rect' | 'round'
  className?: string
  rotate?: number
}

const tones = {
  red: 'border-[var(--stamp)] text-[var(--stamp)]',
  acid: 'border-[var(--accent)] text-[var(--accent)]',
  gold: 'border-[var(--gold)] text-[var(--gold)]',
  ink: 'border-current text-current',
}

export function Stamp({ children, tone = 'red', shape = 'rect', className, rotate = -3 }: StampProps) {
  return (
    <span
      className={cn(
        'inline-flex select-none items-center justify-center border-2 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] opacity-90',
        shape === 'round' ? 'rounded-full' : 'rounded-[2px]',
        tones[tone],
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  )
}

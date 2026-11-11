import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
  size?: 'sm' | 'md'
}

export function IconButton({ label, children, className, size = 'md', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-elev)]/80 text-[var(--fg-muted)] backdrop-blur transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60',
        size === 'sm' ? 'size-8' : 'size-10',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

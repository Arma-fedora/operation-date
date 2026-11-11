import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'stamp' | 'paper' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  full?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-[var(--accent)] bg-[var(--accent)] text-[#0d0f0c] hover:shadow-[0_0_30px_-8px_var(--accent)] active:bg-[var(--accent-strong)]',
  secondary:
    'border-[var(--line-strong)] bg-[var(--bg-elev)] text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
  ghost:
    'border-transparent bg-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--line)]',
  stamp:
    'border-[var(--stamp)] bg-[var(--stamp)] text-white hover:bg-[var(--stamp-strong)] shadow-[0_10px_30px_-14px_var(--stamp)]',
  paper:
    'border-[#1b1814]/25 bg-[#ece4d2] text-[#171410] hover:bg-[#f5eddd] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)]',
  danger:
    'border-[var(--stamp)]/60 bg-transparent text-[var(--stamp)] hover:bg-[var(--stamp)]/10',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-2 text-[10px] tracking-[0.16em]',
  md: 'min-h-11 px-4 py-3 text-[11px] tracking-[0.16em]',
  lg: 'min-h-13 px-5 py-4 text-xs tracking-[0.18em]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  full = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'group relative inline-flex select-none items-center justify-center gap-2 rounded-[2px] border font-mono font-medium uppercase transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-block size-3 animate-spin rounded-full border border-current border-t-transparent" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  )
}

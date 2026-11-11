import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils'

interface FieldShellProps {
  label?: string
  hint?: string
  error?: string
  counter?: string
  children: ReactNode
}

export function FieldShell({ label, hint, error, counter, children }: FieldShellProps) {
  return (
    <label className="block">
      {(label || counter) && (
        <span className="mb-1.5 flex items-end justify-between gap-3">
          {label ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">{label}</span>
          ) : null}
          {counter ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--fg-muted)]">{counter}</span>
          ) : null}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1.5 block font-mono text-[10px] text-[var(--stamp)]">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[11px] leading-relaxed text-[var(--fg-muted)]">{hint}</span>
      ) : null}
    </label>
  )
}

const baseField =
  'w-full rounded-[2px] border border-[var(--line)] bg-[var(--bg)]/70 px-3 py-3 font-mono text-sm text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--fg-muted)]/50 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseField, 'min-h-11', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(baseField, 'min-h-28 resize-y leading-relaxed', className)} {...props} />
}

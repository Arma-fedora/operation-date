import { cn } from '../../utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
}

export function Toggle({ checked, onChange, label, hint }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-2 text-left"
    >
      <span>
        <span className="block text-sm text-[var(--fg)]">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] text-[var(--fg-muted)]">{hint}</span> : null}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors',
          checked ? 'border-[var(--accent)] bg-[var(--accent)]/20' : 'border-[var(--line)] bg-[var(--bg)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4.5 rounded-full transition-transform',
            checked ? 'translate-x-[22px] bg-[var(--accent)]' : 'translate-x-0.5 bg-[var(--fg-muted)]',
          )}
        />
      </span>
    </button>
  )
}

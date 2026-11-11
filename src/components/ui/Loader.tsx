import { LoaderCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

export function Loader({ label = 'Архив открывается…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-[var(--fg-muted)]">
      <LoaderCircle className="size-6 animate-spin text-[var(--accent)]" />
      <p className="font-mono text-[10px] uppercase tracking-[0.2em]">{label}</p>
    </div>
  )
}

export function ErrorState({
  title = 'Связь с архивом прервалась',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="border border-[var(--stamp)]/40 bg-[var(--stamp)]/5 p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--stamp)]">Ошибка канала</p>
      <h3 className="mt-2 font-display text-lg uppercase">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" icon={<RefreshCw className="size-3.5" />} onClick={onRetry}>
          Повторить
        </Button>
      ) : null}
    </div>
  )
}

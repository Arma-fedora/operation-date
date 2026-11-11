import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Operation Date crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg)] p-6 text-[var(--fg)]">
          <div className="w-full max-w-md border border-[var(--line)] bg-[var(--bg-elev)] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--stamp)]">Сбой архива</p>
            <h1 className="mt-3 font-display text-2xl uppercase">Дело приостановлено</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
              Что-то пошло не так на стороне системы. Прогресс сохранён локально. Попробуйте перезагрузить приложение.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 w-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--bg)]"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

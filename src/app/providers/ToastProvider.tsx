import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../utils'

type ToastTone = 'info' | 'success' | 'warning' | 'secret'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, string> = {
  info: 'border-[var(--line)] bg-[var(--bg-elev)] text-[var(--fg)]',
  success: 'border-[var(--accent)]/40 bg-[var(--bg-elev)] text-[var(--fg)]',
  warning: 'border-[var(--stamp)]/50 bg-[var(--bg-elev)] text-[var(--fg)]',
  secret: 'border-[var(--gold)]/60 bg-[var(--bg-elev)] text-[var(--gold)]',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.round(Math.random() * 1000)
    setToasts((current) => [...current.slice(-2), { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-[80] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className={cn(
                'pointer-events-auto max-w-[420px] rounded-sm border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur',
                toneStyles[toast.tone],
              )}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

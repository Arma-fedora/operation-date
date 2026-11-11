import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useRegisterBackHandler } from '../../app/providers/BackButtonProvider'
import { cn } from '../../utils'
import { IconButton } from './IconButton'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  position?: 'center' | 'bottom'
  wide?: boolean
  className?: string
}

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  position = 'center',
  wide = false,
  className,
}: DialogProps) {
  const titleId = useId()
  useRegisterBackHandler(onClose, open)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, open])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed inset-0 z-[100] flex bg-black/70 p-3 backdrop-blur-sm',
            position === 'center' ? 'items-center justify-center' : 'items-end justify-center',
          )}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ opacity: 0, y: position === 'bottom' ? 44 : 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'bottom' ? 30 : 10, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'relative max-h-[90dvh] w-full overflow-y-auto rounded-[4px] border border-[var(--line-strong)] bg-[var(--bg-elev)] text-[var(--fg)] shadow-[0_40px_120px_rgba(0,0,0,0.65)]',
              wide ? 'max-w-2xl' : 'max-w-md',
              position === 'bottom' && 'mb-[max(0px,env(safe-area-inset-bottom))] rounded-b-[2px]',
              className,
            )}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--bg-elev)]/95 px-4 py-3 backdrop-blur">
              <div>
                {eyebrow ? (
                  <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--accent)]">{eyebrow}</p>
                ) : null}
                {title ? (
                  <h2 id={titleId} className="mt-1 font-display text-lg uppercase tracking-tight">
                    {title}
                  </h2>
                ) : null}
              </div>
              <IconButton label="Закрыть" size="sm" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </div>
            <div className="px-4 py-4">{children}</div>
            {footer ? <div className="sticky bottom-0 border-t border-[var(--line)] bg-[var(--bg-elev)]/95 px-4 py-3 backdrop-blur">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

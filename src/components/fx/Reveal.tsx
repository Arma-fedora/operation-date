import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../utils'

export function Reveal({
  children,
  delay = 0,
  className,
  y = 14,
}: {
  children: ReactNode
  delay?: number
  className?: string
  y?: number
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

export function GlitchText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('glitch-text', className)} data-text={typeof children === 'string' ? children : undefined}>
      {children}
    </span>
  )
}

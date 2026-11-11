import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../../utils'
interface TypewriterProps {
  text: string
  speed?: number
  startDelay?: number
  className?: string
  onComplete?: () => void
  cursor?: boolean
}

export function Typewriter({
  text,
  speed = 18,
  startDelay = 0,
  className,
  onComplete,
  cursor = true,
}: TypewriterProps) {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(reduced ? text.length : 0)
  const completed = useRef(false)
  const callback = useRef(onComplete)

  useEffect(() => {
    callback.current = onComplete
  }, [onComplete])

  useEffect(() => {
    completed.current = false
    if (reduced) {
      setVisible(text.length)
      callback.current?.()
      return
    }
    setVisible(0)
    let index = 0
    let interval = 0
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1
        setVisible(index)
        if (index >= text.length) {
          window.clearInterval(interval)
          if (!completed.current) {
            completed.current = true
            callback.current?.()
          }
        }
      }, Math.max(6, speed))
    }, startDelay)

    return () => {
      window.clearTimeout(start)
      window.clearInterval(interval)
    }
  }, [reduced, speed, startDelay, text])

  return (
    <p className={cn('whitespace-pre-line', className)}>
      {text.slice(0, visible)}
      {cursor && visible < text.length ? <span className="typewriter-cursor">▌</span> : null}
    </p>
  )
}

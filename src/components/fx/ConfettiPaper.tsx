import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export function ConfettiPaper({ active, pieces = 26 }: { active: boolean; pieces?: number }) {
  const reduced = useReducedMotion()
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        id: index,
        left: `${(index * 37 + 11) % 100}%`,
        delay: (index % 9) * 0.09,
        duration: 2.8 + ((index * 7) % 18) / 10,
        rotate: ((index * 73) % 120) - 60,
        width: 8 + (index % 4) * 4,
        height: 12 + (index % 5) * 3,
        tone: index % 3,
      })),
    [pieces],
  )

  if (!active || reduced) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {items.map((item) => (
        <motion.span
          key={item.id}
          initial={{ y: '-12vh', x: 0, rotate: 0, opacity: 0 }}
          animate={{ y: '112vh', x: [0, item.rotate, -item.rotate], rotate: item.rotate * 3, opacity: [0, 1, 1, 0.8] }}
          transition={{ duration: item.duration, delay: item.delay, ease: 'easeIn' }}
          className="absolute top-0 block border border-black/10"
          style={{
            left: item.left,
            width: item.width,
            height: item.height,
            backgroundColor:
              item.tone === 0 ? 'var(--paper)' : item.tone === 1 ? 'var(--accent)' : 'var(--stamp)',
          }}
        />
      ))}
    </div>
  )
}

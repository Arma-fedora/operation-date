import { cn } from '../../utils'

export function ProgressRing({
  value,
  size = 40,
  stroke = 3,
  className,
  label,
}: {
  value: number
  size?: number
  stroke?: number
  className?: string
  label?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <span
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-label={label ?? `Прогресс ${value}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-[var(--line)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-[var(--accent)] transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute font-mono text-[8px] font-semibold tracking-tight text-[var(--fg)]">{value}%</span>
    </span>
  )
}

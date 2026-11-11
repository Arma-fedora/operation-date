import { ImageOff } from 'lucide-react'
import { cn } from '../../utils'

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash
}

const palettes = [
  ['#111a16', '#c8f36a', '#33453b'],
  ['#1b1410', '#d24a32', '#4a3127'],
  ['#121519', '#b9c6d6', '#2a3442'],
  ['#191611', '#c7a15c', '#403523'],
  ['#101a1c', '#8de0d4', '#244141'],
]

export function Placeholder({
  seed,
  label,
  note,
  className,
  aspect = 'landscape',
  compact = false,
}: {
  seed: string
  label: string
  note?: string
  className?: string
  aspect?: 'portrait' | 'landscape' | 'square'
  compact?: boolean
}) {
  const hash = hashString(seed)
  const [bg, accent, mid] = palettes[hash % palettes.length]
  const angle = 25 + (hash % 60)

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative flex flex-col justify-between overflow-hidden border border-white/10 p-4',
        aspect === 'portrait' && 'aspect-[4/5]',
        aspect === 'landscape' && 'aspect-[16/10]',
        aspect === 'square' && 'aspect-square',
        className,
      )}
      style={{
        backgroundColor: bg,
        backgroundImage: `linear-gradient(${angle}deg, transparent 0 48%, ${accent}22 48% 49%, transparent 49% 100%), repeating-linear-gradient(0deg, transparent 0 22px, ${mid}66 22px 23px), radial-gradient(circle at 78% 18%, ${accent}22, transparent 42%)`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: accent }}>
          архив · 0103
        </span>
        <ImageOff className="size-4 opacity-50" style={{ color: accent }} />
      </div>
      <div>
        <p
          className={cn(
            'max-w-[85%] font-display uppercase leading-[0.95] tracking-tight',
            compact ? 'text-lg' : 'text-2xl',
          )}
          style={{ color: accent }}
        >
          01:03
        </p>
        <p className="mt-2 line-clamp-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-white/60">
          {label}
        </p>
        {note && !compact ? (
          <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-white/40">{note}</p>
        ) : null}
      </div>
    </div>
  )
}

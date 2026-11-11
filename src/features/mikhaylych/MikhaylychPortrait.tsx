import { useState } from 'react'
import { CHARACTER_ASSETS } from '../../config/characters.config'
import { cn } from '../../utils'

export function MikhaylychPortrait({ className = '' }: { className?: string }) {
  const [failed, setFailed] = useState(false)
  const asset = CHARACTER_ASSETS.mikhaylychPortrait

  if (asset.src && !failed) {
    return (
      <img
        src={asset.src}
        alt={asset.alt}
        onError={() => setFailed(true)}
        className={cn('aspect-[140/160] w-full object-cover', className)}
      />
    )
  }

  return (
    <svg viewBox="0 0 140 160" role="img" aria-label={asset.alt} className={className}>
      <defs>
        <linearGradient id="mikh-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#17130d" />
          <stop offset="1" stopColor="#070806" />
        </linearGradient>
        <radialGradient id="mikh-glow" cx="0.5" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#c7a15c" stopOpacity="0.3" />
          <stop offset="1" stopColor="#c7a15c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="140" height="160" fill="url(#mikh-bg)" />
      <rect width="140" height="160" fill="url(#mikh-glow)" />
      <g opacity="0.35" stroke="#c7a15c" strokeWidth="0.7">
        <path d="M0 22h140M0 54h140M0 86h140M0 118h140M0 150h140" />
      </g>
      <path d="M15 160c4-37 23-54 55-54s52 17 55 54Z" fill="#11100c" stroke="#6b5733" strokeWidth="1.2" />
      <path d="M55 111h30l9 49H46Z" fill="#1b1710" stroke="#8a6c3c" strokeWidth="1" />
      <path d="M62 110h16v18l-8 7-8-7Z" fill="#d9c9a8" opacity="0.7" />
      <ellipse cx="70" cy="76" rx="29" ry="34" fill="#b9aa8d" />
      <path d="M42 76c0-24 12-39 28-39 17 0 29 15 29 39-7-7-15-11-24-12-5 9-16 14-33 12Z" fill="#242119" />
      <path d="M37 53c12-23 54-28 68-1l-8 7c-9-13-43-13-52 0Z" fill="#3b3222" />
      <path d="M31 52c12-5 66-5 80 0l-4 8c-22-4-51-4-72 0Z" fill="#15130e" />
      <path d="M49 78c4-3 8-3 11 0M80 78c3-3 7-3 11 0" stroke="#201b13" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="54" cy="83" r="2" fill="#201b13" />
      <circle cx="86" cy="83" r="2" fill="#201b13" />
      <path d="M70 83v11l-4 3" stroke="#8f7a58" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M54 104c10 5 22 5 32 0" stroke="#55452f" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M44 116l-7 34M96 116l7 34" stroke="#c7a15c" strokeWidth="1.2" opacity="0.4" />
      <rect x="103" y="126" width="25" height="12" fill="#c7a15c" opacity="0.9" />
      <text x="115.5" y="135" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#14110c">
        1996
      </text>
      <rect x="0.5" y="0.5" width="139" height="159" fill="none" stroke="#c7a15c" strokeOpacity="0.22" />
    </svg>
  )
}

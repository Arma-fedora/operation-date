export function InspectorPortrait({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 160" role="img" aria-label="Инспектор Пломбир" className={className}>
      <defs>
        <linearGradient id="inspector-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b241e" />
          <stop offset="1" stopColor="#090b0a" />
        </linearGradient>
        <radialGradient id="inspector-light" cx="0.5" cy="0.15" r="0.8">
          <stop offset="0" stopColor="#c8f36a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#c8f36a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="140" height="160" fill="url(#inspector-bg)" />
      <rect width="140" height="160" fill="url(#inspector-light)" />
      <path d="M25 160c2-31 18-46 45-46s43 15 45 46Z" fill="#0c110e" stroke="#3a4a3d" strokeWidth="1.2" />
      <path d="M48 115h44l7 45H41Z" fill="#151c17" stroke="#4c5e4e" strokeWidth="1" />
      <path d="M62 112h16l5 19-13 8-13-8Z" fill="#e7deca" opacity="0.85" />
      <path d="M70 139v21" stroke="#d24a32" strokeWidth="2" />
      <ellipse cx="70" cy="74" rx="30" ry="36" fill="#d8ceba" />
      <path d="M40 72c0-25 13-39 30-39s30 14 30 39c-6-8-13-12-21-13-4 9-14 14-27 14-4 0-8-1-12-1Z" fill="#1e2821" />
      <path d="M35 55c8-29 63-38 74 2l-8 7c-7-18-53-18-59 1Z" fill="#101511" />
      <path d="M28 54c13-7 70-7 84 0l-6 9c-19-4-53-4-72 0Z" fill="#202a23" />
      <path d="M48 75c4-3 8-3 12 0" stroke="#171410" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M80 75c4-3 8-3 12 0" stroke="#171410" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="54" cy="80" r="2.2" fill="#171410" />
      <circle cx="86" cy="80" r="2.2" fill="#171410" />
      <circle cx="54.8" cy="79.2" r="0.7" fill="#c8f36a" />
      <circle cx="86.8" cy="79.2" r="0.7" fill="#c8f36a" />
      <path d="M70 81v12l-5 3" stroke="#9d8e76" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M55 106c9 4 21 4 30 0" stroke="#5e4d3c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="100" y="127" width="22" height="12" fill="#c8f36a" opacity="0.9" />
      <text x="111" y="136" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#10130d">
        01:03
      </text>
      <rect x="0.5" y="0.5" width="139" height="159" fill="none" stroke="#c8f36a" strokeOpacity="0.18" />
    </svg>
  )
}

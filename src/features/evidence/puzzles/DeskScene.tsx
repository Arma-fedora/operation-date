export function DeskScene() {
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label="Стол дежурного архива в 01:03" className="h-auto w-full">
      <defs>
        <linearGradient id="desk-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a211b" />
          <stop offset="1" stopColor="#0a0d0b" />
        </linearGradient>
        <linearGradient id="desk-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b3524" />
          <stop offset="1" stopColor="#21170f" />
        </linearGradient>
        <linearGradient id="lamp-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4e5b0" stopOpacity="0.32" />
          <stop offset="1" stopColor="#f4e5b0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="photo-vignette" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.65" />
        </radialGradient>
      </defs>

      <rect width="400" height="260" fill="url(#desk-bg)" />
      <path d="M0 0h400v260H0Z" fill="none" />
      <g opacity="0.25" stroke="#c8f36a" strokeWidth="0.5">
        <path d="M0 38h400M0 76h400M0 114h400M0 152h400M0 190h400M0 228h400" />
        <path d="M40 0v260M80 0v260M120 0v260M160 0v260M200 0v260M240 0v260M280 0v260M320 0v260M360 0v260" />
      </g>

      <g>
        <rect x="258" y="18" width="112" height="92" fill="#0b1520" stroke="#56645b" strokeWidth="2" />
        <circle cx="338" cy="44" r="11" fill="#d9dfb8" opacity="0.8" />
        <path d="M258 87h112v23H258Z" fill="#0f1c28" />
        <path d="M264 87l16-17 11 12 18-21 14 15 12-9 15 20Z" fill="#182a38" />
        <path d="M276 64v8M308 74v8M334 60v10" stroke="#c8f36a" strokeWidth="1.2" opacity="0.5" />
        <path d="M258 56h112M258 72h112" stroke="#56645b" strokeWidth="1" opacity="0.6" />
      </g>

      <g>
        <circle cx="82" cy="65" r="31" fill="#e7deca" stroke="#3f4a3f" strokeWidth="3" />
        <circle cx="82" cy="65" r="25" fill="none" stroke="#8a806c" strokeWidth="0.8" />
        <path d="M82 65V44M82 65l14 6" stroke="#171410" strokeWidth="3" strokeLinecap="round" />
        <circle cx="82" cy="65" r="2.6" fill="#d24a32" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <path
            key={angle}
            d="M82 44v3"
            stroke="#171410"
            strokeWidth="1.2"
            transform={`rotate(${angle} 82 65)`}
          />
        ))}
      </g>

      <path d="M248 176h152v84H248Z" fill="url(#desk-wood)" />
      <path d="M248 176h152v8H248Z" fill="#6d4d31" />
      <path d="M0 228h400v32H0Z" fill="#13100c" />
      <path d="M0 228h400" stroke="#6b4b30" strokeWidth="2" />

      <g>
        <path d="M330 120l-15 78h78l-22-78Z" fill="#3f4a3f" stroke="#6f7b6f" strokeWidth="2" />
        <path d="M316 198h75l26 35H298Z" fill="url(#lamp-cone)" />
        <path d="M330 120h39l-7 14h-25Z" fill="#c8f36a" opacity="0.25" />
        <path d="M349 120V96h22" stroke="#6f7b6f" strokeWidth="3" fill="none" />
      </g>

      <g>
        <ellipse cx="139" cy="198" rx="21" ry="7" fill="#0b0d0b" opacity="0.6" />
        <path d="M122 175h28l-3 20h-22Z" fill="#d8ceba" />
        <path d="M150 179c13 1 13 15 0 15" fill="none" stroke="#d8ceba" strokeWidth="4" />
        <ellipse cx="136" cy="175" rx="14" ry="3.5" fill="#6b4b30" />
        <path d="M128 170c2-8 14-8 16 0" stroke="#a9a18e" strokeWidth="2" fill="none" />
      </g>

      <g>
        <path d="M204 180l36-7 34 9-3 16-63 5Z" fill="#d9cfb9" stroke="#9d927d" strokeWidth="1" />
        <path d="M216 185l29-3M218 191l37-2M221 197l24-1" stroke="#776e5e" strokeWidth="1.2" />
        <path d="M260 188h8l6 12h-20Z" fill="#b7ad98" />
      </g>

      <g>
        <path d="M267 174c3-16 24-18 30-4l7 4c6 4 5 12-1 15l-15 8c-8 4-17-1-17-10Z" fill="#8e99a0" />
        <circle cx="294" cy="161" r="9" fill="#aab3b8" />
        <path d="M300 160l7 3-7 2Z" fill="#d9a24a" />
        <circle cx="298" cy="158" r="1.4" fill="#111" />
        <path d="M277 181c8 4 14 4 20 0" stroke="#59636a" strokeWidth="2" fill="none" />
        <path d="M284 190v9M294 190v9" stroke="#d9a24a" strokeWidth="2" />
        <path d="M281 184l-8 3M300 184l8 3" stroke="#59636a" strokeWidth="1.5" />
      </g>

      <g opacity="0.9">
        <ellipse cx="166" cy="233" rx="44" ry="9" fill="#060807" opacity="0.8" />
        <path d="M132 219c6-19 19-29 32-29 14 0 22 11 24 24l-7 17h-37Z" fill="#0e120f" />
        <path d="M146 198c0-11 7-18 15-18 9 0 15 7 15 18Z" fill="#0e120f" />
        <path d="M139 196h44l-5-8h-34Z" fill="#1a211b" />
        <ellipse cx="160" cy="191" rx="27" ry="4" fill="#202a23" />
        <circle cx="160" cy="184" r="2" fill="#c8f36a" opacity="0.55" />
      </g>

      <rect width="400" height="260" fill="url(#photo-vignette)" />
      <rect x="0.5" y="0.5" width="399" height="259" fill="none" stroke="#c8f36a" strokeOpacity="0.12" />
      <g opacity="0.3" fontFamily="monospace" fill="#c8f36a" fontSize="7">
        <text x="12" y="248">ARCHIVE CAM 13 · 01:03:00</text>
        <text x="316" y="248">NO SIGNAL / OK</text>
      </g>
    </svg>
  )
}

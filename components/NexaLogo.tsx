// components/NexaLogo.tsx
export function NexaLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="nxbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a25" />
          <stop offset="100%" stopColor="#0a0a0f" />
        </linearGradient>
        <linearGradient id="nxg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6272f1" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="nxg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6272f1" />
        </linearGradient>
        <filter id="nxglow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="512" height="512" rx="110" fill="url(#nxbg)" />
      
      {/* Glow orb */}
      <circle cx="256" cy="230" r="140" fill="rgba(98,114,241,0.08)" filter="url(#nxglow)" />

      {/* Main chat bubble */}
      <path
        d="M 130 165 Q 130 125 170 125 L 342 125 Q 382 125 382 165 L 382 268 Q 382 308 342 308 L 215 308 L 162 372 L 172 308 Q 130 308 130 268 Z"
        fill="url(#nxg1)"
        opacity="0.95"
        filter="url(#nxglow)"
      />

      {/* Highlight shimmer on bubble */}
      <path
        d="M 145 160 Q 145 135 168 135 L 344 135 Q 367 135 367 160 L 367 178 Q 310 150 245 153 Q 175 156 145 178 Z"
        fill="rgba(255,255,255,0.14)"
      />

      {/* Three dots */}
      <circle cx="190" cy="215" r="20" fill="white" opacity="0.95" />
      <circle cx="256" cy="215" r="20" fill="white" opacity="0.95" />
      <circle cx="322" cy="215" r="20" fill="white" opacity="0.95" />
      <circle cx="190" cy="215" r="9" fill="rgba(98,114,241,0.45)" />
      <circle cx="256" cy="215" r="9" fill="rgba(167,139,250,0.45)" />
      <circle cx="322" cy="215" r="9" fill="rgba(56,189,248,0.45)" />

      {/* NEXA text */}
      <text
        x="256" y="425"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="52"
        fill="url(#nxg2)"
        textAnchor="middle"
        opacity="0.65"
      >
        NEXA
      </text>

      {/* Accent dots */}
      <circle cx="418" cy="88" r="6" fill="rgba(98,114,241,0.5)" />
      <circle cx="438" cy="88" r="4" fill="rgba(167,139,250,0.35)" />
      <circle cx="88" cy="418" r="4" fill="rgba(56,189,248,0.35)" />
    </svg>
  )
}

/**
 * ColorForge Logo — Self-contained SVG icon.
 *
 * Design: A classic glass prism with a rainbow spectrum strip at its base.
 *   – Instantly communicates "color" (prism disperses light into spectrum).
 *   – Self-contained: includes its own rounded-square background with brand gradient.
 *   – Uses React 18 useId() so gradient IDs are unique even with multiple instances.
 *   – Renders crisply at any size (viewBox="0 0 44 44").
 */
import { useId } from 'react'

export default function Logo({ size = 44, className = '' }) {
  const uid = useId().replace(/:/g, '_')
  const bgId       = `${uid}_bg`
  const specId     = `${uid}_spec`
  const glowId     = `${uid}_glow`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ColorForge"
      role="img"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Brand gradient — background */}
        <linearGradient id={bgId} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>

        {/* Rainbow spectrum — fills the strip */}
        <linearGradient id={specId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"    stopColor="#f472b6" />
          <stop offset="25%"   stopColor="#a78bfa" />
          <stop offset="55%"   stopColor="#38bdf8" />
          <stop offset="80%"   stopColor="#34d399" />
          <stop offset="100%"  stopColor="#facc15" />
        </linearGradient>

        {/* Soft inner glow behind prism */}
        <radialGradient id={glowId} cx="50%" cy="55%" r="45%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
        </radialGradient>
      </defs>

      {/* ── Background rounded square ── */}
      <rect width="44" height="44" rx="11" fill={`url(#${bgId})`} />

      {/* ── Subtle inner glow ── */}
      <rect width="44" height="44" rx="11" fill={`url(#${glowId})`} />

      {/* ── Prism body (slight frosted fill) ── */}
      <path
        d="M22 8.5 L37.5 34 H6.5 Z"
        fill="rgba(255,255,255,0.08)"
      />

      {/* ── Prism outline (bold white) ── */}
      <path
        d="M22 8.5 L37.5 34 H6.5 Z"
        stroke="rgba(255,255,255,0.88)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* ── Left face highlight — faint inner edge ── */}
      <line
        x1="22" y1="8.5"
        x2="6.5" y2="34"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1"
      />

      {/* ── Rainbow spectrum strip — sits on the prism base ── */}
      <rect
        x="6.5"
        y="32"
        width="31"
        height="4.5"
        rx="2.25"
        fill={`url(#${specId})`}
        opacity="0.95"
      />

      {/* ── Apex bright dot ── */}
      <circle cx="22" cy="8.5" r="2" fill="white" opacity="0.75" />
    </svg>
  )
}

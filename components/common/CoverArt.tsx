// components/common/CoverArt.tsx
import { cn } from '@/lib/utils'

const COVER_PALETTES = [
  { bg: '#F4E4C1', a: '#2E2E2E', b: '#C96F3F' },
  { bg: '#2E2E2E', a: '#F4E4C1', b: '#E5B53D' },
  { bg: '#B8D4C6', a: '#1F3A2E', b: '#E5A05F' },
  { bg: '#EEB5B5', a: '#3D1F1F', b: '#F4E4C1' },
  { bg: '#C4CFEA', a: '#1F2A4A', b: '#F5B265' },
  { bg: '#1F2A4A', a: '#F4E4C1', b: '#D47D5A' },
  { bg: '#E5D5C3', a: '#2E2E2E', b: '#7A8C5C' },
  { bg: '#D0C5E5', a: '#2E2044', b: '#F4B8A3' },
  { bg: '#F5B265', a: '#2E2E2E', b: '#1F3A2E' },
  { bg: '#1F3A2E', a: '#E5D5C3', b: '#F5B265' },
]

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0
  return h
}

interface CoverArtProps {
  seed?: string
  className?: string
  grayscale?: boolean
  label?: string
}

export function CoverArt({ seed = 'x', className, grayscale = false, label }: CoverArtProps) {
  const h = hashSeed(seed)
  const p = COVER_PALETTES[h % COVER_PALETTES.length]
  const kind = h % 6

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        background: p.bg,
        filter: grayscale ? 'grayscale(70%)' : 'none',
        transition: 'filter 350ms cubic-bezier(0.2,0.7,0.2,1)',
      }}
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {kind === 0 && <>
          <circle cx="300" cy="110" r="70" fill={p.b} opacity="0.9"/>
          <rect x="0" y="200" width="400" height="100" fill={p.a} opacity="0.85"/>
          <path d="M0 200 L100 140 L200 180 L280 120 L400 170 L400 200 Z" fill={p.a}/>
        </>}
        {kind === 1 && <>
          <rect x="40" y="40" width="320" height="220" fill="none" stroke={p.a} strokeWidth="2"/>
          <circle cx="200" cy="150" r="80" fill={p.b} opacity="0.85"/>
          <rect x="160" y="110" width="80" height="80" fill={p.bg}/>
        </>}
        {kind === 2 && <>
          {Array.from({length: 6}).map((_, i) => (
            <rect key={i} x={i * 66} y="0" width="66" height="300" fill={i % 2 ? p.a : p.b} opacity={0.12 + i * 0.04}/>
          ))}
          <circle cx="80" cy="80" r="40" fill={p.a}/>
          <circle cx="200" cy="200" r="60" fill={p.b}/>
        </>}
        {kind === 3 && <>
          <path d="M0 220 Q100 150 200 200 T400 180 L400 300 L0 300 Z" fill={p.a}/>
          <path d="M0 250 Q100 200 200 230 T400 220 L400 300 L0 300 Z" fill={p.b} opacity="0.7"/>
          <circle cx="320" cy="80" r="40" fill={p.b}/>
        </>}
        {kind === 4 && <>
          <rect x="0" y="0" width="200" height="300" fill={p.a}/>
          <rect x="200" y="0" width="200" height="300" fill={p.b}/>
          <circle cx="200" cy="150" r="80" fill={p.bg}/>
        </>}
        {kind === 5 && <>
          {Array.from({length: 8}).map((_, i) => (
            <line key={i} x1={i * 60} y1="0" x2={i * 60 + 100} y2="300" stroke={p.a} strokeWidth="1.5" opacity="0.35"/>
          ))}
          <circle cx="200" cy="150" r="90" fill={p.b}/>
          <circle cx="200" cy="150" r="50" fill={p.bg}/>
        </>}
      </svg>
      {label && (
        <div
          style={{
            position: 'absolute', bottom: 12, left: 12,
            fontFamily: 'var(--font-instrument-serif)', fontStyle: 'italic',
            fontSize: 22, color: p.a, mixBlendMode: 'multiply',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}

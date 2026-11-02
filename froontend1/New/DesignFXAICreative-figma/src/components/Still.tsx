const H = [28, 40, 22, 55, 34, 70, 30, 46, 26, 60, 38, 24, 52, 32, 84, 36, 28, 48, 64, 30, 42, 26, 58, 34, 44, 22, 36]

export default function Still({
  title,
  sub,
  className = '',
  tone = 'dusk',
}: {
  title?: string
  sub?: string
  className?: string
  tone?: 'dusk' | 'night'
}) {
  const night = tone === 'night'
  return (
    <div className={`relative aspect-[2.39/1] overflow-hidden bg-bg ${className}`}>
      <svg viewBox="0 0 239 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="fx-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b0706" />
            <stop offset={night ? '.7' : '.5'} stopColor={night ? '#2a0f08' : '#5a1d0e'} />
            <stop offset={night ? '.92' : '.8'} stopColor={night ? '#7a2a10' : '#ff5a2a'} />
            <stop offset="1" stopColor={night ? '#c2581e' : '#ffb25a'} />
          </linearGradient>
          <radialGradient id="fx-sun">
            <stop offset="0" stopColor="#fff0cf" />
            <stop offset="1" stopColor="#ffc47a" />
          </radialGradient>
        </defs>
        <rect width="239" height="100" fill="url(#fx-sky)" />
        <circle cx="120" cy={night ? 82 : 72} r="19" fill="url(#fx-sun)" opacity={night ? 0.55 : 0.95} />
        <g fill="#0a0908">
          {H.map((h, i) => (
            <rect key={i} x={i * 9} y={100 - h} width="8.4" height={h} />
          ))}
          <rect x="118" y="6" width="2" height="94" />
        </g>
        <g fill="#ffb25a" opacity=".7">
          {H.map((h, i) => (i % 3 === 0 ? <rect key={i} x={i * 9 + 2} y={100 - h + 6} width="1.2" height="1.4" /> : null))}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/50 via-transparent to-bg/30" />
      {(title || sub) && (
        <div className="absolute inset-x-0 top-[12%] px-6 text-center">
          {title && <div className="font-display text-[clamp(1.6rem,4.4vw,4rem)] italic leading-tight text-bone rtl:not-italic">{title}</div>}
          {sub && <div className="label mt-2 !text-bone/80">{sub}</div>}
        </div>
      )}
    </div>
  )
}

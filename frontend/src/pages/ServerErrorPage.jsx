import { Link } from 'react-router-dom'

function LeafShape({ fill = '#52B788' }) {
  return (
    <svg viewBox="0 0 18 24" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M9 22C9 22 2 15 2.5 9C3 3.5 9 2 9 2C9 2 15 3.5 15.5 9C16 15 9 22 9 22Z" fill={fill} />
      <line x1="9" y1="22" x2="9" y2="4" stroke="#D4E6D9" strokeWidth="0.9" />
    </svg>
  )
}

const PARTICLES = [
  { id: 1, bottom: '30%', left: '3%',   w: 13, h: 18, dur: '19s', del: '3s',   dx: '-18px', dy: '-210px', rs: '12deg',  re: '54deg',  op: '0.19', fill: '#52B788' },
  { id: 2, bottom: '20%', right: '8%',  w: 10, h: 15, dur: '23s', del: '9s',   dx:  '24px', dy: '-185px', rs: '-7deg',  re: '-46deg', op: '0.16', fill: '#95C4A0' },
  { id: 3, bottom: '62%', right: '12%', w: 8,  h: 12, dur: '22s', del: '15s',  dx: '-12px', dy: '-160px', rs: '20deg',  re: '62deg',  op: '0.13', fill: '#2D6A4F' },
]

function BranchOrnament() {
  return (
    <svg viewBox="0 0 300 48" fill="none" aria-hidden="true"
      style={{ width: '100%', maxWidth: 300, opacity: 0.6 }}>
      <path d="M8 30 C55 24 100 28 150 26 C200 24 245 27 292 22"
        stroke="#2D6A4F" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M52 25 C47 15 39 13 37 21 C35 29 44 31 52 25Z" fill="#2D6A4F" opacity="0.6" />
      <path d="M82 26 C78 17 71 14 69 22 C67 30 75 32 82 26Z" fill="#52B788" opacity="0.5" />
      <path d="M112 24 C110 15 105 12 103 19 C101 27 108 29 112 24Z" fill="#2D6A4F" opacity="0.45" />
      <path d="M178 23 C181 14 187 12 188 19 C189 27 182 29 178 23Z" fill="#52B788" opacity="0.5" />
      <path d="M212 24 C215 15 222 12 223 19 C224 27 217 28 212 24Z" fill="#2D6A4F" opacity="0.55" />
      <path d="M250 21 C254 12 260 10 260 18 C260 25 254 27 250 21Z" fill="#95C4A0" opacity="0.45" />
      <circle cx="140" cy="25" r="2.5" fill="#52B788" opacity="0.4" />
      <circle cx="155" cy="24" r="1.8" fill="#52B788" opacity="0.3" />
    </svg>
  )
}

function CrackedPot() {
  return (
    <svg viewBox="0 0 160 200" fill="none" aria-hidden="true"
      style={{ width: 120, height: 'auto' }}>
      {/* Ground shadow */}
      <ellipse cx="80" cy="195" rx="38" ry="5" fill="#2D6A4F" opacity="0.07" />

      {/* Pot body */}
      <path d="M50 140 C46 158 40 178 42 188 L118 188 C120 178 114 158 110 140 Z"
        fill="#C49A3C" opacity="0.48" />
      {/* Pot shine */}
      <path d="M54 148 L56 172" stroke="#FFFDF7" strokeWidth="1.8" strokeLinecap="round" opacity="0.18" />

      {/* Rim */}
      <rect x="44" y="130" width="72" height="16" rx="8" fill="#6B5B4E" opacity="0.44" />
      <ellipse cx="80" cy="140" rx="34" ry="6" fill="#6B5B4E" opacity="0.2" />

      {/* Main crack — zigzag diagonal */}
      <path d="M60 146 L65 159 L58 168 L64 177 L71 185"
        stroke="#1A1A14" strokeWidth="2.2" fill="none" opacity="0.65"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Branch cracks */}
      <path d="M65 159 L74 156" stroke="#1A1A14" strokeWidth="1.1" fill="none" opacity="0.48" strokeLinecap="round" />
      <path d="M58 168 L50 172" stroke="#1A1A14" strokeWidth="1.1" fill="none" opacity="0.42" strokeLinecap="round" />
      <path d="M64 177 L58 182" stroke="#1A1A14" strokeWidth="0.9" fill="none" opacity="0.35" strokeLinecap="round" />
      {/* Crack glow / shadow bleed */}
      <path d="M60 146 L65 159 L58 168 L64 177 L71 185"
        stroke="#6B5B4E" strokeWidth="5" fill="none" opacity="0.07"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Steam wisps */}
      <path d="M68 128 C65 116 71 106 68 94 C65 84 61 79 64 70"
        stroke="#6B5B4E" strokeWidth="1.6" fill="none" opacity="0.22"
        strokeLinecap="round" />
      <path d="M80 126 C83 113 77 105 81 93 C85 81 89 76 86 64"
        stroke="#6B5B4E" strokeWidth="1.6" fill="none" opacity="0.19"
        strokeLinecap="round" />
      <path d="M93 129 C97 117 91 110 95 98 C99 86 102 80 98 69"
        stroke="#6B5B4E" strokeWidth="1.4" fill="none" opacity="0.16"
        strokeLinecap="round" />

      {/* Plant stem */}
      <path d="M80 132 C80 118 83 100 79 82 C75 64 88 50 92 36"
        stroke="#3a8060" strokeWidth="2.5" strokeLinecap="round" />

      {/* Left droopy leaf */}
      <path d="M80 108 C64 98 50 104 47 120 C44 136 58 140 70 129 C76 123 79 113 80 108Z"
        fill="#2D6A4F" opacity="0.68" />
      <path d="M80 108 C56 122 48 136 50 142" stroke="#3d8c67" strokeWidth="0.8" fill="none" opacity="0.36" />

      {/* Right droopy leaf */}
      <path d="M82 80 C100 72 114 80 115 96 C116 112 102 115 91 105 C85 98 82 86 82 80Z"
        fill="#1e5438" opacity="0.58" />
      <path d="M82 80 C110 96 114 114 108 120" stroke="#3d8c67" strokeWidth="0.8" fill="none" opacity="0.36" />

      {/* Wilted top bud */}
      <ellipse cx="90" cy="31" rx="5" ry="8" fill="#6B5B4E" opacity="0.44" transform="rotate(-20 90 31)" />
      <path d="M86 25 C79 17 78 10 83 8" stroke="#6B5B4E" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.38" />
      <path d="M91 23 C96 14 102 13 100 8" stroke="#6B5B4E" strokeWidth="1.0" strokeLinecap="round" fill="none" opacity="0.30" />
      <path d="M88 26 C82 19 84 12 89 10" stroke="#6B5B4E" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.26" />
    </svg>
  )
}

export default function ServerErrorPage() {
  return (
    <div className="nf-page">
      {PARTICLES.map(({ id, bottom, left, right, w, h, dur, del, dx, dy, rs, re, op, fill }) => (
        <div
          key={id}
          className="auth-particle"
          style={{
            bottom, left, right,
            width: w, height: h,
            '--dx': dx, '--dy': dy,
            '--r-start': rs, '--r-end': re,
            '--max-op': op,
            animation: `floatLeaf ${dur} ${del} ease-in-out infinite`,
          }}
        >
          <LeafShape fill={fill} />
        </div>
      ))}

      <div className="nf-content">
        <div className="nf-anim-1">
          <BranchOrnament />
        </div>

        <h1 className="nf-code nf-anim-2">500</h1>

        <div className="nf-divider nf-anim-3">
          <span className="nf-divider-line" />
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
            <path d="M7 17C7 17 1 12 1.5 7C2 2 7 1 7 1C7 1 12 2 12.5 7C13 12 7 17 7 17Z"
              fill="#2D6A4F" opacity="0.55" />
            <line x1="7" y1="17" x2="7" y2="3" stroke="#95C4A0" strokeWidth="0.8" opacity="0.6" />
          </svg>
          <span className="nf-divider-line" />
        </div>

        <h2 className="nf-title nf-anim-3">В саду что-то сломалось</h2>

        <p className="nf-sub nf-anim-4">
          Садовник уже спешит на помощь.<br />
          Попробуйте вернуться через минуту.
        </p>

        <div className="nf-forbidden-actions nf-anim-5">
          <button className="nf-btn" onClick={() => window.location.reload()}>
            Попробовать снова →
          </button>
          <Link to="/" className="nf-btn-secondary">
            На главную
          </Link>
        </div>

        <div className="nf-anim-6">
          <div className="nf-plant-sway">
            <CrackedPot />
          </div>
        </div>
      </div>
    </div>
  )
}

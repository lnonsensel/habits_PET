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
  { id: 1, bottom: '25%', left: '4%',   w: 15, h: 20, dur: '18s', del: '0s',   dx: '-22px', dy: '-230px', rs: '8deg',  re: '52deg',  op: '0.22', fill: '#52B788' },
  { id: 2, bottom: '18%', right: '6%',  w: 12, h: 17, dur: '22s', del: '7s',   dx:  '28px', dy: '-200px', rs: '-6deg', re: '-44deg', op: '0.18', fill: '#95C4A0' },
  { id: 3, bottom: '55%', right: '10%', w: 10, h: 14, dur: '20s', del: '12s',  dx: '-16px', dy: '-175px', rs: '18deg', re: '60deg',  op: '0.15', fill: '#2D6A4F' },
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

function WiltedPot() {
  return (
    <svg viewBox="0 0 160 200" fill="none" aria-hidden="true"
      style={{ width: 120, height: 'auto' }}>
      <ellipse cx="80" cy="194" rx="36" ry="5" fill="#2D6A4F" opacity="0.08" />

      <path d="M46 148 L62 190 L98 190 L114 148 Z" fill="#C49A3C" opacity="0.45" />
      <path d="M52 154 L55 176" stroke="#FFFDF7" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      <rect x="40" y="138" width="80" height="16" rx="8" fill="#6B5B4E" opacity="0.4" />
      <ellipse cx="80" cy="148" rx="36" ry="7" fill="#6B5B4E" opacity="0.22" />

      <path d="M80 141 C79 122 78 105 82 82 C85 66 81 50 76 36"
        stroke="#3a8060" strokeWidth="2.5" strokeLinecap="round" />

      <path d="M80 108 C62 115 46 128 42 145 C38 162 53 167 66 156 C77 146 79 120 80 108Z"
        fill="#2D6A4F" opacity="0.7" />
      <path d="M80 108 C55 132 46 155 52 162" stroke="#3d8c67" strokeWidth="0.8" fill="none" opacity="0.38" />

      <path d="M82 80 C102 88 118 102 120 120 C122 138 108 142 95 131 C84 122 82 94 82 80Z"
        fill="#1e5438" opacity="0.65" />
      <path d="M82 80 C106 106 114 130 108 138" stroke="#3d8c67" strokeWidth="0.8" fill="none" opacity="0.38" />

      <path d="M79 54 C66 49 56 55 54 65 C52 75 62 79 70 72 C76 66 79 57 79 54Z"
        fill="#2D6A4F" opacity="0.55" />

      <ellipse cx="74" cy="30" rx="6" ry="10" fill="#6B5B4E" opacity="0.48" transform="rotate(-18 74 30)" />
      <path d="M68 24 C61 18 58 11 63 8" stroke="#6B5B4E" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.42" />
      <path d="M74 22 C67 15 68 7 73 5" stroke="#6B5B4E" strokeWidth="1.0" strokeLinecap="round" fill="none" opacity="0.32" />
      <path d="M80 26 C87 18 94 16 93 10" stroke="#6B5B4E" strokeWidth="1.0" strokeLinecap="round" fill="none" opacity="0.32" />
    </svg>
  )
}

export default function NotFoundPage() {
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

        <h1 className="nf-code nf-anim-2">404</h1>

        <div className="nf-divider nf-anim-3">
          <span className="nf-divider-line" />
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
            <path d="M7 17C7 17 1 12 1.5 7C2 2 7 1 7 1C7 1 12 2 12.5 7C13 12 7 17 7 17Z"
              fill="#2D6A4F" opacity="0.55" />
            <line x1="7" y1="17" x2="7" y2="3" stroke="#95C4A0" strokeWidth="0.8" opacity="0.6" />
          </svg>
          <span className="nf-divider-line" />
        </div>

        <h2 className="nf-title nf-anim-3">Страница потерялась в саду</h2>

        <p className="nf-sub nf-anim-4">
          Кажется, этот путь ещё не проложен.<br />
          Вернитесь туда, где всё растёт.
        </p>

        <div className="nf-anim-5">
          <Link to="/" className="nf-btn">
            Вернуться в сад →
          </Link>
        </div>

        <div className="nf-anim-6">
          <div className="nf-plant-sway">
            <WiltedPot />
          </div>
        </div>
      </div>
    </div>
  )
}

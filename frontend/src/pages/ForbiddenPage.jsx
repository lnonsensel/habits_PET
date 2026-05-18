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
  { id: 1, bottom: '35%', left: '5%',   w: 14, h: 19, dur: '20s', del: '2s',   dx: '-20px', dy: '-215px', rs: '10deg',  re: '50deg',  op: '0.20', fill: '#52B788' },
  { id: 2, bottom: '22%', right: '7%',  w: 11, h: 16, dur: '24s', del: '8s',   dx:  '26px', dy: '-190px', rs: '-5deg',  re: '-42deg', op: '0.17', fill: '#95C4A0' },
  { id: 3, bottom: '60%', right: '11%', w: 9,  h: 13, dur: '21s', del: '14s',  dx: '-14px', dy: '-168px', rs: '16deg',  re: '58deg',  op: '0.14', fill: '#2D6A4F' },
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

function GardenGate() {
  return (
    <svg viewBox="0 0 200 210" fill="none" aria-hidden="true"
      style={{ width: 160, height: 'auto' }}>
      {/* Ground shadow */}
      <ellipse cx="100" cy="202" rx="70" ry="6" fill="#2D6A4F" opacity="0.07" />

      {/* Left post */}
      <rect x="12" y="10" width="14" height="182" rx="3" fill="#1A1A14" opacity="0.62" />
      {/* Left post cap */}
      <ellipse cx="19" cy="10" rx="9" ry="6" fill="#6B5B4E" opacity="0.55" />

      {/* Right post */}
      <rect x="174" y="10" width="14" height="182" rx="3" fill="#1A1A14" opacity="0.62" />
      {/* Right post cap */}
      <ellipse cx="181" cy="10" rx="9" ry="6" fill="#6B5B4E" opacity="0.55" />

      {/* Horizontal rails */}
      <rect x="26" y="24" width="148" height="5" rx="2" fill="#1A1A14" opacity="0.58" />
      <rect x="26" y="100" width="148" height="4" rx="2" fill="#1A1A14" opacity="0.52" />
      <rect x="26" y="170" width="148" height="5" rx="2" fill="#1A1A14" opacity="0.58" />

      {/* Vertical bars (6 bars) */}
      <rect x="36"  y="24" width="5" height="151" rx="2.5" fill="#1A1A14" opacity="0.52" />
      <rect x="58"  y="24" width="5" height="151" rx="2.5" fill="#1A1A14" opacity="0.52" />
      <rect x="80"  y="24" width="5" height="151" rx="2.5" fill="#1A1A14" opacity="0.52" />
      <rect x="111" y="24" width="5" height="151" rx="2.5" fill="#1A1A14" opacity="0.52" />
      <rect x="133" y="24" width="5" height="151" rx="2.5" fill="#1A1A14" opacity="0.52" />
      <rect x="155" y="24" width="5" height="151" rx="2.5" fill="#1A1A14" opacity="0.52" />

      {/* Bar top spikes */}
      {[36, 58, 80, 111, 133, 155].map(x => (
        <path key={x} d={`M${x + 2.5} 24 L${x} 14 L${x + 5} 14 Z`}
          fill="#1A1A14" opacity="0.5" />
      ))}

      {/* Padlock body */}
      <rect x="84" y="108" width="32" height="25" rx="5" fill="#C49A3C" opacity="0.85" />
      {/* Padlock shackle */}
      <path d="M91 108 C91 94 109 94 109 108"
        stroke="#C49A3C" strokeWidth="5.5" fill="none" opacity="0.85" strokeLinecap="round" />
      {/* Padlock keyhole */}
      <circle cx="100" cy="119" r="4.5" fill="#6B5B4E" opacity="0.65" />
      <rect x="97.5" y="119" width="5" height="8" rx="1.5" fill="#6B5B4E" opacity="0.65" />
      {/* Padlock shine */}
      <path d="M88 112 L90 122" stroke="#FFFDF7" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />

      {/* Left vine up post */}
      <path d="M19 185 C15 162 20 140 16 118 C12 96 18 74 14 52 C10 32 18 16 18 12"
        stroke="#52B788" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* Left vine leaves */}
      <path d="M16 155 C7 147 3 136 7 127 C11 118 20 124 18 135 C17 143 16 151 16 155Z"
        fill="#2D6A4F" opacity="0.62" />
      <path d="M16 108 C24 99 30 99 29 109 C28 119 20 121 16 108Z"
        fill="#52B788" opacity="0.5" />
      <path d="M15 68 C6 60 3 50 7 43 C11 36 20 40 18 51 C17 59 15 65 15 68Z"
        fill="#1e5438" opacity="0.55" />
      <path d="M17 36 C24 28 30 28 29 37 C28 46 21 47 17 36Z"
        fill="#2D6A4F" opacity="0.45" />

      {/* Right vine up post */}
      <path d="M181 185 C185 162 180 140 184 118 C188 96 182 74 186 52 C190 32 182 16 182 12"
        stroke="#52B788" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.45" />
      {/* Right vine leaves */}
      <path d="M184 148 C193 140 197 129 193 120 C189 111 180 117 182 128 C183 136 184 144 184 148Z"
        fill="#1e5438" opacity="0.55" />
      <path d="M184 103 C176 94 170 95 170 105 C170 115 178 117 184 103Z"
        fill="#52B788" opacity="0.45" />
      <path d="M185 62 C193 54 198 54 197 64 C196 73 188 74 185 62Z"
        fill="#2D6A4F" opacity="0.5" />
    </svg>
  )
}

export default function ForbiddenPage() {
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

        <h1 className="nf-code nf-anim-2">403</h1>

        <div className="nf-divider nf-anim-3">
          <span className="nf-divider-line" />
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
            <path d="M7 17C7 17 1 12 1.5 7C2 2 7 1 7 1C7 1 12 2 12.5 7C13 12 7 17 7 17Z"
              fill="#2D6A4F" opacity="0.55" />
            <line x1="7" y1="17" x2="7" y2="3" stroke="#95C4A0" strokeWidth="0.8" opacity="0.6" />
          </svg>
          <span className="nf-divider-line" />
        </div>

        <h2 className="nf-title nf-anim-3">Калитка в этот сад закрыта</h2>

        <p className="nf-sub nf-anim-4">
          У вас нет доступа к этой странице.<br />
          Войдите в аккаунт или вернитесь назад.
        </p>

        <div className="nf-forbidden-actions nf-anim-5">
          <Link to="/login" className="nf-btn">
            Войти в сад →
          </Link>
          <Link to="/" className="nf-btn-secondary">
            На главную
          </Link>
        </div>

        <div className="nf-anim-6">
          <div className="nf-gate-wrap">
            <GardenGate />
          </div>
        </div>
      </div>
    </div>
  )
}

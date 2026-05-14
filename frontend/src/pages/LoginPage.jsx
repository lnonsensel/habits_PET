import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

function validate(form) {
  const e = {}
  if (!form.email)                            e.email    = 'Укажите адрес почты'
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Некорректный email'
  if (!form.password)                         e.password = 'Укажите пароль'
  else if (form.password.length < 8)          e.password = 'Минимум 8 символов'
  return e
}

// Floating-label input: label inside becomes italic Playfair on focus/fill
function FloatField({ id, label, error, value, onChange, type = 'text', autoComplete, autoFocus }) {
  return (
    <div className={`float-field${error ? ' has-error' : ''}`}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        placeholder=" "
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <label htmlFor={id}>{label}</label>
      <span className="float-underline" aria-hidden="true" />
      {error && (
        <p id={`${id}-err`} className="float-error" role="alert">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.5 9h-1V7.5h1V9zm0-3h-1V3h1v3z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Leaf SVG for particles ──────────────────────────────────────
function LeafA({ fill = '#52B788' }) {
  return (
    <svg viewBox="0 0 18 24" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M9 22C9 22 2 15 2.5 9C3 3.5 9 2 9 2C9 2 15 3.5 15.5 9C16 15 9 22 9 22Z" fill={fill} />
      <line x1="9" y1="22" x2="9" y2="4" stroke="#D4E6D9" strokeWidth="0.9" />
      <line x1="9" y1="14" x2="4" y2="10" stroke="#D4E6D9" strokeWidth="0.6" opacity="0.7" />
      <line x1="9" y1="10" x2="14" y2="7" stroke="#D4E6D9" strokeWidth="0.6" opacity="0.7" />
    </svg>
  )
}
function LeafB({ fill = '#95C4A0' }) {
  return (
    <svg viewBox="0 0 20 12" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M10 10C10 10 2 7 2 4.5C2 2 6 1 10 3C14 1 18 2 18 4.5C18 7 10 10 10 10Z" fill={fill} />
      <line x1="10" y1="10" x2="10" y2="3" stroke="#D4E6D9" strokeWidth="0.7" />
    </svg>
  )
}
function Seed({ fill = '#95C4A0' }) {
  return <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: fill }} />
}

// Particle definitions
const PARTICLES = [
  { id: 1, El: LeafA, fill: '#52B788',  bottom: '22%', left:  '16%', w: 18, h: 24, dur: '9s',  del: '0s',   dx: '-38px', dy: '-210px', rs: '12deg',  re: '55deg',  op: '0.55' },
  { id: 2, El: LeafA, fill: '#95C4A0',  bottom: '14%', right: '20%', w: 14, h: 20, dur: '11s', del: '2.2s', dx:  '42px', dy: '-175px', rs: '-8deg',  re: '-50deg', op: '0.45' },
  { id: 3, El: LeafB, fill: '#3d8c67',  bottom: '32%', right: '10%', w: 22, h: 13, dur: '8s',  del: '4s',   dx: '-22px', dy: '-145px', rs: '25deg',  re: '75deg',  op: '0.40' },
  { id: 4, El: Seed,  fill: '#95C4A0',  bottom: '18%', left:  '33%', w:  8, h:  8, dur: '12s', del: '1s',   dx:  '28px', dy: '-195px', rs: '0deg',   re: '40deg',  op: '0.35' },
  { id: 5, El: LeafB, fill: '#52B788',  bottom: '8%',  left:  '26%', w: 18, h: 11, dur: '10s', del: '3.5s', dx: '-48px', dy: '-185px', rs: '-15deg', re: '-60deg', op: '0.50' },
  { id: 6, El: LeafA, fill: '#2D6A4F',  bottom: '48%', left:  '7%',  w: 13, h: 18, dur: '7.5s',del: '6s',   dx:  '32px', dy: '-130px', rs: '8deg',   re: '58deg',  op: '0.35' },
  { id: 7, El: Seed,  fill: '#52B788',  bottom: '60%', right: '14%', w:  6, h:  6, dur: '14s', del: '0.8s', dx: '-18px', dy: '-160px', rs: '0deg',   re: '90deg',  op: '0.30' },
]

// ── Main botanical illustration ──────────────────────────────────
function BotanicalPlant() {
  return (
    <svg className="auth-plant-main" viewBox="0 0 260 390" fill="none"
      style={{ width: '100%', maxWidth: 220 }} aria-hidden="true">
      {/* ─ Stem ─ */}
      <path d="M130 380 C128 315 121 235 114 65"
        stroke="#3a8060" strokeWidth="3.2" strokeLinecap="round" />

      {/* ─ Large leaf bottom-left ─ */}
      <path d="M124 265 C78 248 40 218 36 180 C32 142 60 118 90 138 C114 154 124 240 124 265Z"
        fill="#1e5438" />
      <path d="M124 265 C78 205 55 160 68 130" stroke="#2D6A4F" strokeWidth="1.1" fill="none" opacity="0.6"/>
      <path d="M106 235 C76 222 61 198 66 178" stroke="#2D6A4F" strokeWidth="0.75" fill="none" opacity="0.4"/>
      <path d="M95 208 C70 200 57 182 63 163"  stroke="#2D6A4F" strokeWidth="0.75" fill="none" opacity="0.4"/>

      {/* ─ Large leaf right ─ */}
      <path d="M120 198 C170 180 212 154 218 114 C224 74 198 50 169 68 C143 83 124 175 120 198Z"
        fill="#1e5438" />
      <path d="M120 198 C168 150 192 106 184 72" stroke="#2D6A4F" strokeWidth="1.1" fill="none" opacity="0.5"/>
      <path d="M142 178 C178 158 192 130 186 106" stroke="#2D6A4F" strokeWidth="0.75" fill="none" opacity="0.35"/>

      {/* ─ Mid leaf left ─ */}
      <path d="M117 138 C80 120 55 92 58 62 C61 33 88 22 110 38 C128 52 120 115 117 138Z"
        fill="#2D6A4F" />
      <path d="M117 138 C82 108 68 76 78 46" stroke="#3d8c67" strokeWidth="0.9" fill="none" opacity="0.55"/>

      {/* ─ Upper leaf right ─ */}
      <path d="M115 90 C150 73 170 49 166 24 C162 2 142 -4 124 11 C110 24 113 70 115 90Z"
        fill="#2D6A4F" />
      <path d="M115 90 C147 63 160 37 154 14" stroke="#3d8c67" strokeWidth="0.8" fill="none" opacity="0.5"/>

      {/* ─ Accent leaf small left ─ */}
      <path d="M121 308 C88 292 74 266 79 246 C84 228 104 224 118 238 C127 250 122 292 121 308Z"
        fill="#52B788" opacity="0.8"/>

      {/* ─ Tiny accent leaf right ─ */}
      <path d="M122 168 C142 155 158 135 155 112 C152 91 135 88 124 102 C118 112 120 155 122 168Z"
        fill="#52B788" opacity="0.65"/>

      {/* ─ Bud at top ─ */}
      <ellipse cx="112" cy="54" rx="7.5" ry="12" fill="#95C4A0" transform="rotate(-20 112 54)" />
      <ellipse cx="112" cy="54" rx="3.5" ry="6.5" fill="#D4E6D9" transform="rotate(-20 112 54)" opacity="0.65" />

      {/* ─ Ground grass ─ */}
      <path d="M98 380 C94 354 89 328 86 308"  stroke="#52B788" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M162 380 C167 348 174 320 178 298" stroke="#2D6A4F" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M114 380 C111 356 106 336 103 319" stroke="#52B788" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M148 380 C151 354 157 332 162 316" stroke="#2D6A4F" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M80 380 C77 358 73 344 71 330"  stroke="#3d8c67" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M180 380 C183 360 188 346 191 334" stroke="#3d8c67" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.7"/>
    </svg>
  )
}

// ── Left panel ───────────────────────────────────────────────────
function BotanicalLeft() {
  return (
    <div className="auth-left-panel">
      {/* Particles */}
      {PARTICLES.map(({ id, El, fill, bottom, left, right, w, h, dur, del, dx, dy, rs, re, op }) => (
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
          <El fill={fill} />
        </div>
      ))}

      {/* Main plant illustration */}
      <div className="auth-plant-container">
        <BotanicalPlant />
      </div>

      {/* Bottom content */}
      <div className="auth-left-bottom">
        <div className="auth-logo-mark">
          <svg width="20" height="26" viewBox="0 0 22 28" fill="none" aria-hidden="true">
            <path d="M11 26C11 26 3 19 3.5 10.5C4 3 11 1.5 11 1.5C11 1.5 18 3 18.5 10.5C19 19 11 26 11 26Z"
              fill="#95C4A0" />
            <line x1="11" y1="26" x2="11" y2="5" stroke="#1a3d2b" strokeWidth="1.2" />
          </svg>
          <span>HabitPet</span>
        </div>

        <blockquote className="auth-quote">
          «Каждая привычка —<br />это семя»
        </blockquote>
        <p className="auth-subquote">Поливайте их каждый день, и сад расцветёт</p>

        <div className="auth-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}

// ── Login page ───────────────────────────────────────────────────
export default function LoginPage() {
  const [form, setForm]               = useState({ email: '', password: '' })
  const [errors, setErrors]           = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setServerError('')
    try {
      const user = await loginApi(form)
      login(user)
      navigate('/')
    } catch (err) {
      setServerError(err.detail ?? 'Ошибка входа. Проверьте данные.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <BotanicalLeft />

      <div className="auth-right-panel">
        {/* Mobile logo */}
        <div className="auth-mobile-logo">
          <svg width="20" height="26" viewBox="0 0 22 28" fill="none" aria-hidden="true">
            <path d="M11 26C11 26 3 19 3.5 10.5C4 3 11 1.5 11 1.5C11 1.5 18 3 18.5 10.5C19 19 11 26 11 26Z"
              fill="#2D6A4F" />
            <line x1="11" y1="26" x2="11" y2="5" stroke="#FFFDF7" strokeWidth="1.2" />
          </svg>
          <span style={{ fontFamily: '"Playfair Display",serif', fontWeight: 700, color: '#2D6A4F', fontSize: '1.1rem' }}>
            HabitPet
          </span>
        </div>

        <div className="auth-form-wrapper">
          <h1 className="auth-form-title">Войти</h1>
          <p className="auth-form-subtitle">Продолжите ухаживать за своим садом</p>

          {serverError && (
            <div className="auth-server-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
                <path d="M7.5 1a6.5 6.5 0 100 13A6.5 6.5 0 007.5 1zm.625 9.625h-1.25V9.25h1.25v1.375zm0-2.75h-1.25V4.125h1.25v3.75z" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="anim-1">
              <FloatField
                id="login-email"
                label="Электронная почта"
                type="email" autoComplete="email" autoFocus
                value={form.email} onChange={set('email')}
                error={errors.email}
              />
            </div>
            <div className="anim-2">
              <FloatField
                id="login-password"
                label="Пароль"
                type="password" autoComplete="current-password"
                value={form.password} onChange={set('password')}
                error={errors.password}
              />
            </div>
            <div className="anim-3">
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-block', width: 16, height: 16,
                      border: '2px solid rgba(255,253,247,0.35)', borderTopColor: '#FFFDF7',
                      borderRadius: '50%', animation: 'spin 0.75s linear infinite',
                    }} />
                    Прорастает…
                  </span>
                ) : 'Войти в сад →'}
              </button>
            </div>
          </form>

          <div className="auth-form-footer">
            <span>Впервые здесь?</span>
            <Link to="/register" className="auth-link">Посадить первое семя</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

function validate(form) {
  const e = {}
  if (!form.email)                            e.email    = 'Укажите адрес почты'
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Некорректный email'
  if (!form.password)                         e.password = 'Укажите пароль'
  else if (form.password.length < 8)          e.password = 'Минимум 8 символов'
  if (form.password !== form.confirm)         e.confirm  = 'Пароли не совпадают'
  return e
}

// Floating-label input — same as Login
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

// Password strength meter
function PasswordStrength({ password }) {
  if (!password) return null
  const strength =
    password.length >= 12 && /[A-Z]/.test(password) && /[0-9!@#$%]/.test(password) ? 3
    : password.length >= 8 ? 2
    : 1
  const cfg = [
    null,
    { label: 'Слабый',   color: '#C1440E', width: '33%'  },
    { label: 'Хороший',  color: '#C49A3C', width: '66%'  },
    { label: 'Сильный',  color: '#2D6A4F', width: '100%' },
  ][strength]

  return (
    <div style={{ marginTop: 8 }}>
      <div className="auth-strength-bar">
        <div className="auth-strength-fill" style={{ width: cfg.width, background: cfg.color }} />
      </div>
      <p className="auth-strength-label" style={{ color: cfg.color }}>{cfg.label}</p>
    </div>
  )
}

// Botanical illustration for the card header — compact version
function HeaderPlant() {
  return (
    <svg viewBox="0 0 320 130" fill="none" aria-hidden="true"
      style={{ width: '100%', height: 130, display: 'block' }}>
      {/* Left branch */}
      <path d="M80 130 C78 105 72 80 65 55" stroke="#3d8c67" strokeWidth="2" strokeLinecap="round" />
      <path d="M65 90 C65 90 35 80 28 60 C22 43 38 32 55 44 C66 52 66 78 65 90Z" fill="#2D6A4F" />
      <path d="M65 70 C65 70 90 62 95 45 C100 30 85 22 72 33 C64 41 65 61 65 70Z" fill="#52B788" />
      <path d="M65 55 C55 42 50 28 55 18 C59 9 72 6 78 16 C82 24 70 44 65 55Z" fill="#3d8c67" />
      {/* Small leaves left */}
      <path d="M72 118 C58 112 50 100 54 90 C57 82 68 82 74 91 C77 99 73 112 72 118Z" fill="#95C4A0" opacity="0.8"/>

      {/* Right branch */}
      <path d="M240 130 C242 105 248 80 255 55" stroke="#3d8c67" strokeWidth="2" strokeLinecap="round" />
      <path d="M255 90 C255 90 285 80 292 60 C298 43 282 32 265 44 C254 52 254 78 255 90Z" fill="#2D6A4F" />
      <path d="M255 70 C255 70 230 62 225 45 C220 30 235 22 248 33 C256 41 255 61 255 70Z" fill="#52B788" />
      <path d="M255 55 C265 42 270 28 265 18 C261 9 248 6 242 16 C238 24 250 44 255 55Z" fill="#3d8c67" />
      {/* Small leaves right */}
      <path d="M248 118 C262 112 270 100 266 90 C263 82 252 82 246 91 C243 99 247 112 248 118Z" fill="#95C4A0" opacity="0.8"/>

      {/* Center small plant */}
      <path d="M160 130 C158 112 154 92 150 75" stroke="#52B788" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M150 100 C140 92 132 78 136 66 C139 56 152 54 158 64 C162 72 154 92 150 100Z" fill="#3d8c67" />
      <path d="M150 80 C160 72 168 60 165 48 C162 38 149 36 144 46 C140 54 148 72 150 80Z" fill="#52B788" />

      {/* Floating seeds/particles */}
      <circle cx="110" cy="45" r="3" fill="#95C4A0" opacity="0.6" />
      <circle cx="200" cy="30" r="2" fill="#95C4A0" opacity="0.45" />
      <circle cx="40"  cy="35" r="2.5" fill="#52B788" opacity="0.4" />
      <circle cx="280" cy="55" r="2" fill="#52B788" opacity="0.35" />
      <circle cx="170" cy="15" r="1.5" fill="#D4E6D9" opacity="0.6" />
    </svg>
  )
}

// ── Organic wave: cream-colored SVG path that "bleeds" from green into cream ──
function OrganicWave() {
  return (
    <svg className="auth-wave-divider" viewBox="0 0 420 44"
      preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 44 L0 22 Q35 0 70 18 Q105 36 140 14 Q175 0 210 20 Q245 38 280 12 Q315 0 350 22 Q385 40 420 18 L420 44Z"
        fill="#FFFDF7"
      />
    </svg>
  )
}

// ── Register page ────────────────────────────────────────────────
export default function RegisterPage() {
  const [form, setForm]               = useState({ email: '', password: '', confirm: '' })
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
      const user = await registerApi({
        email:         form.email,
        password:      form.password,
        auth_provider: 'local',
        timezone:      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        locale:        navigator.language?.slice(0, 2) || 'en',
      })
      login(user)
      navigate('/')
    } catch (err) {
      setServerError(err.detail ?? 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-register-page">
      <div className="auth-register-card">

        {/* ── Green header with botanical illustration ── */}
        <div className="auth-register-header">
          {/* Top row: logo + link */}
          <div className="auth-register-header-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
              <svg width="18" height="23" viewBox="0 0 22 28" fill="none" aria-hidden="true">
                <path d="M11 26C11 26 3 19 3.5 10.5C4 3 11 1.5 11 1.5C11 1.5 18 3 18.5 10.5C19 19 11 26 11 26Z"
                  fill="#95C4A0" />
                <line x1="11" y1="26" x2="11" y2="5" stroke="#1a3d2b" strokeWidth="1.2" />
              </svg>
              <span style={{
                fontFamily: '"Playfair Display",serif',
                fontWeight: 700, fontSize: '1rem',
                color: '#95C4A0', letterSpacing: '0.02em',
              }}>HabitPet</span>
            </div>
            <Link to="/login" style={{
              fontFamily: 'Lato, sans-serif', fontSize: '0.75rem',
              color: '#95C4A0', position: 'relative', zIndex: 1,
              textDecoration: 'none', letterSpacing: '0.04em',
            }}>
              Уже есть аккаунт →
            </Link>
          </div>

          {/* Illustration */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <HeaderPlant />
          </div>

          {/* Title inside green header */}
          <p className="auth-register-title">Посадить первое семя</p>

          {/* Organic wave transition */}
          <OrganicWave />
        </div>

        {/* ── Cream form body ── */}
        <div className="auth-register-body">
          {serverError && (
            <div className="auth-server-error anim-1" role="alert" style={{ marginBottom: '1.5rem' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
                <path d="M7.5 1a6.5 6.5 0 100 13A6.5 6.5 0 007.5 1zm.625 9.625h-1.25V9.25h1.25v1.375zm0-2.75h-1.25V4.125h1.25v3.75z" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '1.65rem' }}>

            <div className="anim-1">
              <FloatField
                id="reg-email"
                label="Электронная почта"
                type="email" autoComplete="email" autoFocus
                value={form.email} onChange={set('email')}
                error={errors.email}
              />
            </div>

            <div className="anim-2">
              <FloatField
                id="reg-password"
                label="Пароль"
                type="password" autoComplete="new-password"
                value={form.password} onChange={set('password')}
                error={errors.password}
              />
              <PasswordStrength password={form.password} />
            </div>

            <div className="anim-3">
              <FloatField
                id="reg-confirm"
                label="Повторите пароль"
                type="password" autoComplete="new-password"
                value={form.confirm} onChange={set('confirm')}
                error={errors.confirm}
              />
            </div>

            <div className="anim-4" style={{ paddingTop: 4 }}>
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
                ) : '🌱 Создать аккаунт'}
              </button>
            </div>
          </form>

          <div className="auth-form-footer anim-5" style={{ marginTop: '1.5rem' }}>
            <span>Уже есть аккаунт?</span>
            <Link to="/login" className="auth-link">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

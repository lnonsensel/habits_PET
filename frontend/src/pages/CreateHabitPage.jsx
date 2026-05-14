import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createHabit } from '../api/habits'
import { useAuth } from '../context/AuthContext'

const PERIODICITY = [
  {
    value: 'daily',
    label: 'Ежедневно',
    desc: 'Каждый день',
    iconBg: '#D4E6D9',
    iconColor: '#2D6A4F',
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="4" fill="#2D6A4F"/>
        <line x1="10" y1="1.5" x2="10" y2="3.5" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="10" y1="16.5" x2="10" y2="18.5" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="1.5" y1="10" x2="3.5" y2="10" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="16.5" y1="10" x2="18.5" y2="10" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="3.8" y1="3.8" x2="5.2" y2="5.2" stroke="#2D6A4F" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="14.8" y1="14.8" x2="16.2" y2="16.2" stroke="#2D6A4F" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="14.8" y1="5.2" x2="16.2" y2="3.8" stroke="#2D6A4F" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="3.8" y1="16.2" x2="5.2" y2="14.8" stroke="#2D6A4F" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    value: 'weekly',
    label: 'Еженедельно',
    desc: 'Раз в неделю',
    iconBg: '#E8EDCF',
    iconColor: '#5A6E28',
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 17C10 17 3 12.5 3.5 8C4 3.5 10 2 10 2C10 2 16 3.5 16.5 8C17 12.5 10 17 10 17Z" fill="#5A6E28"/>
        <line x1="10" y1="17" x2="10" y2="4" stroke="#E8EDCF" strokeWidth="1.1"/>
        <line x1="10" y1="12" x2="6.5" y2="9" stroke="#E8EDCF" strokeWidth="0.9" opacity="0.7"/>
        <line x1="10" y1="9" x2="13.5" y2="6.5" stroke="#E8EDCF" strokeWidth="0.9" opacity="0.7"/>
      </svg>
    ),
  },
  {
    value: 'monthly',
    label: 'Ежемесячно',
    desc: 'Раз в месяц',
    iconBg: '#EFE0C8',
    iconColor: '#7A4E1E',
    Icon: () => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M11.5 2C8 2 5 5 5 9C5 13 8 16 11.5 16C13.5 16 15.2 15.1 16.4 13.7C14.6 14.2 12.5 13.9 11 12.5C8.5 10.5 8 7.5 9.5 5.2C10.4 3.8 11.7 2.8 13.2 2.3C12.7 2.1 12.1 2 11.5 2Z" fill="#7A4E1E"/>
      </svg>
    ),
  },
]

function validate(form) {
  const e = {}
  if (!form.name.trim()) e.name = 'Назовите свою привычку'
  if (!form.unit.trim()) e.unit = 'Укажите единицу измерения'
  if (form.target_value !== '' && isNaN(Number(form.target_value)))
    e.target_value = 'Введите число'
  return e
}

// Re-use the same floating label input from auth
function FloatField({ id, label, error, value, onChange, type = 'text', placeholder, autoFocus, min, step }) {
  return (
    <div className={`float-field${error ? ' has-error' : ''}`}>
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder=" " autoFocus={autoFocus}
        min={min} step={step}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <label htmlFor={id}>{label}</label>
      <span className="float-underline" aria-hidden="true" />
      {error && (
        <p id={`${id}-err`} className="float-error" role="alert">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm.5 9h-1V7.5h1V9zm0-3h-1V3h1v3z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// Section label
function SectionLabel({ icon, children }) {
  return (
    <div className="create-section-label">
      {icon}
      {children}
    </div>
  )
}

export default function CreateHabitPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({
    name: '', description: '', unit: '', periodicity: 'daily', target_value: '',
  })
  const [errors, setErrors]           = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)

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
      await createHabit({
        user_id:      user.id,
        name:         form.name.trim(),
        description:  form.description.trim() || undefined,
        unit:         form.unit.trim(),
        periodicity:  form.periodicity,
        target_value: form.target_value !== '' ? Number(form.target_value) : null,
      })
      navigate('/')
    } catch (err) {
      setServerError(err.detail ?? 'Ошибка создания привычки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, animation: 'fadeIn 0.4s ease-out both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Назад"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1.5px solid var(--garden-border)',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--garden-soil)', flexShrink: 0,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--garden-mist)'; e.currentTarget.style.borderColor = 'var(--garden-leaf)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--garden-border)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 7H4M7 4L4 7l3 3"/>
          </svg>
        </button>
        <div>
          <h1 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.75rem', fontWeight: 700,
            color: 'var(--garden-bark)', margin: 0, lineHeight: 1.2,
          }}>
            Новая привычка
          </h1>
          <div className="page-header-rule" style={{ marginTop: 8, maxWidth: 160 }} />
        </div>
      </div>

      {serverError && (
        <div className="auth-server-error" style={{ marginBottom: '1.5rem' }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
            <path d="M7.5 1a6.5 6.5 0 100 13A6.5 6.5 0 007.5 1zm.625 9.625h-1.25V9.25h1.25v1.375zm0-2.75h-1.25V4.125h1.25v3.75z"/>
          </svg>
          {serverError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--garden-cream)',
          border: '1px solid var(--garden-border)',
          borderRadius: 20,
          padding: '28px 28px 24px',
          display: 'flex', flexDirection: 'column', gap: 28,
          boxShadow: '2px 4px 14px rgba(45,106,79,0.08)',
        }}
      >
        {/* ── Section 1: Name & Description ── */}
        <div>
          <SectionLabel
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="#2D6A4F" opacity="0.7">
                <path d="M7 12.5C7 12.5 1.5 8.5 2 5C2.5 1.5 7 1 7 1C7 1 11.5 1.5 12 5C12.5 8.5 7 12.5 7 12.5Z"/>
              </svg>
            }
          >
            Описание привычки
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FloatField
              id="h-name" label="Название *" autoFocus
              value={form.name} onChange={set('name')} error={errors.name}
            />
            <FloatField
              id="h-desc" label="Описание"
              value={form.description} onChange={set('description')}
            />
          </div>
        </div>

        {/* divider */}
        <div className="page-header-rule" />

        {/* ── Section 2: Metrics ── */}
        <div>
          <SectionLabel
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke="#2D6A4F" strokeWidth="1.5" opacity="0.7">
                <circle cx="7" cy="7" r="5.5"/>
                <path d="M7 4.5v3l2 2" strokeLinecap="round"/>
              </svg>
            }
          >
            Измерение
          </SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <FloatField
              id="h-unit" label="Единица *"
              value={form.unit} onChange={set('unit')} error={errors.unit}
            />
            <FloatField
              id="h-target" label="Цель" type="number" min="0" step="any"
              value={form.target_value} onChange={set('target_value')} error={errors.target_value}
            />
          </div>
        </div>

        {/* divider */}
        <div className="page-header-rule" />

        {/* ── Section 3: Periodicity ── */}
        <div>
          <SectionLabel
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke="#2D6A4F" strokeWidth="1.5" opacity="0.7">
                <rect x="2" y="3" width="10" height="9" rx="1.5"/>
                <path d="M2 6h10M5 1.5v3M9 1.5v3" strokeLinecap="round"/>
              </svg>
            }
          >
            Как часто поливать?
          </SectionLabel>
          <div className="create-period-grid">
            {PERIODICITY.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`create-period-card${form.periodicity === opt.value ? ' selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, periodicity: opt.value }))}
              >
                <div className="create-period-icon" style={{ background: opt.iconBg }}>
                  <opt.Icon />
                </div>
                <span className="create-period-name">{opt.label}</span>
                <span className="create-period-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <button type="submit" className="auth-submit"
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            disabled={loading}>
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block', width: 14, height: 14,
                  border: '2px solid rgba(255,253,247,0.35)', borderTopColor: '#FFFDF7',
                  borderRadius: '50%', animation: 'spin 0.75s linear infinite',
                }} />
                Прорастает…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 11C6.5 11 2 7.5 2.5 5C3 2.5 6.5 2 6.5 2C6.5 2 10 2.5 10.5 5C11 7.5 6.5 11 6.5 11Z" fill="currentColor"/>
                </svg>
                Посадить привычку
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 20px', borderRadius: 999,
              border: '1.5px solid var(--garden-border)',
              background: 'transparent',
              color: 'var(--garden-soil)',
              fontFamily: 'Lato, sans-serif', fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(214,201,182,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { getAdminStats } from '../../api/admin'

const CARDS = [
  { key: 'users_total',           label: 'Пользователей',        color: '#D4E6D9', icon: '◉' },
  { key: 'users_active_today',    label: 'Активных сегодня',     color: '#E8EDCF', icon: '◈' },
  { key: 'habits_total',          label: 'Привычек',             color: '#D4E6D9', icon: '◇' },
  { key: 'records_today',         label: 'Записей сегодня',      color: '#E8EDCF', icon: '◆' },
  { key: 'notifications_pending', label: 'Уведомлений ожидает',  color: '#FFF3CD', icon: '◎' },
  { key: 'notifications_failed',  label: 'Уведомлений с ошибкой', color: '#FDECEA', icon: '◉' },
]

export default function AdminDashboard() {
  const { authHeader } = useAdminAuth()
  const [stats, setStats]   = useState(null)
  const [error, setError]   = useState('')

  useEffect(() => {
    getAdminStats(authHeader)
      .then(setStats)
      .catch(() => setError('Не удалось загрузить статистику'))
  }, [authHeader])

  return (
    <div>
      <h1 style={headingStyle}>Dashboard</h1>
      {error && <p style={{ color: '#C0392B', fontFamily: 'Lato, sans-serif' }}>{error}</p>}

      {stats ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 20, marginTop: 24,
        }}>
          {CARDS.map(({ key, label, color, icon }) => (
            <div key={key} style={{
              background: '#FFFDF7',
              border: '1px solid rgba(214,201,182,0.5)',
              borderRadius: 14,
              padding: '20px 22px',
              boxShadow: '0 2px 8px rgba(60,48,36,0.05)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', marginBottom: 12,
              }}>
                {icon}
              </div>
              <div style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700, fontSize: '1.8rem',
                color: '#1B3A2D', lineHeight: 1,
              }}>
                {stats[key] ?? '—'}
              </div>
              <div style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.78rem', color: '#7A6552',
                marginTop: 6,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      ) : !error ? (
        <p style={{ fontFamily: 'Lato, sans-serif', color: '#7A6552' }}>Загрузка…</p>
      ) : null}
    </div>
  )
}

const headingStyle = {
  fontFamily: '"Playfair Display", serif',
  fontWeight: 700, fontSize: '1.6rem',
  color: '#1B3A2D', margin: 0,
}

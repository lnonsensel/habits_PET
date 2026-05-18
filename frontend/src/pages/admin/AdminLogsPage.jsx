import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { getAdminLogs } from '../../api/admin'

const EVENT_FILTERS = [
  { value: 'all',           label: 'Все события' },
  { value: 'habit_created', label: 'Привычка создана' },
  { value: 'record_added',  label: 'Запись добавлена' },
  { value: 'login',         label: 'Вход' },
  { value: 'api_call',      label: 'API вызов' },
]

const EVENT_LABELS = {
  habit_created: 'Привычка создана',
  record_added:  'Запись добавлена',
  login:         'Вход',
  api_call:      'API вызов',
}

export default function AdminLogsPage() {
  const { authHeader } = useAdminAuth()
  const [logs, setLogs]       = useState([])
  const [filter, setFilter]   = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = { limit: 200, ...(filter !== 'all' ? { filter_event: filter } : {}) }
    getAdminLogs(authHeader, params)
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [authHeader, filter])

  return (
    <div>
      <h1 style={headingStyle}>Логи</h1>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '20px 0' }}>
        {EVENT_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              padding: '6px 14px', borderRadius: 999, border: '1px solid',
              borderColor: filter === value ? '#2D6A4F' : 'rgba(214,201,182,0.6)',
              background: filter === value ? '#2D6A4F' : 'transparent',
              color: filter === value ? '#FFFDF7' : '#7A6552',
              fontFamily: 'Lato, sans-serif', fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={mutedStyle}>Загрузка…</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {['Пользователь', 'Событие', 'IP', 'Контекст', 'Время'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#7A6552' }}>
                Логов нет
              </td></tr>
            ) : logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(214,201,182,0.3)' }}>
                <td style={tdStyle}>{log.user_email}</td>
                <td style={tdStyle}>
                  <span style={pillStyle}>{EVENT_LABELS[log.event] ?? log.event}</span>
                </td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.78rem', color: '#7A6552' }}>
                  {log.ip ?? '—'}
                </td>
                <td style={{ ...tdStyle, fontSize: '0.72rem', color: '#7A6552', maxWidth: 220 }}>
                  {log.context && Object.keys(log.context).length > 0
                    ? JSON.stringify(log.context).slice(0, 60)
                    : '—'}
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: '#7A6552', fontSize: '0.78rem' }}>
                  {log.created_at ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const headingStyle = { fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '1.6rem', color: '#1B3A2D', margin: 0 }
const mutedStyle   = { fontFamily: 'Lato, sans-serif', color: '#7A6552' }
const tableStyle   = { width: '100%', borderCollapse: 'collapse', background: '#FFFDF7', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(214,201,182,0.4)' }
const thStyle      = { padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#7A6552', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', background: '#F7F5F0', borderBottom: '1px solid rgba(214,201,182,0.4)' }
const tdStyle      = { padding: '11px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.82rem', color: '#3C3024' }
const pillStyle    = { display: 'inline-block', padding: '2px 8px', background: 'rgba(82,183,136,0.12)', color: '#2D6A4F', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }

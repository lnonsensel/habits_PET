import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { getAdminNotifications, retryNotification } from '../../api/admin'

const STATUS_FILTERS = [
  { value: 'all',     label: 'Все' },
  { value: 'pending', label: 'Ожидают' },
  { value: 'failed',  label: 'Ошибка' },
  { value: 'sent',    label: 'Отправлено' },
]

const STATUS_COLORS = {
  pending: { bg: '#FFF3CD', fg: '#856404' },
  failed:  { bg: '#FDECEA', fg: '#C0392B' },
  sent:    { bg: '#D4E6D9', fg: '#2D6A4F' },
}

export default function AdminNotifsPage() {
  const { authHeader } = useAdminAuth()
  const [items, setItems]         = useState([])
  const [filter, setFilter]       = useState('all')
  const [loading, setLoading]     = useState(true)
  const [retrying, setRetrying]   = useState(null)

  const load = (f = filter) => {
    setLoading(true)
    const params = { limit: 100, ...(f !== 'all' ? { filter_status: f } : {}) }
    getAdminNotifications(authHeader, params)
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [authHeader, filter]) // eslint-disable-line

  const handleRetry = async (id) => {
    setRetrying(id)
    try {
      await retryNotification(authHeader, id)
      setItems(prev => prev.map(n => n.id === id ? { ...n, status: 'pending', retry_count: 0 } : n))
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div>
      <h1 style={headingStyle}>Уведомления</h1>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, margin: '20px 0' }}>
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              border: '1px solid',
              borderColor: filter === value ? '#2D6A4F' : 'rgba(214,201,182,0.6)',
              background: filter === value ? '#2D6A4F' : 'transparent',
              color: filter === value ? '#FFFDF7' : '#7A6552',
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.8rem', fontWeight: 600,
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
              {['Email', 'Канал', 'Событие', 'Статус', 'Попытки', 'Payload', ''].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#7A6552' }}>
                Уведомлений нет
              </td></tr>
            ) : items.map(n => {
              const sc = STATUS_COLORS[n.status] ?? { bg: '#F0EDE8', fg: '#7A6552' }
              return (
                <tr key={n.id} style={{ borderBottom: '1px solid rgba(214,201,182,0.3)' }}>
                  <td style={tdStyle}>{n.user_email}</td>
                  <td style={tdStyle}>{n.channel}</td>
                  <td style={tdStyle}>{n.event}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '2px 8px', borderRadius: 999, background: sc.bg, color: sc.fg, fontSize: '0.72rem', fontWeight: 600 }}>
                      {n.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{n.retry_count}</td>
                  <td style={{ ...tdStyle, fontSize: '0.72rem', color: '#7A6552', maxWidth: 200 }}>
                    {n.payload && Object.keys(n.payload).length > 0
                      ? JSON.stringify(n.payload).slice(0, 60) + (JSON.stringify(n.payload).length > 60 ? '…' : '')
                      : '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {(n.status === 'pending' || n.status === 'failed') && (
                      <button
                        onClick={() => handleRetry(n.id)}
                        disabled={retrying === n.id}
                        style={{
                          padding: '4px 12px',
                          background: retrying === n.id ? '#A8C5B3' : '#2D6A4F',
                          color: '#FFFDF7', border: 'none', borderRadius: 7,
                          fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                          cursor: retrying === n.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {retrying === n.id ? '…' : 'Retry'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
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

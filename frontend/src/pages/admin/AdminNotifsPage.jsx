import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { getAdminNotifications, retryNotification, sendBroadcast, getAdminUsers } from '../../api/admin'
import { EVENT_META } from '../../context/NotificationContext'

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

const EVENTS   = ['goal_completed', 'daily_remainder', 'streak_lost', 'summary_weekly']
const CHANNELS = ['email', 'push', 'webhook']

// ── Broadcast form ────────────────────────────────────────────────

function BroadcastForm({ authHeader, onSent }) {
  const [open, setOpen]           = useState(false)
  const [mode, setMode]           = useState('all')       // 'all' | 'select'
  const [users, setUsers]         = useState([])
  const [usersLoaded, setLoaded]  = useState(false)
  const [selected, setSelected]   = useState(new Set())
  const [search, setSearch]       = useState('')
  const [event, setEvent]         = useState('daily_remainder')
  const [channel, setChannel]     = useState('email')
  const [payload, setPayload]     = useState('{}')
  const [sending, setSending]     = useState(false)
  const [result, setResult]       = useState(null)  // { ok, message }

  const loadUsers = () => {
    if (usersLoaded) return
    getAdminUsers(authHeader, { limit: 500 }).then(data => {
      setUsers(data)
      setLoaded(true)
    })
  }

  const handleModeChange = (m) => {
    setMode(m)
    if (m === 'select') loadUsers()
  }

  const toggleUser = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setResult(null)

    // Validate JSON payload
    let parsedPayload
    try { parsedPayload = JSON.parse(payload) }
    catch { setResult({ ok: false, message: 'Payload — невалидный JSON' }); return }

    const recipients = mode === 'all' ? 'all' : [...selected]
    if (mode === 'select' && recipients.length === 0) {
      setResult({ ok: false, message: 'Выберите хотя бы одного получателя' })
      return
    }

    setSending(true)
    try {
      const res = await sendBroadcast(authHeader, { recipients, event, channel, payload: parsedPayload })
      setResult({ ok: true, message: `Отправлено ${res.created} пользователям` })
      setOpen(false)
      setSelected(new Set())
      setPayload('{}')
      onSent()
    } catch (err) {
      setResult({ ok: false, message: err.detail ?? 'Ошибка отправки' })
    } finally {
      setSending(false)
    }
  }

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => { setOpen(v => !v); setResult(null) }}
          style={{
            padding: '8px 18px',
            background: open ? '#F7F5F0' : '#2D6A4F',
            color: open ? '#2D6A4F' : '#FFFDF7',
            border: `1px solid ${open ? '#2D6A4F' : 'transparent'}`,
            borderRadius: 8,
            fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {open ? '✕ Закрыть' : '+ Новая рассылка'}
        </button>

        {result && (
          <span style={{
            fontFamily: 'Lato, sans-serif', fontSize: '0.82rem',
            color: result.ok ? '#2D6A4F' : '#C0392B',
            fontWeight: 600,
          }}>
            {result.ok ? '✓' : '✗'} {result.message}
          </span>
        )}
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 16,
            background: '#FFFDF7',
            border: '1px solid rgba(214,201,182,0.5)',
            borderRadius: 12,
            padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          {/* Recipients mode */}
          <div>
            <label style={labelStyle}>Получатели</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {[['all', 'Все пользователи'], ['select', 'Выбранные']].map(([v, l]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Lato, sans-serif', fontSize: '0.84rem', color: '#3C3024' }}>
                  <input type="radio" name="mode" value={v} checked={mode === v}
                    onChange={() => handleModeChange(v)} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          {/* User selector */}
          {mode === 'select' && (
            <div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по email…"
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 8 }}
              />
              <div style={{
                maxHeight: 180, overflowY: 'auto',
                border: '1px solid rgba(214,201,182,0.6)', borderRadius: 8,
              }}>
                {!usersLoaded ? (
                  <div style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.82rem', color: '#7A6552' }}>
                    Загрузка…
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div style={{ padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.82rem', color: '#7A6552' }}>
                    Пользователи не найдены
                  </div>
                ) : filteredUsers.map(u => (
                  <label key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(214,201,182,0.2)',
                    background: selected.has(u.id) ? 'rgba(82,183,136,0.07)' : 'transparent',
                    fontFamily: 'Lato, sans-serif', fontSize: '0.82rem', color: '#3C3024',
                  }}>
                    <input type="checkbox" checked={selected.has(u.id)}
                      onChange={() => toggleUser(u.id)} />
                    {u.email}
                  </label>
                ))}
              </div>
              {selected.size > 0 && (
                <div style={{ marginTop: 6, fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#2D6A4F', fontWeight: 600 }}>
                  Выбрано: {selected.size}
                </div>
              )}
            </div>
          )}

          {/* Event + Channel row */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Событие</label>
              <select value={event} onChange={e => setEvent(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                {EVENTS.map(ev => (
                  <option key={ev} value={ev}>
                    {EVENT_META[ev]?.icon} {EVENT_META[ev]?.label ?? ev}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Канал</label>
              <select value={channel} onChange={e => setChannel(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
          </div>

          {/* Payload */}
          <div>
            <label style={labelStyle}>Payload (JSON)</label>
            <textarea
              value={payload}
              onChange={e => setPayload(e.target.value)}
              rows={3}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="submit"
              disabled={sending}
              style={{
                padding: '9px 22px',
                background: sending ? '#A8C5B3' : '#2D6A4F',
                color: '#FFFDF7', border: 'none', borderRadius: 8,
                fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', fontWeight: 700,
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? 'Отправляем…' : 'Отправить'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}


// ── Main page ─────────────────────────────────────────────────────

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

      <BroadcastForm authHeader={authHeader} onSent={() => load(filter)} />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              padding: '6px 16px', borderRadius: 999, border: '1px solid',
              borderColor: filter === value ? '#2D6A4F' : 'rgba(214,201,182,0.6)',
              background: filter === value ? '#2D6A4F' : 'transparent',
              color: filter === value ? '#FFFDF7' : '#7A6552',
              fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', fontWeight: 600,
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
const labelStyle   = { display: 'block', fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#7A6552', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }
const inputStyle   = { padding: '8px 12px', border: '1px solid rgba(214,201,182,0.8)', borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', outline: 'none', background: '#FAFAF7', color: '#3C3024' }
const tableStyle   = { width: '100%', borderCollapse: 'collapse', background: '#FFFDF7', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(214,201,182,0.4)' }
const thStyle      = { padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#7A6552', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', background: '#F7F5F0', borderBottom: '1px solid rgba(214,201,182,0.4)' }
const tdStyle      = { padding: '11px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.82rem', color: '#3C3024' }

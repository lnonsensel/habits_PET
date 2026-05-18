import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { getAdminHabits } from '../../api/admin'

const PERIOD_LABELS = { daily: 'Ежедневно', weekly: 'Еженедельно', monthly: 'Ежемесячно' }

export default function AdminHabitsPage() {
  const { authHeader } = useAdminAuth()
  const [habits, setHabits]   = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)

  const load = (q = '') => {
    setLoading(true)
    const params = { limit: 100, ...(q ? { search: q } : {}) }
    getAdminHabits(authHeader, params)
      .then(setHabits)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [authHeader]) // eslint-disable-line

  const handleSearch = (e) => { e.preventDefault(); load(search) }

  return (
    <div>
      <h1 style={headingStyle}>Привычки</h1>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, margin: '20px 0' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по email пользователя…"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="submit" style={{ padding: '8px 18px', background: '#2D6A4F', color: '#FFFDF7', border: 'none', borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          Найти
        </button>
      </form>

      {loading ? (
        <p style={mutedStyle}>Загрузка…</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {['Пользователь', 'Привычка', 'Периодичность', 'Цель', 'Записей', 'Создана'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.length === 0 ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#7A6552' }}>
                Привычки не найдены
              </td></tr>
            ) : habits.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid rgba(214,201,182,0.3)' }}>
                <td style={tdStyle}>{h.user_email}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{h.name}</td>
                <td style={tdStyle}>
                  <span style={pillStyle}>{PERIOD_LABELS[h.periodicity] ?? h.periodicity}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{h.target_value ?? '—'}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{h.records_count}</td>
                <td style={tdStyle}>{h.created_at ? new Date(h.created_at).toLocaleDateString('ru-RU') : '—'}</td>
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
const inputStyle   = { padding: '8px 12px', border: '1px solid rgba(214,201,182,0.8)', borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', outline: 'none' }
const tableStyle   = { width: '100%', borderCollapse: 'collapse', background: '#FFFDF7', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(214,201,182,0.4)' }
const thStyle      = { padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#7A6552', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', background: '#F7F5F0', borderBottom: '1px solid rgba(214,201,182,0.4)' }
const tdStyle      = { padding: '11px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.82rem', color: '#3C3024' }
const pillStyle    = { display: 'inline-block', padding: '2px 8px', background: 'rgba(82,183,136,0.12)', color: '#2D6A4F', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }

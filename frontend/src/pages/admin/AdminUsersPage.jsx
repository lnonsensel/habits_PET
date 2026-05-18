import { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { deleteAdminUser, getAdminUsers } from '../../api/admin'

export default function AdminUsersPage() {
  const { authHeader } = useAdminAuth()
  const [users, setUsers]     = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState(null)  // id ожидающий подтверждения
  const [deleting, setDeleting]   = useState(false)

  const load = useCallback((q = search) => {
    setLoading(true)
    const params = { limit: 100, ...(q ? { search: q } : {}) }
    getAdminUsers(authHeader, params)
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [authHeader, search])

  useEffect(() => { load() }, [authHeader]) // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault()
    load(search)
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await deleteAdminUser(authHeader, id)
      setUsers(u => u.filter(x => x.id !== id))
    } finally {
      setDeleting(false)
      setConfirmId(null)
    }
  }

  return (
    <div>
      <h1 style={headingStyle}>Пользователи</h1>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, margin: '20px 0' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по email…"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="submit" style={btnStyle('#2D6A4F', '#FFFDF7')}>Найти</button>
      </form>

      {loading ? (
        <p style={mutedStyle}>Загрузка…</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {['Email', 'Провайдер', 'Регистрация', 'Последний вход', 'Привычки', ''].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#7A6552' }}>
                Пользователи не найдены
              </td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(214,201,182,0.3)' }}>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}><span style={pillStyle}>{u.auth_provider}</span></td>
                <td style={tdStyle}>{formatDate(u.created_at)}</td>
                <td style={tdStyle}>{formatDate(u.last_login_at)}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{u.habits_count}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {confirmId === u.id ? (
                    <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.75rem', color: '#7A6552' }}>
                        Вы уверены?
                      </span>
                      <button
                        disabled={deleting}
                        onClick={() => handleDelete(u.id)}
                        style={btnStyle('#C0392B', '#fff', true)}
                      >
                        {deleting ? '…' : 'Да'}
                      </button>
                      <button
                        disabled={deleting}
                        onClick={() => setConfirmId(null)}
                        style={btnStyle('#7A6552', '#fff', true)}
                      >
                        Нет
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(u.id)}
                      style={btnStyle('#C0392B', '#fff', true)}
                    >
                      Удалить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const headingStyle = { fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '1.6rem', color: '#1B3A2D', margin: 0 }
const mutedStyle   = { fontFamily: 'Lato, sans-serif', color: '#7A6552' }
const inputStyle   = { padding: '8px 12px', border: '1px solid rgba(214,201,182,0.8)', borderRadius: 8, fontFamily: 'Lato, sans-serif', fontSize: '0.85rem', outline: 'none' }
const tableStyle   = { width: '100%', borderCollapse: 'collapse', background: '#FFFDF7', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(214,201,182,0.4)' }
const thStyle      = { padding: '12px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#7A6552', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', background: '#F7F5F0', borderBottom: '1px solid rgba(214,201,182,0.4)' }
const tdStyle      = { padding: '11px 16px', fontFamily: 'Lato, sans-serif', fontSize: '0.82rem', color: '#3C3024' }
const pillStyle    = { display: 'inline-block', padding: '2px 8px', background: 'rgba(82,183,136,0.12)', color: '#2D6A4F', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600 }

function btnStyle(bg, fg, small = false) {
  return {
    padding: small ? '4px 10px' : '8px 18px',
    background: bg, color: fg,
    border: 'none', borderRadius: 7,
    fontFamily: 'Lato, sans-serif',
    fontSize: small ? '0.75rem' : '0.82rem', fontWeight: 600,
    cursor: 'pointer',
  }
}

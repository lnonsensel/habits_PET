import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { getAdminStats } from '../api/admin'

export default function AdminLoginPage() {
  const { adminLogin } = useAdminAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const header = 'Basic ' + btoa(`${form.username}:${form.password}`)
    try {
      await getAdminStats(header)
      adminLogin(form.username, form.password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.status === 401 ? 'Неверные данные' : 'Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F7F5F0',
    }}>
      <div style={{
        width: 360,
        background: '#FFFDF7',
        border: '1px solid rgba(214,201,182,0.6)',
        borderRadius: 16,
        padding: '40px 36px',
        boxShadow: '0 4px 24px rgba(60,48,36,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700, fontSize: '1.4rem',
            color: '#1B3A2D', marginBottom: 4,
          }}>
            HabitPet Admin
          </div>
          <div style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: '0.82rem', color: '#7A6552',
          }}>
            Введите учётные данные
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            placeholder="Логин"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            required
            autoFocus
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            style={inputStyle}
          />

          {error && (
            <div style={{
              fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
              color: '#C0392B', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              background: loading ? '#A8C5B3' : '#2D6A4F',
              color: '#FFFDF7',
              border: 'none', borderRadius: 10,
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.9rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Проверяем…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '12px 14px',
  border: '1px solid rgba(214,201,182,0.8)',
  borderRadius: 10,
  fontFamily: 'Lato, sans-serif',
  fontSize: '0.9rem',
  color: '#3C3024',
  background: '#FAFAF7',
  outline: 'none',
}

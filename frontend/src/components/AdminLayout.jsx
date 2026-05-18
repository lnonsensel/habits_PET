import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

const NAV_ITEMS = [
  { to: '/admin',               label: 'Dashboard',      icon: '◈' },
  { to: '/admin/users',         label: 'Пользователи',   icon: '◉' },
  { to: '/admin/notifications', label: 'Уведомления',    icon: '◎' },
  { to: '/admin/habits',        label: 'Привычки',       icon: '◇' },
  { to: '/admin/logs',          label: 'Логи',           icon: '◆' },
]

const SIDEBAR_W = 220

export default function AdminLayout() {
  const { adminLogout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = () => { adminLogout(); navigate('/admin/login', { replace: true }) }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F5F0' }}>
      {/* Sidebar */}
      <aside style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: '#1B3A2D',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700, fontSize: '1rem',
            color: '#95C4A0', letterSpacing: '-0.01em',
          }}>
            HabitPet
          </div>
          <div style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: '0.65rem', fontWeight: 600,
            color: 'rgba(149,196,160,0.5)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginTop: 2,
          }}>
            Admin Panel
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px',
                textDecoration: 'none',
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.82rem', fontWeight: 600,
                color: isActive ? '#FFFDF7' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(82,183,136,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #52B788' : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'rgba(224,122,95,0.12)',
              border: '1px solid rgba(224,122,95,0.25)',
              borderRadius: 8,
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.78rem', fontWeight: 600,
              color: '#E07A5F', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,122,95,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(224,122,95,0.12)'}
          >
            Выйти из панели
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}

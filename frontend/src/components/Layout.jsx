import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import NotificationToast from './NotificationToast'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isCreatePage = location.pathname === '/habits/new'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Navbar ── */}
      <nav style={{
        background: 'rgba(255,253,247,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(214,201,182,0.6)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto',
          padding: '0 24px',
          height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16,
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
            className="nav-logo-link">
            <svg width="22" height="28" viewBox="0 0 22 28" fill="none"
              style={{ flexShrink: 0 }} aria-hidden="true">
              <path d="M11 26C11 26 3 19 3.5 10.5C4 3 11 1.5 11 1.5C11 1.5 18 3 18.5 10.5C19 19 11 26 11 26Z"
                fill="#2D6A4F"/>
              <line x1="11" y1="26" x2="11" y2="5" stroke="#FFFDF7" strokeWidth="1.3"/>
              <path d="M11 18C8.5 15.5 7 12 7.5 9" stroke="#FFFDF7" strokeWidth="0.9" strokeLinecap="round"/>
              <path d="M11 13C13.5 11 14.5 8 13.5 6" stroke="#FFFDF7" strokeWidth="0.9" strokeLinecap="round"/>
            </svg>
            <span style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700, fontSize: '1.15rem',
              color: 'var(--garden-forest)',
              letterSpacing: '-0.01em',
            }}>
              HabitPet
            </span>
          </Link>

          {/* Center nav (breadcrumb on create page) */}
          {isCreatePage && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'Lato, sans-serif', fontSize: '0.8rem',
              color: 'var(--garden-soil)',
            }}>
              <Link to="/" style={{
                color: 'var(--garden-sage)', textDecoration: 'none',
                fontWeight: 600,
              }}>
                Сад
              </Link>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 2l4 4-4 4"/>
              </svg>
              <span style={{ color: 'var(--garden-bark)', fontWeight: 600 }}>Новая привычка</span>
            </div>
          )}

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationBell />

            {/* Email pill */}
            <span style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.72rem', fontWeight: 600,
              color: 'var(--garden-soil)',
              background: 'rgba(214,201,182,0.35)',
              border: '1px solid var(--garden-border)',
              borderRadius: 999,
              padding: '4px 12px',
              maxWidth: 180,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              display: 'block',
            }}
              title={user?.email}
              className="nav-email"
            >
              {user?.email}
            </span>

            {/* Logout */}
            <button
              onClick={() => { logout(); navigate('/login') }}
              title="Выйти"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                border: '1px solid transparent',
                background: 'transparent',
                fontFamily: 'Lato, sans-serif', fontSize: '0.78rem', fontWeight: 600,
                color: 'var(--garden-soil)', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#FFF0EC'
                e.currentTarget.style.color = 'var(--garden-clay)'
                e.currentTarget.style.borderColor = '#F5C5B5'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--garden-soil)'
                e.currentTarget.style.borderColor = 'transparent'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M5 7h7M9 4.5l2.5 2.5L9 9.5"/>
                <path d="M8.5 2H2.5A1 1 0 001.5 3v8A1 1 0 002.5 12h6"/>
              </svg>
              <span className="nav-logout-text">Выйти</span>
            </button>
          </div>
        </div>
      </nav>

      <NotificationToast />

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: 960, width: '100%', margin: '0 auto', padding: '32px 24px 48px' }}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer style={{
        textAlign: 'center', padding: '24px',
        borderTop: '1px solid rgba(214,201,182,0.4)',
      }}>
        <svg width="48" height="16" viewBox="0 0 48 16" fill="none"
          style={{ opacity: 0.2, margin: '0 auto' }} aria-hidden="true">
          <path d="M24 14C24 14 16 9.5 16 5.5C16 2.5 20 1 24 3C28 1 32 2.5 32 5.5C32 9.5 24 14 24 14Z" fill="#2D6A4F"/>
          <path d="M4 11C4 11 1 8 1.5 5.5C2 3.5 5 3 7 5C8 7 6.5 10 4 11Z" fill="#52B788"/>
          <path d="M44 11C44 11 47 8 46.5 5.5C46 3.5 43 3 41 5C40 7 41.5 10 44 11Z" fill="#52B788"/>
          <line x1="7" y1="11" x2="24" y2="14" stroke="#95C4A0" strokeWidth="0.8"/>
          <line x1="41" y1="11" x2="24" y2="14" stroke="#95C4A0" strokeWidth="0.8"/>
        </svg>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .nav-email { display: none !important; }
          .nav-logout-text { display: none; }
        }
      `}</style>
    </div>
  )
}

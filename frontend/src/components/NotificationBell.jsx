import { useEffect, useRef, useState } from 'react'
import { useNotifications, EVENT_META } from '../context/NotificationContext'

function timeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000)
  if (s < 60)   return 'только что'
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`
  if (s < 86400) return `${Math.floor(s / 3600)} ч назад`
  return date.toLocaleDateString('ru-RU')
}

export default function NotificationBell() {
  const { history, unread, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(v => !v)
    if (!open && unread > 0) markAllRead()
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        title="Уведомления"
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36,
          borderRadius: 999,
          border: '1px solid transparent',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--garden-soil)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(214,201,182,0.35)'
          e.currentTarget.style.borderColor = 'var(--garden-border)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
        }}
      >
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M8.5 1.5a5 5 0 0 1 5 5v3.5l1.2 1.8H2.3l1.2-1.8V6.5a5 5 0 0 1 5-5z"/>
          <path d="M6.8 13.5a1.7 1.7 0 0 0 3.4 0"/>
        </svg>

        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            minWidth: 16, height: 16, borderRadius: 999,
            background: '#E07A5F',
            color: '#fff',
            fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Lato, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
            border: '1.5px solid #FFFDF7',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 320,
          background: '#FFFDF7',
          border: '1px solid rgba(214,201,182,0.7)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(60,48,36,0.13)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(214,201,182,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700, fontSize: '0.95rem',
              color: 'var(--garden-forest)',
            }}>
              Уведомления
            </span>
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {history.length === 0 ? (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                fontFamily: 'Lato, sans-serif',
                fontSize: '0.82rem',
                color: 'var(--garden-sage)',
              }}>
                Уведомлений пока нет
              </div>
            ) : history.map(n => {
              const meta = EVENT_META[n.event] ?? { icon: '🔔', label: n.event }
              return (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  borderBottom: '1px solid rgba(214,201,182,0.3)',
                  background: n.read ? 'transparent' : 'rgba(82,183,136,0.07)',
                  transition: 'background 0.2s',
                }}>
                  <span style={{ fontSize: '1.2rem', lineHeight: 1.4, flexShrink: 0 }}>
                    {meta.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '0.83rem', fontWeight: 600,
                      color: 'var(--garden-bark)',
                      marginBottom: 2,
                    }}>
                      {meta.label}
                    </div>
                    <div style={{
                      fontFamily: 'Lato, sans-serif',
                      fontSize: '0.72rem',
                      color: 'var(--garden-sage)',
                    }}>
                      {timeAgo(n.timestamp)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

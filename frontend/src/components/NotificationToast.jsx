import { useNotifications, EVENT_META } from '../context/NotificationContext'

export default function NotificationToast() {
  const { toasts, dismissToast } = useNotifications()

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 10,
      zIndex: 1000,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const meta = EVENT_META[t.event] ?? { icon: '🔔', label: t.event }
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'all',
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              background: 'rgba(255,253,247,0.97)',
              border: '1px solid rgba(82,183,136,0.4)',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(60,48,36,0.14)',
              minWidth: 240, maxWidth: 320,
              animation: 'toastIn 0.25s ease',
            }}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1, flexShrink: 0 }}>
              {meta.icon}
            </span>
            <span style={{
              flex: 1,
              fontFamily: 'Lato, sans-serif',
              fontSize: '0.84rem', fontWeight: 600,
              color: 'var(--garden-bark)',
              lineHeight: 1.35,
            }}>
              {meta.label}
            </span>
            <button
              onClick={() => dismissToast(t.id)}
              style={{
                flexShrink: 0,
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 2,
                color: 'var(--garden-sage)',
                lineHeight: 1,
                display: 'flex', alignItems: 'center',
              }}
              title="Закрыть"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12"/>
              </svg>
            </button>
          </div>
        )
      })}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

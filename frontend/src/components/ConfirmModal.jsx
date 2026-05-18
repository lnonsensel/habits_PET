import { useEffect } from 'react'

// Botanical SVG: uprooted/wilting plant — fits "вырвать с корнем"
function UprootedPlant() {
  return (
    <svg viewBox="0 0 88 96" fill="none" style={{ width: '100%', height: '100%' }}
      aria-hidden="true">
      {/* Ground / soil line */}
      <path d="M10 62 Q44 57 78 62" stroke="#D6C9B6" strokeWidth="2" strokeLinecap="round"/>

      {/* Soil clump hanging from roots */}
      <ellipse cx="44" cy="66" rx="14" ry="7" fill="#C4B19A" opacity="0.45"/>

      {/* Roots (exposed, dangling) */}
      <path d="M40 64 C37 70 32 76 30 84" stroke="#C4B19A" strokeWidth="1.6"
        strokeLinecap="round" fill="none"/>
      <path d="M44 65 C43 73 41 80 40 88" stroke="#C4B19A" strokeWidth="1.6"
        strokeLinecap="round" fill="none"/>
      <path d="M48 64 C51 71 55 76 58 83" stroke="#C4B19A" strokeWidth="1.6"
        strokeLinecap="round" fill="none"/>
      {/* Root tendrils */}
      <path d="M30 84 C28 87 25 88 22 86" stroke="#C4B19A" strokeWidth="1.1"
        strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M58 83 C60 87 64 88 66 85" stroke="#C4B19A" strokeWidth="1.1"
        strokeLinecap="round" fill="none" opacity="0.7"/>

      {/* Main stem — slightly drooping to the right */}
      <path d="M44 62 C44 54 46 44 48 32 C50 22 48 12 44 6"
        stroke="#52B788" strokeWidth="2.8" strokeLinecap="round" fill="none"/>

      {/* Left leaf — drooping down */}
      <path d="M46 42 C46 42 26 40 22 28 C18 18 30 11 40 22
               C43 27 45 36 46 42Z"
        fill="#2D6A4F" opacity="0.8"/>
      <path d="M46 42 C38 34 28 24 32 16"
        stroke="#52B788" strokeWidth="0.9" fill="none" opacity="0.5" strokeLinecap="round"/>

      {/* Right leaf — drooping down */}
      <path d="M47 32 C47 32 67 28 72 16 C77 5 63 -1 54 10
               C50 16 48 26 47 32Z"
        fill="#2D6A4F" opacity="0.8"/>
      <path d="M47 32 C55 24 66 14 62 6"
        stroke="#52B788" strokeWidth="0.9" fill="none" opacity="0.5" strokeLinecap="round"/>

      {/* Top small wilting bud */}
      <path d="M44 6 C42 2 40 0 44 0 C48 0 46 2 44 6Z"
        fill="#95C4A0" opacity="0.7"/>

      {/* Floating soil particles */}
      <circle cx="18" cy="55" r="2.2" fill="#C4B19A" opacity="0.55"/>
      <circle cx="72" cy="52" r="1.8" fill="#C4B19A" opacity="0.45"/>
      <circle cx="24" cy="48" r="1.5" fill="#6B5B4E" opacity="0.35"/>
      <circle cx="68" cy="58" r="2"   fill="#C4B19A" opacity="0.5"/>
      <circle cx="78" cy="46" r="1.3" fill="#6B5B4E" opacity="0.3"/>
    </svg>
  )
}

export default function ConfirmModal({ habit, onConfirm, onCancel, loading }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loading, onCancel])

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="modal-overlay"
      onClick={() => { if (!loading) onCancel() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-illustration">
          <UprootedPlant />
        </div>

        <h2 id="modal-title" className="modal-title">Вырвать с корнем?</h2>
        <p className="modal-desc">
          Привычка будет удалена навсегда.<br />Это действие нельзя отменить.
        </p>

        <div className="modal-habit-name">«{habit.name}»</div>

        <div className="modal-actions">
          <button
            className="modal-btn-delete"
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center' }}>
                <span style={{
                  display: 'inline-block', width: 13, height: 13,
                  border: '2px solid rgba(255,253,247,0.4)', borderTopColor: '#FFFDF7',
                  borderRadius: '50%', animation: 'spin 0.75s linear infinite',
                }} />
                Удаляем…
              </span>
            ) : 'Удалить'}
          </button>
          <button
            className="modal-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

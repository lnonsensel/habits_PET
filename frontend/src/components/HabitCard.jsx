import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { deleteHabitRecord, createHabitRecord } from '../api/habits'

const PERIOD = {
  daily:   { label: 'ежедневно',   color: '#2D6A4F', bg: '#D4E6D9', accent: '#2D6A4F' },
  weekly:  { label: 'еженедельно', color: '#5A6E28', bg: '#E8EDCF', accent: '#7A9040' },
  monthly: { label: 'ежемесячно',  color: '#7A4E1E', bg: '#EFE0C8', accent: '#A3693A' },
}

function PeriodIcon({ period }) {
  const cfg = PERIOD[period] ?? PERIOD.daily
  return (
    <div className="habit-card-period-icon" style={{ background: cfg.bg }}>
      {period === 'daily' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3.5" fill={cfg.color} />
          {[0,45,90,135,180,225,270,315].map(deg => {
            const r = deg * Math.PI / 180
            const x1 = 8 + 5.5 * Math.sin(r), y1 = 8 - 5.5 * Math.cos(r)
            const x2 = 8 + 7   * Math.sin(r), y2 = 8 - 7   * Math.cos(r)
            return <line key={deg} x1={x1.toFixed(1)} y1={y1.toFixed(1)}
              x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke={cfg.color}
              strokeWidth={deg % 90 === 0 ? '1.5' : '1.2'} strokeLinecap="round"/>
          })}
        </svg>
      )}
      {period === 'weekly' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 14C8 14 2 10 2.5 6C3 2.5 8 1.5 8 1.5C8 1.5 13 2.5 13.5 6C14 10 8 14 8 14Z" fill={cfg.color}/>
          <line x1="8" y1="14" x2="8" y2="3.5" stroke={cfg.bg} strokeWidth="0.9"/>
          <line x1="8" y1="10" x2="5" y2="7.5" stroke={cfg.bg} strokeWidth="0.7" opacity="0.7"/>
          <line x1="8" y1="7"  x2="11" y2="5"  stroke={cfg.bg} strokeWidth="0.7" opacity="0.7"/>
        </svg>
      )}
      {period === 'monthly' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M9 2C6 2 3.5 4.5 3.5 8C3.5 11.5 6 14 9 14C10.5 14 11.8 13.4 12.8 12.4C11.4 12.8 9.8 12.6 8.5 11.5C6.5 10 6 7.5 7 5.5C7.7 4 8.7 2.8 10 2.2C9.7 2.1 9.4 2 9 2Z" fill={cfg.color}/>
        </svg>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10,
      border: '1.5px solid currentColor', borderTopColor: 'transparent',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

// ── Progress section for habits WITH target_value ────────────────
function ProgressSection({ habit, progress, addingProgress, onAddProgress }) {
  const [inputVal, setInputVal] = useState('')
  const target  = Number(habit.target_value)
  const current = Math.min(progress, target)
  const pct     = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0
  const isDone  = progress >= target

  const handleAdd = () => {
    const v = Number(inputVal)
    if (!v || v <= 0) return
    onAddProgress(habit.id, v)
    setInputVal('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <>
      {/* Progress bar */}
      <div className="habit-progress" style={{ marginTop: 10 }}>
        <div className="habit-progress-track">
          <div className="habit-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="habit-progress-meta">
          <span className="habit-progress-label">
            <strong style={{ color: isDone ? 'var(--garden-forest)' : 'var(--garden-bark)' }}>
              {progress}
            </strong>
            {' / '}{target} {habit.unit}
          </span>
          <span className="habit-progress-label" style={{
            fontWeight: 700,
            color: isDone ? 'var(--garden-forest)' : 'var(--garden-soil)',
          }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Add-progress form — always visible */}
      <div className="habit-add-form">
        <input
          className="habit-add-input"
          type="number"
          min="1"
          step="1"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKey}
          placeholder="0"
          aria-label={`Добавить ${habit.unit}`}
          disabled={addingProgress}
        />
        <span className="habit-add-unit">{habit.unit}</span>
        <button
          className="habit-add-btn"
          onClick={handleAdd}
          disabled={addingProgress || !inputVal || Number(inputVal) <= 0}
        >
          {addingProgress ? <><Spinner /> Фиксируем…</> : '+ Добавить'}
        </button>

        {isDone && (
          <div className="habit-done-badge" style={{ marginLeft: 'auto' }}>
            <div className="habit-done-check">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            Цель!
          </div>
        )}
      </div>
    </>
  )
}

// ── Simple done/not-done for habits WITHOUT target_value ─────────
function SimpleFooter({ habitId, progress, addingProgress, onAddProgress }) {
  const isDone = progress > 0
  return (
    <div className="habit-card-footer">
      {isDone ? (
        <div className="habit-done-badge">
          <div className="habit-done-check">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          Выполнено сегодня
        </div>
      ) : (
        <button
          className="habit-complete-btn"
          onClick={() => onAddProgress(habitId, 1)}
          disabled={addingProgress}
        >
          {addingProgress ? <><Spinner /> Фиксируем…</> : (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="5" y1="1" x2="5" y2="9" /><line x1="1" y1="5" x2="9" y2="5" />
              </svg>
              Отметить
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ── Main card ────────────────────────────────────────────────────
export default function HabitCard({
  habit, onDelete, onAddProgress, addingProgress, progress = 0,
  lastRecord = null, userId, onProgressUndo, onProgressRedoUndo,
}) {
  const cfg      = PERIOD[habit.periodicity] ?? PERIOD.daily
  const hasGoal  = habit.target_value != null
  const isDone   = hasGoal ? progress >= Number(habit.target_value) : progress > 0

  const [undoneRecord, setUndoneRecord] = useState(null)
  const [undoSecsLeft, setUndoSecsLeft] = useState(0)
  const [rollingBack, setRollingBack]   = useState(false)
  const undoTimerRef = useRef(null)

  // New record added — clear any pending restore
  useEffect(() => {
    if (lastRecord) {
      setUndoneRecord(null)
      setUndoSecsLeft(0)
      clearInterval(undoTimerRef.current)
    }
  }, [lastRecord?.id])

  useEffect(() => () => clearInterval(undoTimerRef.current), [])

  const handleUndo = async () => {
    if (!lastRecord) return
    setRollingBack(true)
    try {
      await deleteHabitRecord(lastRecord.id)
      onProgressUndo(habit.id, lastRecord.value)
      setUndoneRecord(lastRecord)
      setUndoSecsLeft(10)
      clearInterval(undoTimerRef.current)
      undoTimerRef.current = setInterval(() => {
        setUndoSecsLeft(s => {
          if (s <= 1) {
            clearInterval(undoTimerRef.current)
            setUndoneRecord(null)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } catch { /* silent */ }
    finally { setRollingBack(false) }
  }

  const handleRedoUndo = async () => {
    if (!undoneRecord) return
    clearInterval(undoTimerRef.current)
    const rec = undoneRecord
    setUndoneRecord(null)
    setUndoSecsLeft(0)
    try {
      const restored = await createHabitRecord({ user_id: userId, habit_id: habit.id, value: rec.value })
      onProgressRedoUndo(habit.id, rec.value, restored.id)
    } catch { /* silent */ }
  }

  return (
    <article className={`habit-card${isDone ? ' is-done' : ''}`}>
      <div className="habit-card-accent" style={{ background: cfg.accent }} />

      <div className="habit-card-inner">
        {/* Top row */}
        <div className="habit-card-top">
          <PeriodIcon period={habit.periodicity} />

          <div className="habit-card-main">
            <Link to={`/habits/${habit.id}`} className="habit-card-name">
              {habit.name}
            </Link>
            {habit.description && (
              <p className="habit-card-desc">{habit.description}</p>
            )}
          </div>

          <button
            onClick={() => onDelete(habit.id)}
            className="habit-card-delete"
            aria-label="Удалить привычку"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="1" y1="1" x2="10" y2="10" />
              <line x1="10" y1="1" x2="1" y2="10" />
            </svg>
          </button>
        </div>

        {/* Tags */}
        <div className="habit-card-tags">
          <span className="plant-tag" style={{ color: '#2D6A4F', background: '#D4E6D9' }}>
            {habit.unit}
          </span>
          <span className="plant-tag" style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.label}
          </span>
          {hasGoal && (
            <span className="plant-tag" style={{ color: '#7A4E1E', background: '#EFE0C8' }}>
              цель · {habit.target_value}
            </span>
          )}
        </div>

        {/* Progress section */}
        {hasGoal ? (
          <ProgressSection
            habit={habit}
            progress={progress}
            addingProgress={addingProgress}
            onAddProgress={onAddProgress}
          />
        ) : (
          <SimpleFooter
            habitId={habit.id}
            progress={progress}
            addingProgress={addingProgress}
            onAddProgress={onAddProgress}
          />
        )}

        {/* Undo last record */}
        {lastRecord && !undoneRecord && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={handleUndo}
              disabled={rollingBack}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 11px', borderRadius: 999,
                border: '1.5px solid var(--garden-border)',
                background: 'transparent', color: 'var(--garden-soil)',
                fontFamily: 'Lato,sans-serif', fontSize: '0.7rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                opacity: rollingBack ? 0.5 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--garden-clay)'; e.currentTarget.style.color = 'var(--garden-clay)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--garden-border)'; e.currentTarget.style.color = 'var(--garden-soil)' }}
            >
              <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 5.5A3.5 3.5 0 1 0 5.5 2H3"/>
                <path d="M3 2v2.5H5.5"/>
              </svg>
              {rollingBack ? 'Откатываем…' : 'Откатить'}
            </button>
          </div>
        )}

        {/* Restore undone record */}
        {undoneRecord && (
          <div style={{
            marginTop: 8, display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 8,
            background: 'rgba(193,68,14,0.07)', border: '1px solid rgba(193,68,14,0.2)',
          }}>
            <span style={{ fontFamily: 'Lato,sans-serif', fontSize: '0.7rem', color: 'var(--garden-soil)', flex: 1 }}>
              Удалено: <strong>{undoneRecord.value} {habit.unit}</strong>
            </span>
            <button
              onClick={handleRedoUndo}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '3px 10px', borderRadius: 999,
                border: '1.5px solid var(--garden-clay)',
                background: 'transparent', color: 'var(--garden-clay)',
                fontFamily: 'Lato,sans-serif', fontSize: '0.7rem', fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--garden-clay)'; e.currentTarget.style.color = 'var(--garden-cream)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--garden-clay)' }}
            >
              ↩ Отменить ({undoSecsLeft}с)
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

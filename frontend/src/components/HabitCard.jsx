import { Link } from 'react-router-dom'

const PERIOD = {
  daily:   { label: 'ежедневно', color: '#2D6A4F', bg: '#D4E6D9', accent: '#2D6A4F' },
  weekly:  { label: 'еженедельно', color: '#5A6E28', bg: '#E8EDCF', accent: '#7A9040' },
  monthly: { label: 'ежемесячно', color: '#7A4E1E', bg: '#EFE0C8', accent: '#A3693A' },
}

function PeriodIcon({ period }) {
  const cfg = PERIOD[period] ?? PERIOD.daily
  return (
    <div className="habit-card-period-icon" style={{ background: cfg.bg }}>
      {period === 'daily' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3.5" fill={cfg.color} />
          <line x1="8" y1="1" x2="8" y2="3"   stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="8" y1="13" x2="8" y2="15" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="1" y1="8" x2="3" y2="8"   stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="13" y1="8" x2="15" y2="8" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="2.9" y1="2.9" x2="4.3" y2="4.3" stroke={cfg.color} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="11.7" y1="11.7" x2="13.1" y2="13.1" stroke={cfg.color} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="11.7" y1="4.3" x2="13.1" y2="2.9" stroke={cfg.color} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="2.9" y1="13.1" x2="4.3" y2="11.7" stroke={cfg.color} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )}
      {period === 'weekly' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 14C8 14 2 10 2.5 6C3 2.5 8 1.5 8 1.5C8 1.5 13 2.5 13.5 6C14 10 8 14 8 14Z" fill={cfg.color}/>
          <line x1="8" y1="14" x2="8" y2="3.5" stroke={cfg.bg} strokeWidth="0.9"/>
          <line x1="8" y1="10" x2="5" y2="7.5" stroke={cfg.bg} strokeWidth="0.7" opacity="0.7"/>
          <line x1="8" y1="7" x2="11" y2="5" stroke={cfg.bg} strokeWidth="0.7" opacity="0.7"/>
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

export default function HabitCard({ habit, onDelete, onComplete, done, completing }) {
  const cfg = PERIOD[habit.periodicity] ?? PERIOD.daily

  return (
    <article className={`habit-card${done ? ' is-done' : ''}`}>
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
          {habit.target_value != null && (
            <span className="plant-tag" style={{ color: '#7A4E1E', background: '#EFE0C8' }}>
              цель · {habit.target_value}
            </span>
          )}
        </div>

        {/* Progress bar (if target set) */}
        {habit.target_value != null && (
          <div className="habit-progress">
            <div className="habit-progress-track">
              <div
                className="habit-progress-fill"
                style={{ width: done ? '100%' : '0%' }}
              />
            </div>
            <div className="habit-progress-meta">
              <span className="habit-progress-label">
                {done ? habit.target_value : 0} / {habit.target_value} {habit.unit}
              </span>
              {done && (
                <span className="habit-progress-label" style={{ color: 'var(--garden-forest)', fontWeight: 700 }}>
                  100%
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="habit-card-footer">
          {done ? (
            <div className="habit-done-badge">
              <div className="habit-done-check">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              Выполнено сегодня
            </div>
          ) : (
            <button
              className="habit-complete-btn"
              onClick={() => onComplete(habit.id)}
              disabled={completing}
            >
              {completing ? (
                <span style={{
                  display: 'inline-block', width: 10, height: 10,
                  border: '1.5px solid currentColor', borderTopColor: 'transparent',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="5" y1="1" x2="5" y2="9" />
                  <line x1="1" y1="5" x2="9" y2="5" />
                </svg>
              )}
              {completing ? 'Фиксируем…' : 'Отметить'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

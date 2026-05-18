import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getHabits, deleteHabit, createHabitRecord, getHabitRecords } from '../api/habits'
import { useAuth } from '../context/AuthContext'
import HabitCard from '../components/HabitCard'
import ConfirmModal from '../components/ConfirmModal'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip)

// ── Date helpers ─────────────────────────────────────────────────
const DAYS_RU    = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота']
const MONTHS_RU  = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 17) return 'Добрый день'
  return 'Добрый вечер'
}

function getDateLabel() {
  const d = new Date()
  return `${DAYS_RU[d.getDay()]}, ${d.getDate()} ${MONTHS_RU[d.getMonth()]}`
}

// ── Stats bar ────────────────────────────────────────────────────
function StatsBar({ habits, todayProgress }) {
  const doneCount = habits.filter(h => {
    const p = todayProgress[h.id] || 0
    return h.target_value != null ? p >= Number(h.target_value) : p > 0
  }).length
  const daily = habits.filter(h => h.periodicity === 'daily').length

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <div className="stat-card-icon" style={{ background: '#D4E6D9' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 12C7 12 1.5 8.5 2 5C2.5 1.5 7 1 7 1C7 1 11.5 1.5 12 5C12.5 8.5 7 12 7 12Z"
              fill="#2D6A4F"/>
          </svg>
        </div>
        <div className="stat-card-value">{habits.length}</div>
        <div className="stat-card-label">Привычек</div>
      </div>

      <div className="stat-card">
        <div className="stat-card-icon" style={{ background: '#E8EDCF' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="#5A6E28" strokeWidth="1.5"/>
            <path d="M4 7L6.5 9.5L10.5 4.5" stroke="#5A6E28" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="stat-card-value">{doneCount}</div>
        <div className="stat-card-label">Сегодня</div>
      </div>

      <div className="stat-card">
        <div className="stat-card-icon" style={{ background: '#EFE0C8' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1C7 1 4 4 4 7C4 9 5.5 11 7 11C8.5 11 10 9 10 7C10 5 9 3 9 3C9 3 8.5 5 7 5C5.5 5 5 4 5 4C5 4 6 1.5 7 1Z"
              fill="#A3693A"/>
          </svg>
        </div>
        <div className="stat-card-value">{daily}</div>
        <div className="stat-card-label">Ежедневных</div>
      </div>
    </div>
  )
}

// ── Filter tabs ──────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',     label: 'Все',          dotColor: '#D6C9B6' },
  { id: 'daily',   label: 'Ежедневные',   dotColor: '#2D6A4F' },
  { id: 'weekly',  label: 'Еженедельные', dotColor: '#7A9040' },
  { id: 'monthly', label: 'Ежемесячные',  dotColor: '#A3693A' },
]

function FilterTabs({ active, onChange, counts }) {
  return (
    <div className="filter-tabs">
      {FILTERS.map(f => (
        <button
          key={f.id}
          className={`filter-tab${active === f.id ? ' active' : ''}`}
          onClick={() => onChange(f.id)}
        >
          <span className="filter-tab-dot" style={{ background: f.dotColor }} />
          {f.label}
          {counts[f.id] > 0 && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              background: active === f.id ? 'rgba(45,106,79,0.12)' : 'rgba(214,201,182,0.6)',
              color: active === f.id ? 'var(--garden-forest)' : 'var(--garden-soil)',
              borderRadius: '999px', padding: '1px 6px',
            }}>
              {counts[f.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Garden doughnut chart ─────────────────────────────────────────
const PERIOD_LABELS = { daily: 'Ежедневные', weekly: 'Еженедельные', monthly: 'Ежемесячные' }
const PERIOD_COLORS = {
  daily:   { bg: 'rgba(45,106,79,0.82)',   border: '#2D6A4F' },
  weekly:  { bg: 'rgba(122,144,64,0.82)',  border: '#7A9040' },
  monthly: { bg: 'rgba(163,105,58,0.82)',  border: '#A3693A' },
}

function GardenChart({ habits }) {
  const counts = useMemo(() => {
    const c = { daily: 0, weekly: 0, monthly: 0 }
    habits.forEach(h => { if (h.periodicity in c) c[h.periodicity]++ })
    return c
  }, [habits])

  const total = habits.length

  const data = {
    labels: Object.keys(counts).map(k => PERIOD_LABELS[k]),
    datasets: [{
      data:            Object.values(counts),
      backgroundColor: Object.keys(counts).map(k => PERIOD_COLORS[k].bg),
      borderColor:     Object.keys(counts).map(k => PERIOD_COLORS[k].border),
      borderWidth: 2,
      hoverOffset: 5,
    }],
  }

  return (
    <div className="sidebar-chart-card">
      <p className="sidebar-chart-title">По периодичности</p>

      <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
        <Doughnut
          data={data}
          options={{
            cutout: '70%',
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#FFFDF7',
                titleColor: '#1A1A14',
                bodyColor: '#6B5B4E',
                borderColor: '#D6C9B6',
                borderWidth: 1,
                padding: 10,
                titleFont: { family: 'Playfair Display', weight: '600', size: 12 },
                bodyFont: { family: 'Lato', size: 12 },
              },
            },
          }}
        />
        <div className="chart-center-label">
          <span className="chart-center-value">{total}</span>
          <span className="chart-center-unit">всего</span>
        </div>
      </div>

      <div className="chart-legend">
        {Object.entries(counts).filter(([, v]) => v > 0).map(([key, count]) => (
          <div key={key} className="chart-legend-row">
            <span className="chart-legend-dot" style={{ background: PERIOD_COLORS[key].border }} />
            <span className="chart-legend-label">{PERIOD_LABELS[key]}</span>
            <span className="chart-legend-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────
function EmptyGarden({ filter }) {
  const isEmpty = filter === 'all'
  return (
    <div className="empty-garden">
      <svg className="empty-garden-pot" width="90" height="108" viewBox="0 0 90 108" fill="none">
        {/* Pot */}
        <path d="M26 80 L30 100 L60 100 L64 80 Z" fill="#D6C9B6"/>
        <rect x="22" y="72" width="46" height="9" rx="3" fill="#C4B19A"/>
        <ellipse cx="45" cy="73" rx="20" ry="4.5" fill="#6B5B4E" opacity="0.25"/>
        {/* Stem */}
        <line x1="45" y1="72" x2="45" y2="40" stroke="#52B788" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Leaves */}
        <path d="M45 58C45 58 33 53 32 43C31 35 38 31 43 37C44 41 44.5 52 45 58Z" fill="#95C4A0"/>
        <path d="M45 50C45 50 57 45 58 35C59 27 52 23 47 29C46 33 45.5 44 45 50Z" fill="#95C4A0"/>
        <path d="M45 40C42 36 40 30 42 24C44 18 50 16 52 22C53 27 47 36 45 40Z" fill="#52B788"/>
        {/* Water drops */}
        <ellipse cx="18" cy="30" rx="2.5" ry="3.5" fill="#D4E6D9" opacity="0.65"/>
        <ellipse cx="72" cy="40" rx="2" ry="3" fill="#D4E6D9" opacity="0.5"/>
        <ellipse cx="68" cy="24" rx="1.5" ry="2" fill="#D4E6D9" opacity="0.4"/>
      </svg>

      {isEmpty ? (
        <>
          <h2>Ваш сад пока пуст</h2>
          <p>Посадите первую привычку — даже маленькое<br />семя вырастает в большое дерево</p>
          <Link to="/habits/new">
            <button className="auth-submit" style={{ width: 'auto', padding: '12px 28px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
              </svg>
              Посадить первую привычку
            </button>
          </Link>
        </>
      ) : (
        <>
          <h2>Нет привычек в этой категории</h2>
          <p>Попробуйте другой фильтр или создайте новую привычку</p>
        </>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function HabitsPage() {
  const { user }  = useAuth()
  const [habits, setHabits]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [filter, setFilter]         = useState('all')
  // progress[habitId] = total value logged today for that habit
  const [todayProgress, setTodayProgress] = useState({})
  const [addingId, setAddingId]           = useState(null)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [deleting, setDeleting]           = useState(false)

  // Aggregate today's records into progress map
  const buildProgress = (records) => {
    const today = new Date().toDateString()
    const map = {}
    records.forEach(r => {
      if (new Date(r.timestamp).toDateString() !== today) return
      map[r.habit_id] = (map[r.habit_id] || 0) + Number(r.value)
    })
    return map
  }

  useEffect(() => {
    if (!user?.id) return
    Promise.all([getHabits(user.id), getHabitRecords(user.id)])
      .then(([habitsData, recordsData]) => {
        setHabits(habitsData)
        setTodayProgress(buildProgress(recordsData))
      })
      .catch(err => setError(err.detail ?? 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleDeleteRequest = (id) => {
    const habit = habits.find(h => h.id === id)
    setDeleteTarget({ id, name: habit?.name ?? '' })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteHabit(deleteTarget.id)
      setHabits(prev => prev.filter(h => h.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleAddProgress = async (habitId, value) => {
    if (!user || !value || Number(value) <= 0) return
    setAddingId(habitId)
    try {
      await createHabitRecord({ user_id: user.id, habit_id: habitId, value: Number(value) })
      setTodayProgress(prev => ({
        ...prev,
        [habitId]: (prev[habitId] || 0) + Number(value),
      }))
    } catch {
      // silent
    } finally {
      setAddingId(null)
    }
  }

  const filtered = useMemo(() =>
    filter === 'all' ? habits : habits.filter(h => h.periodicity === filter),
    [habits, filter]
  )

  const counts = useMemo(() => ({
    all:     habits.length,
    daily:   habits.filter(h => h.periodicity === 'daily').length,
    weekly:  habits.filter(h => h.periodicity === 'weekly').length,
    monthly: habits.filter(h => h.periodicity === 'monthly').length,
  }), [habits])

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p className="page-header-date">{getDateLabel()}</p>
            <h1 className="page-header-title">Мой сад привычек</h1>
            <p className="page-header-subtitle">{getGreeting()} — пора полить растения</p>
          </div>
          <Link to="/habits/new" style={{ flexShrink: 0, marginTop: 4 }}>
            <button className="auth-submit" style={{
              width: 'auto', padding: '10px 20px',
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontSize: '0.82rem',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="1" x2="6" y2="11"/>
                <line x1="1" y1="6" x2="11" y2="6"/>
              </svg>
              Новая привычка
            </button>
          </Link>
        </div>
        <div className="page-header-rule" />
      </div>

      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          justifyContent: 'center', padding: '4rem 0',
          fontFamily: 'Lato, sans-serif', fontSize: '0.875rem',
          color: 'var(--garden-soil)',
        }}>
          <span style={{
            display: 'inline-block', width: 18, height: 18,
            border: '2px solid var(--garden-leaf)', borderTopColor: 'var(--garden-forest)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          Поливаем растения…
        </div>
      )}

      {error && (
        <div className="auth-server-error" style={{ marginBottom: '1.5rem' }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
            <path d="M7.5 1a6.5 6.5 0 100 13A6.5 6.5 0 007.5 1zm.625 9.625h-1.25V9.25h1.25v1.375zm0-2.75h-1.25V4.125h1.25v3.75z"/>
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && habits.length === 0 && <EmptyGarden filter="all" />}

      {!loading && !error && habits.length > 0 && (
        <>
          {/* Stats */}
          <StatsBar habits={habits} todayProgress={todayProgress} />

          {/* Filters */}
          <FilterTabs active={filter} onChange={setFilter} counts={counts} />

          {/* Content grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.length === 0
                ? <EmptyGarden filter={filter} />
                : filtered.map((h, i) => (
                  <div key={h.id} style={{ animation: `fadeUp 0.4s ${i * 55}ms ease-out both` }}>
                    <HabitCard
                      habit={h}
                      onDelete={handleDeleteRequest}
                      onAddProgress={handleAddProgress}
                      progress={todayProgress[h.id] || 0}
                      addingProgress={addingId === h.id}
                    />
                  </div>
                ))
              }
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 88 }}>
              <GardenChart habits={habits} />

              <div className="tip-card">
                <p className="tip-card-title">Совет садовника</p>
                <p className="tip-card-body">
                  {(() => {
                    const done = habits.filter(h => {
                      const p = todayProgress[h.id] || 0
                      return h.target_value != null ? p >= Number(h.target_value) : p > 0
                    }).length
                    if (done === 0) return 'Начните день — зафиксируйте первый прогресс.'
                    if (done < habits.length) return `Отлично! Ещё ${habits.length - done} привычек ждут вас.`
                    return 'Все цели выполнены! Сад процветает.'
                  })()}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteTarget && (
        <ConfirmModal
          habit={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getHabit, updateHabit, createHabitRecord, getHabitRecordsForHabit,
} from '../api/habits'
import { useAuth } from '../context/AuthContext'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

// Plugin: draws a dashed horizontal target line directly on canvas
// — no LineController needed
const targetLinePlugin = {
  id: 'targetLine',
  afterDraw(chart) {
    const target = chart.options._targetValue
    if (target == null) return
    const { ctx, chartArea, scales } = chart
    if (!chartArea || !scales.y) return
    const yPos = scales.y.getPixelForValue(Number(target))
    ctx.save()
    ctx.strokeStyle = '#C1440E'
    ctx.lineWidth = 1.8
    ctx.setLineDash([5, 4])
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.moveTo(chartArea.left,  yPos)
    ctx.lineTo(chartArea.right, yPos)
    ctx.stroke()
    // Label "Цель"
    ctx.globalAlpha = 1
    ctx.fillStyle = '#C1440E'
    ctx.font = '600 10px Lato, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`Цель: ${target}`, chartArea.right - 4, yPos - 5)
    ctx.restore()
  },
}
ChartJS.register(targetLinePlugin)

// ── Helpers ──────────────────────────────────────────────────────

const toDateKey = (d) => new Date(d).toISOString().slice(0, 10)
const today = () => toDateKey(new Date())

// Aggregate records by date
function byDate(records) {
  const map = {}
  records.forEach(r => {
    const k = toDateKey(r.timestamp)
    map[k] = (map[k] || 0) + Number(r.value)
  })
  return map
}

// Is a given day "done" based on target
function isDone(value, target) {
  return target != null ? value >= Number(target) : value > 0
}

// Current streak (consecutive done days ending at today or yesterday)
function calcStreak(map, target) {
  const todayKey = today()
  let check = new Date()
  check.setHours(0, 0, 0, 0)

  if (!isDone(map[todayKey] || 0, target)) {
    check.setDate(check.getDate() - 1)
  }

  let streak = 0
  while (streak < 3650) {
    const k = toDateKey(check)
    if (!isDone(map[k] || 0, target)) break
    streak++
    check.setDate(check.getDate() - 1)
  }
  return streak
}

// Best (longest ever) streak
function calcBestStreak(map, target) {
  const keys = Object.keys(map).sort()
  if (!keys.length) return 0
  let best = 0, run = 0, prev = null
  keys.forEach(k => {
    if (!isDone(map[k] || 0, target)) { run = 0; prev = null; return }
    if (!prev) { run = 1 }
    else {
      const d = new Date(k), p = new Date(prev)
      p.setDate(p.getDate() + 1)
      run = toDateKey(p) === k ? run + 1 : 1
    }
    if (run > best) best = run
    prev = k
  })
  return best
}

// Last N days as YYYY-MM-DD strings
function lastDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return toDateKey(d)
  })
}

// Month label for a date key
const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
const monthLabel = (key) => MONTHS_SHORT[new Date(key).getMonth()]

// ── Streak flame icon ────────────────────────────────────────────
function FlameIcon({ size = 36 }) {
  return (
    <svg className="streak-flame" width={size} height={size} viewBox="0 0 36 36" fill="none"
      aria-hidden="true">
      <path d="M18 33C18 33 8 26 8 17C8 10 13 5 18 5C18 5 16 10 18 13C20 16 24 14 24 14C24 14 28 19 25 25C23 29 20 32 18 33Z"
        fill="#C49A3C"/>
      <path d="M18 33C18 33 12 27 12 21C12 17 15 14 18 14C18 14 17 17 18 19C19 21 22 20 22 20C22 20 24 23 22 27C21 30 19 32 18 33Z"
        fill="#C1440E"/>
      <path d="M18 33C18 33 15 29 15 25C15 23 16.5 21.5 18 21.5C18 21.5 17.5 23 18 24C18.5 25 20 24.5 20 24.5C20 24.5 21 26 20 28.5C19.5 30.5 18 33 18 33Z"
        fill="#FFFDF7" opacity="0.8"/>
    </svg>
  )
}

// ── Bar chart: last 30 days ──────────────────────────────────────
function ProgressChart({ dateMap, target, unit }) {
  const days   = lastDays(30)
  const labels = days.map(k => {
    const d = new Date(k)
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
  })
  const values = days.map(k => dateMap[k] || 0)
  const max    = Math.max(target ? Number(target) * 1.3 : 10, ...values, 5)

  const data = {
    labels,
    datasets: [{
      label: unit,
      data: values,
      backgroundColor: days.map(k =>
        isDone(dateMap[k] || 0, target) ? 'rgba(45,106,79,0.78)' : 'rgba(149,196,160,0.65)'
      ),
      borderColor: days.map(k =>
        isDone(dateMap[k] || 0, target) ? '#2D6A4F' : '#95C4A0'
      ),
      borderWidth: 1.5,
      borderRadius: 4,
      borderSkipped: false,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // pass target to the plugin via custom option
    _targetValue: target,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#FFFDF7', titleColor: '#1A1A14', bodyColor: '#6B5B4E',
        borderColor: '#D6C9B6', borderWidth: 1, padding: 10,
        titleFont: { family: 'Playfair Display', size: 12, style: 'italic' },
        bodyFont: { family: 'Lato', size: 12 },
        callbacks: { label: (ctx) => ` ${ctx.parsed.y} ${unit}` },
      },
      targetLine: {},   // enable the plugin
    },
    scales: {
      x: {
        ticks: { font: { family: 'Lato', size: 9 }, color: '#6B5B4E',
          maxRotation: 45, autoSkip: true, maxTicksLimit: 10 },
        grid: { color: 'rgba(214,201,182,0.3)' },
      },
      y: {
        min: 0, max,
        ticks: { font: { family: 'Lato', size: 10 }, color: '#6B5B4E' },
        grid: { color: 'rgba(214,201,182,0.4)' },
      },
    },
  }

  return (
    <div style={{ height: 220, position: 'relative' }}>
      <Bar data={data} options={options} />
    </div>
  )
}

// ── GitHub-style calendar heatmap ───────────────────────────────
const DAY_LABELS = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']

function HeatmapCalendar({ dateMap, target, unit }) {
  const todayKey = today()

  // Build 91-day grid aligned to weeks (Sun-Sat)
  const end   = new Date(); end.setHours(0,0,0,0)
  const start = new Date(end); start.setDate(start.getDate() - 90)
  // Round start back to Sunday
  start.setDate(start.getDate() - start.getDay())

  // Collect weeks
  const weeks = []
  const cur   = new Date(start)
  while (cur <= end) {
    const week = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }

  const cellColor = (date) => {
    const k   = toDateKey(date)
    const val = dateMap[k] || 0
    const fut = date > end
    if (fut) return '#EEE8DE'
    if (val === 0) return k === todayKey ? '#D6C9B6' : '#EED5CC'
    if (target != null) {
      if (val >= Number(target)) return '#2D6A4F'
      const pct = val / Number(target)
      if (pct >= 0.5) return '#52B788'
      return '#95C4A0'
    }
    return '#2D6A4F'
  }

  const cellTitle = (date) => {
    const k   = toDateKey(date)
    const val = dateMap[k] || 0
    const label = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    return val > 0
      ? `${label}: ${val} ${unit}`
      : `${label}: нет записей`
  }

  // Month labels: find first cell of each new month per week
  const monthPositions = []
  weeks.forEach((week, wi) => {
    const firstDay = week.find(d => d <= end)
    if (!firstDay) return
    if (wi === 0 || firstDay.getDate() <= 7) {
      const label = monthLabel(toDateKey(firstDay))
      if (!monthPositions.length || monthPositions.at(-1).label !== label) {
        monthPositions.push({ wi, label })
      }
    }
  })

  return (
    <div>
      {/* Month labels */}
      <div style={{ display: 'flex', marginLeft: 34, marginBottom: 4 }}>
        {weeks.map((_, wi) => {
          const mp = monthPositions.find(m => m.wi === wi)
          return (
            <div key={wi} style={{ width: 17, flexShrink: 0 }}>
              {mp && (
                <span className="calendar-month-label">{mp.label}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* Day labels */}
        <div className="calendar-day-labels" style={{ marginTop: 0 }}>
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="calendar-day-label">
              {i % 2 === 1 ? l : ''}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="calendar-outer" style={{ flex: 1 }}>
          <div className="calendar-grid">
            {weeks.map((week, wi) =>
              week.map((date, di) => (
                <div
                  key={`${wi}-${di}`}
                  className="calendar-cell"
                  style={{ background: cellColor(date) }}
                  title={date <= end ? cellTitle(date) : ''}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
        <span>Меньше</span>
        {['#EED5CC','#95C4A0','#52B788','#2D6A4F'].map((c, i) => (
          <div key={i} className="calendar-legend-cell" style={{ background: c }} />
        ))}
        <span>Больше</span>
      </div>
    </div>
  )
}

// ── Today's add-progress form ─────────────────────────────────────
function TodayPanel({ habit, todayVal, onAdd, adding }) {
  const [val, setVal] = useState('')
  const target  = habit.target_value != null ? Number(habit.target_value) : null
  const pct     = target ? Math.min(100, Math.round((todayVal / target) * 100)) : null
  const isDoneToday = target ? todayVal >= target : todayVal > 0

  const submit = () => {
    const n = Number(val)
    if (!n || n <= 0) return
    onAdd(n)
    setVal('')
  }

  return (
    <div className="detail-today">
      <p style={{ fontFamily: '"Playfair Display",serif', fontStyle: 'italic',
        fontSize: '0.82rem', color: 'var(--garden-forest)', marginBottom: 12, fontWeight: 600 }}>
        Прогресс сегодня
      </p>

      {target != null && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            fontFamily: 'Lato,sans-serif', fontSize: '0.8rem',
            color: isDoneToday ? 'var(--garden-forest)' : 'var(--garden-bark)',
            fontWeight: isDoneToday ? 700 : 400, marginBottom: 6 }}>
            <span><strong>{todayVal}</strong> / {target} {habit.unit}</span>
            <span>{pct}%</span>
          </div>
          <div className="habit-progress-track">
            <div className="habit-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {isDoneToday ? (
        <div className="habit-done-badge" style={{ marginBottom: 10 }}>
          <div className="habit-done-check">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {target ? 'Цель достигнута!' : 'Выполнено сегодня'}
        </div>
      ) : null}

      <div className="habit-add-form">
        <input
          className="habit-add-input"
          type="number" min="1" step="1"
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="0" disabled={adding}
          aria-label={`Добавить ${habit.unit}`}
        />
        <span className="habit-add-unit">{habit.unit}</span>
        <button
          className="habit-add-btn"
          onClick={submit}
          disabled={adding || !val || Number(val) <= 0}
        >
          {adding
            ? <><span style={{ display:'inline-block',width:10,height:10,border:'1.5px solid rgba(255,253,247,0.4)',borderTopColor:'#FFFDF7',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/> Фиксируем…</>
            : '+ Добавить'
          }
        </button>
      </div>
    </div>
  )
}

// ── Edit goal form ───────────────────────────────────────────────
function EditGoalPanel({ habit, onSaved }) {
  const [val, setVal]   = useState(String(habit.target_value ?? ''))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const save = async () => {
    const n = val === '' ? null : Number(val)
    if (n !== null && (isNaN(n) || n <= 0)) return
    setSaving(true)
    try {
      const updated = await updateHabit(habit.id, { target_value: n })
      onSaved(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  return (
    <div className="detail-section">
      <p className="detail-section-title">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
          stroke="var(--garden-forest)" strokeWidth="1.5" opacity="0.7">
          <path d="M9 2L12 5L5 12H2V9L9 2Z" strokeLinejoin="round"/>
        </svg>
        Изменить цель
      </p>
      <div className="edit-goal-form">
        <input
          className="edit-goal-input"
          type="number" min="1" step="1"
          value={val}
          onChange={e => { setVal(e.target.value); setSaved(false) }}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="без цели"
        />
        <span className="edit-goal-unit">{habit.unit} в день</span>
        <button className="habit-add-btn" onClick={save} disabled={saving}>
          {saving ? 'Сохраняем…' : saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
        {habit.target_value != null && (
          <button
            onClick={() => { setVal(''); }}
            style={{ fontFamily:'Lato,sans-serif', fontSize:'0.75rem',
              color:'var(--garden-soil)', background:'transparent',
              border:'none', cursor:'pointer', textDecoration:'underline' }}
          >
            Убрать цель
          </button>
        )}
      </div>
      <p style={{ fontFamily:'Lato,sans-serif', fontSize:'0.72rem',
        color:'var(--garden-soil)', marginTop: 10, lineHeight: 1.5, opacity: 0.8 }}>
        Изменение цели не затрагивает прошлые записи — только влияет на то,
        как считается прогресс с сегодняшнего дня.
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function HabitDetailPage() {
  const { habitId } = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()

  const [habit, setHabit]     = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)

  useEffect(() => {
    if (!user?.id || !habitId) return
    Promise.all([getHabit(habitId), getHabitRecordsForHabit(user.id, habitId)])
      .then(([h, recs]) => { setHabit(h); setRecords(recs) })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [habitId, user?.id])

  const dateMap  = useMemo(() => byDate(records), [records])
  const target   = habit?.target_value != null ? Number(habit.target_value) : null
  const todayVal = dateMap[today()] || 0
  const streak   = useMemo(() => calcStreak(dateMap, target), [dateMap, target])
  const best     = useMemo(() => calcBestStreak(dateMap, target), [dateMap, target])
  const total    = records.length

  const handleAdd = async (value) => {
    setAdding(true)
    try {
      const rec = await createHabitRecord({ user_id: user.id, habit_id: habitId, value })
      setRecords(prev => [...prev, rec])
    } catch { /* silent */ }
    finally { setAdding(false) }
  }

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:12,
        justifyContent:'center', padding:'5rem', color:'var(--garden-soil)',
        fontFamily:'Lato,sans-serif', fontSize:'0.875rem' }}>
        <span style={{ display:'inline-block', width:18, height:18,
          border:'2px solid var(--garden-leaf)', borderTopColor:'var(--garden-forest)',
          borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        Загрузка…
      </div>
    )
  }

  if (!habit) return null

  const PERIOD_LABEL = { daily:'ежедневно', weekly:'еженедельно', monthly:'ежемесячно' }

  return (
    <div style={{ maxWidth: 720, animation: 'fadeIn 0.4s ease-out both' }}>
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'2rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{ width:36, height:36, borderRadius:'50%',
            border:'1.5px solid var(--garden-border)', background:'transparent',
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--garden-soil)', flexShrink:0, transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--garden-mist)'; e.currentTarget.style.borderColor='var(--garden-leaf)' }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='var(--garden-border)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 7H4M7 4L4 7l3 3"/>
          </svg>
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.75rem',
            fontWeight:700, color:'var(--garden-bark)', margin:0, lineHeight:1.2,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {habit.name}
          </h1>
          <p style={{ fontFamily:'Lato,sans-serif', fontSize:'0.8rem',
            color:'var(--garden-soil)', margin:'4px 0 0',
            display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--garden-sage)', display:'inline-block' }}/>
            {PERIOD_LABEL[habit.periodicity] ?? habit.periodicity}
            {habit.target_value != null && ` · цель: ${habit.target_value} ${habit.unit}`}
            {habit.description && ` · ${habit.description}`}
          </p>
        </div>
      </div>

      {/* ── Streak + Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:16, marginBottom:'1.5rem' }}>
        {/* Streak */}
        <div className="detail-section" style={{ display:'flex', alignItems:'center', gap:14, minWidth:160 }}>
          <FlameIcon size={40} />
          <div>
            <div className="streak-number">{streak}</div>
            <div className="streak-label">дней подряд</div>
          </div>
        </div>

        {/* Other stats */}
        <div className="detail-stats">
          <div className="detail-stat">
            <div className="detail-stat-value">{best}</div>
            <div className="detail-stat-label">Рекорд</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-value">{total}</div>
            <div className="detail-stat-label">Всего записей</div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-value">
              {target != null ? target : '—'}
            </div>
            <div className="detail-stat-label">{habit.unit} / день</div>
          </div>
        </div>
      </div>

      {/* ── Today ── */}
      <div style={{ marginBottom:'1.5rem' }}>
        <TodayPanel
          habit={habit}
          todayVal={todayVal}
          onAdd={handleAdd}
          adding={adding}
        />
      </div>

      {/* ── Bar chart ── */}
      <div className="detail-section" style={{ marginBottom:'1.5rem' }}>
        <p className="detail-section-title">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke="var(--garden-forest)" strokeWidth="1.5" opacity="0.7">
            <rect x="1" y="6" width="3" height="7" rx="0.5"/>
            <rect x="5.5" y="3" width="3" height="10" rx="0.5"/>
            <rect x="10" y="1" width="3" height="12" rx="0.5"/>
          </svg>
          Прогресс за 30 дней
        </p>
        <ProgressChart dateMap={dateMap} target={target} unit={habit.unit} />
      </div>

      {/* ── Calendar ── */}
      <div className="detail-section" style={{ marginBottom:'1.5rem' }}>
        <p className="detail-section-title">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke="var(--garden-forest)" strokeWidth="1.5" opacity="0.7">
            <rect x="1.5" y="2.5" width="11" height="10" rx="1.5"/>
            <path d="M4.5 1v3M9.5 1v3M1.5 6h11" strokeLinecap="round"/>
          </svg>
          Активность за 90 дней
        </p>
        <HeatmapCalendar dateMap={dateMap} target={target} unit={habit.unit} />
      </div>

      {/* ── Edit goal ── */}
      <EditGoalPanel habit={habit} onSaved={setHabit} />
    </div>
  )
}

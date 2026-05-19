import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { getAdminStats, getAdminMetricsSummary } from '../../api/admin'

const STAT_CARDS = [
  { key: 'users_total',           label: 'Пользователей',         color: '#D4E6D9', icon: '◉' },
  { key: 'users_active_today',    label: 'Активных сегодня',      color: '#E8EDCF', icon: '◈' },
  { key: 'habits_total',          label: 'Привычек',              color: '#D4E6D9', icon: '◇' },
  { key: 'records_today',         label: 'Записей сегодня',       color: '#E8EDCF', icon: '◆' },
  { key: 'notifications_pending', label: 'Уведомлений ожидает',   color: '#FFF3CD', icon: '◎' },
  { key: 'notifications_failed',  label: 'Уведомлений с ошибкой', color: '#FDECEA', icon: '◉' },
]

const HTTP_CARDS = [
  { key: 'http_total', label: 'Всего запросов', color: '#D4E6D9', icon: '↗' },
  { key: '2xx',        label: '2xx OK',         color: '#D4E6D9', icon: '✓', fromStatus: true },
  { key: '4xx',        label: '4xx Клиент',     color: '#FFF3CD', icon: '!', fromStatus: true },
  { key: '5xx',        label: '5xx Сервер',     color: '#FDECEA', icon: '✕', fromStatus: true },
]

const CRUD_OPS = ['create', 'update', 'delete']

const CRUD_LABELS = {
  habits:       'Привычки',
  habit_records: 'Записи привычек',
  users:        'Пользователи',
  goals:        'Цели',
  goal_records: 'Записи целей',
  notifications: 'Уведомления',
  api_keys:     'API-ключи',
}

export default function AdminDashboard() {
  const { authHeader } = useAdminAuth()
  const [stats, setStats]     = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [error, setError]     = useState('')

  useEffect(() => {
    getAdminStats(authHeader).then(setStats).catch(() => setError('Не удалось загрузить статистику'))
    getAdminMetricsSummary(authHeader).then(setMetrics).catch(() => {})
  }, [authHeader])

  return (
    <div>
      {/* ── DB Stats ─────────────────────────────────────────────── */}
      <h1 style={headingStyle}>Dashboard</h1>
      {error && <p style={{ color: '#C0392B', fontFamily: 'Lato, sans-serif' }}>{error}</p>}

      {stats ? (
        <div style={gridStyle}>
          {STAT_CARDS.map(({ key, label, color, icon }) => (
            <StatCard key={key} value={stats[key] ?? '—'} label={label} color={color} icon={icon} />
          ))}
        </div>
      ) : !error ? (
        <Loader />
      ) : null}

      {/* ── Prometheus Metrics ───────────────────────────────────── */}
      <SectionHeader title="Метрики процесса" subtitle="с момента последнего перезапуска" />

      {metrics ? (
        <>
          {/* HTTP stats */}
          <div style={gridStyle}>
            {HTTP_CARDS.map(({ key, label, color, icon, fromStatus }) => (
              <StatCard
                key={key}
                value={fromStatus ? (metrics.http_by_status?.[key] ?? 0) : (metrics[key] ?? '—')}
                label={label}
                color={color}
                icon={icon}
              />
            ))}
            <StatCard
              value={metrics.avg_latency_ms != null ? `${metrics.avg_latency_ms} ms` : '—'}
              label="Средняя задержка"
              color="#E8EDCF"
              icon="⏱"
            />
          </div>

          {/* Two-column: top endpoints + CRUD table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>

            {/* Top endpoints */}
            <div style={tableCardStyle}>
              <div style={tableHeaderStyle}>Топ эндпоинтов</div>
              {metrics.top_endpoints?.length ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <Th>Маршрут</Th>
                      <Th align="right">Запросов</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.top_endpoints.map(({ handler, count }) => (
                      <tr key={handler} style={{ borderTop: '1px solid rgba(214,201,182,0.3)' }}>
                        <Td>
                          <span style={{
                            fontFamily: '"Courier New", monospace',
                            fontSize: '0.75rem', color: '#1B3A2D',
                          }}>
                            {handler}
                          </span>
                        </Td>
                        <Td align="right">
                          <CountBadge value={count} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={emptyStyle}>Нет данных (запросы ещё не поступали)</p>
              )}
            </div>

            {/* CRUD ops */}
            <div style={tableCardStyle}>
              <div style={tableHeaderStyle}>CRUD-операции</div>
              {Object.keys(metrics.crud_ops ?? {}).length ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <Th>Таблица</Th>
                      {CRUD_OPS.map(op => <Th key={op} align="right">{op}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(metrics.crud_ops).map(([table, ops]) => (
                      <tr key={table} style={{ borderTop: '1px solid rgba(214,201,182,0.3)' }}>
                        <Td>
                          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.8rem', color: '#1B3A2D' }}>
                            {CRUD_LABELS[table] ?? table}
                          </span>
                        </Td>
                        {CRUD_OPS.map(op => (
                          <Td key={op} align="right">
                            <CountBadge value={ops[op] ?? 0} dimZero />
                          </Td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={emptyStyle}>Нет данных (ни одной CRUD-операции с запуска)</p>
              )}
            </div>

          </div>

          {/* Gauges row */}
          {(metrics.habits_active != null || metrics.users_total != null) && (
            <>
              <SectionHeader title="Gauge-метрики" subtitle="обновляются каждые 30 секунд" />
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {metrics.habits_active != null && (
                  <StatCard value={metrics.habits_active} label="Активных привычек (Prometheus)" color="#D4E6D9" icon="◇" wide />
                )}
                {metrics.users_total != null && (
                  <StatCard value={metrics.users_total} label="Пользователей (Prometheus)" color="#D4E6D9" icon="◉" wide />
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <p style={{ fontFamily: 'Lato, sans-serif', color: '#7A6552', marginTop: 16 }}>
          Метрики недоступны (Prometheus client не инициализирован)
        </p>
      )}
    </div>
  )
}

// ── Small components ─────────────────────────────────────────────

function StatCard({ value, label, color, icon, wide }) {
  return (
    <div style={{
      background: '#FFFDF7',
      border: '1px solid rgba(214,201,182,0.5)',
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: '0 2px 8px rgba(60,48,36,0.05)',
      ...(wide ? { minWidth: 200 } : {}),
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', marginBottom: 12,
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: '"Playfair Display", serif',
        fontWeight: 700, fontSize: '1.8rem',
        color: '#1B3A2D', lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'Lato, sans-serif',
        fontSize: '0.78rem', color: '#7A6552',
        marginTop: 6,
      }}>
        {label}
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginTop: 36, marginBottom: 4 }}>
      <h2 style={{ ...headingStyle, fontSize: '1.15rem', margin: 0 }}>{title}</h2>
      {subtitle && (
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '0.72rem', color: '#7A6552' }}>
          {subtitle}
        </span>
      )}
    </div>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <th style={{
      textAlign: align,
      fontFamily: 'Lato, sans-serif', fontSize: '0.7rem',
      fontWeight: 700, color: '#7A6552',
      textTransform: 'uppercase', letterSpacing: '0.05em',
      padding: '6px 8px',
    }}>
      {children}
    </th>
  )
}

function Td({ children, align = 'left' }) {
  return (
    <td style={{ textAlign: align, padding: '7px 8px', verticalAlign: 'middle' }}>
      {children}
    </td>
  )
}

function CountBadge({ value, dimZero }) {
  const isZero = value === 0
  return (
    <span style={{
      fontFamily: '"Playfair Display", serif',
      fontSize: '0.9rem', fontWeight: 700,
      color: isZero && dimZero ? 'rgba(122,101,82,0.3)' : '#1B3A2D',
    }}>
      {value}
    </span>
  )
}

function Loader() {
  return <p style={{ fontFamily: 'Lato, sans-serif', color: '#7A6552' }}>Загрузка…</p>
}

// ── Styles ───────────────────────────────────────────────────────

const headingStyle = {
  fontFamily: '"Playfair Display", serif',
  fontWeight: 700, fontSize: '1.6rem',
  color: '#1B3A2D', margin: 0,
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: 20, marginTop: 24,
}

const tableCardStyle = {
  background: '#FFFDF7',
  border: '1px solid rgba(214,201,182,0.5)',
  borderRadius: 14,
  padding: '18px 20px',
  boxShadow: '0 2px 8px rgba(60,48,36,0.05)',
  overflow: 'hidden',
}

const tableHeaderStyle = {
  fontFamily: '"Playfair Display", serif',
  fontWeight: 700, fontSize: '1rem',
  color: '#1B3A2D', marginBottom: 14,
}

const emptyStyle = {
  fontFamily: 'Lato, sans-serif',
  fontSize: '0.78rem', color: '#7A6552',
  margin: '8px 0',
}

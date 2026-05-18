import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { NotificationProvider, useNotifications, EVENT_META } from '../context/NotificationContext'
import { AuthContext } from '../context/AuthContext'

// ── EventSource mock ─────────────────────────────────────────────
class FakeEventSource {
  constructor(url) {
    this.url = url
    this.onmessage = null
    this.onerror   = null
    FakeEventSource.last = this
  }
  close() { this.closed = true }
}
FakeEventSource.last = null

beforeEach(() => {
  FakeEventSource.last = null
  vi.stubGlobal('EventSource', FakeEventSource)
  vi.useFakeTimers()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// ── Helpers ──────────────────────────────────────────────────────

function makeUser(id = 'user-1') {
  return { id, email: 'test@example.com' }
}

// Expose context values through a test component
function Inspector() {
  const ctx = useNotifications()
  return (
    <div>
      <span data-testid="unread">{ctx.unread}</span>
      <span data-testid="history-len">{ctx.history.length}</span>
      <span data-testid="toast-len">{ctx.toasts.length}</span>
      {ctx.history[0] && <span data-testid="first-event">{ctx.history[0].event}</span>}
    </div>
  )
}

function renderWithUser(user) {
  return render(
    <AuthContext.Provider value={{ user, login: vi.fn(), logout: vi.fn() }}>
      <NotificationProvider>
        <Inspector />
      </NotificationProvider>
    </AuthContext.Provider>
  )
}

function pushEvent(data) {
  act(() => {
    FakeEventSource.last.onmessage({ data: JSON.stringify(data) })
  })
}

// ── Tests ────────────────────────────────────────────────────────

describe('NotificationProvider', () => {
  it('запускает SSE-поток когда пользователь залогинен', () => {
    renderWithUser(makeUser('abc'))
    expect(FakeEventSource.last).not.toBeNull()
    expect(FakeEventSource.last.url).toContain('abc')
  })

  it('не запускает поток без пользователя', () => {
    renderWithUser(null)
    expect(FakeEventSource.last).toBeNull()
  })

  it('добавляет уведомление в историю при получении события', () => {
    renderWithUser(makeUser())
    pushEvent({ event: 'goal_completed', payload: {} })

    expect(screen.getByTestId('history-len').textContent).toBe('1')
    expect(screen.getByTestId('first-event').textContent).toBe('goal_completed')
  })

  it('увеличивает счётчик непрочитанных при каждом событии', () => {
    renderWithUser(makeUser())

    pushEvent({ event: 'goal_completed', payload: {} })
    pushEvent({ event: 'streak_lost',    payload: {} })

    expect(screen.getByTestId('unread').textContent).toBe('2')
  })

  it('показывает тост при получении события', () => {
    renderWithUser(makeUser())
    pushEvent({ event: 'daily_remainder', payload: {} })

    expect(screen.getByTestId('toast-len').textContent).toBe('1')
  })

  it('автоматически скрывает тост после 4 секунд', async () => {
    renderWithUser(makeUser())
    pushEvent({ event: 'streak_lost', payload: {} })
    expect(screen.getByTestId('toast-len').textContent).toBe('1')

    act(() => { vi.advanceTimersByTime(4000) })
    expect(screen.getByTestId('toast-len').textContent).toBe('0')
  })

  it('история не превышает 50 уведомлений', () => {
    renderWithUser(makeUser())

    for (let i = 0; i < 55; i++) {
      pushEvent({ event: 'goal_completed', payload: { i } })
    }

    expect(screen.getByTestId('history-len').textContent).toBe('50')
  })

  it('останавливает поток при размонтировании', () => {
    const { unmount } = renderWithUser(makeUser())
    const src = FakeEventSource.last

    unmount()
    expect(src.closed).toBe(true)
  })
})

describe('EVENT_META', () => {
  it('содержит метаданные для всех событий', () => {
    const events = ['goal_completed', 'daily_remainder', 'streak_lost', 'summary_weekly']
    events.forEach(e => {
      expect(EVENT_META[e]).toBeDefined()
      expect(EVENT_META[e].icon).toBeTruthy()
      expect(EVENT_META[e].label).toBeTruthy()
    })
  })
})

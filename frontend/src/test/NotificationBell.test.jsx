import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationBell from '../components/NotificationBell'
import { NotificationContext } from '../context/NotificationContext'

// ── Helper ───────────────────────────────────────────────────────

function makeCtx(overrides = {}) {
  return {
    history:     [],
    unread:      0,
    markAllRead: vi.fn(),
    ...overrides,
  }
}

function renderBell(ctx) {
  return render(
    <NotificationContext.Provider value={ctx}>
      <NotificationBell />
    </NotificationContext.Provider>
  )
}

// ── Tests ────────────────────────────────────────────────────────

describe('NotificationBell', () => {
  it('рендерится без бейджа когда непрочитанных нет', () => {
    renderBell(makeCtx({ unread: 0 }))
    expect(screen.queryByText(/\d+/)).toBeNull()
  })

  it('показывает бейдж с количеством непрочитанных', () => {
    renderBell(makeCtx({ unread: 3 }))
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('показывает "99+" когда непрочитанных больше 99', () => {
    renderBell(makeCtx({ unread: 150 }))
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('дропдаун скрыт по умолчанию', () => {
    renderBell(makeCtx())
    expect(screen.queryByText('Уведомления')).toBeNull()
  })

  it('открывает дропдаун при клике на колокольчик', () => {
    renderBell(makeCtx())
    fireEvent.click(screen.getByTitle('Уведомления'))
    expect(screen.getByText('Уведомления')).toBeInTheDocument()
  })

  it('закрывает дропдаун при повторном клике', () => {
    renderBell(makeCtx())
    const btn = screen.getByTitle('Уведомления')

    fireEvent.click(btn)
    fireEvent.click(btn)

    expect(screen.queryByText('Уведомления')).toBeNull()
  })

  it('вызывает markAllRead при открытии если есть непрочитанные', () => {
    const ctx = makeCtx({ unread: 5 })
    renderBell(ctx)

    fireEvent.click(screen.getByTitle('Уведомления'))

    expect(ctx.markAllRead).toHaveBeenCalledOnce()
  })

  it('не вызывает markAllRead при открытии если непрочитанных нет', () => {
    const ctx = makeCtx({ unread: 0 })
    renderBell(ctx)

    fireEvent.click(screen.getByTitle('Уведомления'))

    expect(ctx.markAllRead).not.toHaveBeenCalled()
  })

  it('показывает заглушку "Уведомлений пока нет" для пустой истории', () => {
    renderBell(makeCtx({ history: [] }))
    fireEvent.click(screen.getByTitle('Уведомления'))
    expect(screen.getByText('Уведомлений пока нет')).toBeInTheDocument()
  })

  it('отображает уведомления из истории', () => {
    const history = [
      { id: '1', event: 'goal_completed',  payload: {}, timestamp: new Date(), read: false },
      { id: '2', event: 'streak_lost',     payload: {}, timestamp: new Date(), read: true  },
    ]
    renderBell(makeCtx({ history }))
    fireEvent.click(screen.getByTitle('Уведомления'))

    expect(screen.getByText('Цель выполнена')).toBeInTheDocument()
    expect(screen.getByText('Серия прервалась')).toBeInTheDocument()
  })

  it('закрывается при клике вне дропдауна', () => {
    renderBell(makeCtx())
    fireEvent.click(screen.getByTitle('Уведомления'))
    expect(screen.getByText('Уведомления')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Уведомления')).toBeNull()
  })
})

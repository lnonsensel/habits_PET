import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationToast from '../components/NotificationToast'
import { NotificationContext } from '../context/NotificationContext'

function makeToast(overrides = {}) {
  return { id: 'toast-1', event: 'goal_completed', payload: {}, timestamp: new Date(), ...overrides }
}

function renderToast(toasts, dismissToast = vi.fn()) {
  return render(
    <NotificationContext.Provider value={{ toasts, dismissToast }}>
      <NotificationToast />
    </NotificationContext.Provider>
  )
}

describe('NotificationToast', () => {
  it('ничего не рендерит когда тостов нет', () => {
    const { container } = renderToast([])
    expect(container.firstChild).toBeNull()
  })

  it('показывает текст из EVENT_META для известного события', () => {
    renderToast([makeToast({ event: 'goal_completed' })])
    expect(screen.getByText('Цель выполнена')).toBeInTheDocument()
  })

  it('показывает текст события напрямую для неизвестного типа', () => {
    renderToast([makeToast({ event: 'custom_event' })])
    expect(screen.getByText('custom_event')).toBeInTheDocument()
  })

  it('показывает иконку тоста', () => {
    renderToast([makeToast({ event: 'goal_completed' })])
    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  it('вызывает dismissToast при клике на кнопку закрытия', () => {
    const dismiss = vi.fn()
    renderToast([makeToast({ id: 'abc' })], dismiss)

    fireEvent.click(screen.getByTitle('Закрыть'))
    expect(dismiss).toHaveBeenCalledWith('abc')
  })

  it('рендерит несколько тостов одновременно', () => {
    renderToast([
      makeToast({ id: '1', event: 'goal_completed'  }),
      makeToast({ id: '2', event: 'streak_lost'     }),
      makeToast({ id: '3', event: 'daily_remainder' }),
    ])
    expect(screen.getByText('Цель выполнена')).toBeInTheDocument()
    expect(screen.getByText('Серия прервалась')).toBeInTheDocument()
    expect(screen.getByText('Не забудь отметить привычки')).toBeInTheDocument()
  })

  it('у каждого тоста своя кнопка закрытия', () => {
    const dismiss = vi.fn()
    renderToast([
      makeToast({ id: 'x1', event: 'goal_completed' }),
      makeToast({ id: 'x2', event: 'streak_lost'    }),
    ], dismiss)

    const btns = screen.getAllByTitle('Закрыть')
    expect(btns).toHaveLength(2)

    fireEvent.click(btns[1])
    expect(dismiss).toHaveBeenCalledWith('x2')
  })
})

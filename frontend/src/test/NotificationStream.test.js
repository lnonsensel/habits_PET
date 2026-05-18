import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NotificationStream } from '../api/notifications'

// ── EventSource mock ─────────────────────────────────────────────
class FakeEventSource {
  constructor(url) {
    this.url = url
    this.onmessage = null
    this.onerror   = null
    FakeEventSource.instances.push(this)
  }
  close() { this.closed = true }
}
FakeEventSource.instances = []

beforeEach(() => {
  FakeEventSource.instances = []
  vi.stubGlobal('EventSource', FakeEventSource)
  vi.useFakeTimers()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function lastSource() {
  return FakeEventSource.instances.at(-1)
}

// ── Tests ────────────────────────────────────────────────────────

describe('NotificationStream', () => {
  it('открывает EventSource на правильный URL', () => {
    new NotificationStream('user-42', vi.fn()).start()
    expect(lastSource().url).toBe('/notifications/stream/user-42')
  })

  it('вызывает onEvent при получении сообщения', () => {
    const onEvent = vi.fn()
    new NotificationStream('u1', onEvent).start()

    lastSource().onmessage({ data: JSON.stringify({ event: 'goal_completed', payload: {} }) })

    expect(onEvent).toHaveBeenCalledOnce()
    expect(onEvent).toHaveBeenCalledWith({ event: 'goal_completed', payload: {} })
  })

  it('игнорирует некорректный JSON без исключения', () => {
    const onEvent = vi.fn()
    new NotificationStream('u1', onEvent).start()

    expect(() => lastSource().onmessage({ data: 'not-json' })).not.toThrow()
    expect(onEvent).not.toHaveBeenCalled()
  })

  it('переподключается после ошибки с задержкой 1000 мс', () => {
    new NotificationStream('u1', vi.fn()).start()
    const first = lastSource()

    first.onerror()
    expect(first.closed).toBe(true)
    expect(FakeEventSource.instances).toHaveLength(1) // ещё не переподключился

    vi.advanceTimersByTime(1000)
    expect(FakeEventSource.instances).toHaveLength(2)
  })

  it('увеличивает задержку вдвое при каждой ошибке (backoff)', () => {
    new NotificationStream('u1', vi.fn()).start()

    lastSource().onerror()
    vi.advanceTimersByTime(1000) // 1-й реконнект

    lastSource().onerror()
    vi.advanceTimersByTime(1000) // задержка теперь 2000 — ещё не реконнект
    expect(FakeEventSource.instances).toHaveLength(2)

    vi.advanceTimersByTime(1000) // итого 2000 — реконнект
    expect(FakeEventSource.instances).toHaveLength(3)
  })

  it('ограничивает задержку реконнекта 30 секундами', () => {
    const stream = new NotificationStream('u1', vi.fn())
    stream.start()

    // Форсируем много ошибок
    for (let i = 0; i < 20; i++) {
      lastSource().onerror()
      vi.advanceTimersByTime(stream._delay)
    }

    expect(stream._delay).toBe(30_000)
  })

  it('сбрасывает задержку после успешного сообщения', () => {
    const stream = new NotificationStream('u1', vi.fn())
    stream.start()

    // Несколько ошибок → backoff
    lastSource().onerror()
    vi.advanceTimersByTime(1000)
    lastSource().onerror()
    vi.advanceTimersByTime(2000)

    // Успешное сообщение
    lastSource().onmessage({ data: JSON.stringify({ event: 'streak_lost', payload: {} }) })
    expect(stream._delay).toBe(1000)
  })

  it('stop() закрывает соединение и блокирует реконнект', () => {
    const stream = new NotificationStream('u1', vi.fn())
    stream.start()
    const src = lastSource()

    stream.stop()
    src.onerror()
    vi.advanceTimersByTime(5000)

    expect(FakeEventSource.instances).toHaveLength(1) // нового соединения нет
  })

  it('stop() до start() не бросает ошибку', () => {
    const stream = new NotificationStream('u1', vi.fn())
    expect(() => stream.stop()).not.toThrow()
  })
})

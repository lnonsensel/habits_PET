const RECONNECT_BASE = 1_000   // ms
const RECONNECT_MAX  = 30_000  // ms

export class NotificationStream {
  constructor(userId, onEvent) {
    this._userId  = userId
    this._onEvent = onEvent
    this._source  = null
    this._delay   = RECONNECT_BASE
    this._stopped = false
    this._timer   = null
  }

  start() {
    this._connect()
  }

  stop() {
    this._stopped = true
    clearTimeout(this._timer)
    this._source?.close()
    this._source = null
  }

  _connect() {
    if (this._stopped) return

    const url = `/notifications/stream/${this._userId}`
    this._source = new EventSource(url)

    this._source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        this._onEvent(data)
        this._delay = RECONNECT_BASE  // reset backoff on success
      } catch {
        // ignore malformed messages
      }
    }

    this._source.onerror = () => {
      this._source?.close()
      this._source = null
      if (!this._stopped) {
        this._timer = setTimeout(() => this._connect(), this._delay)
        this._delay = Math.min(this._delay * 2, RECONNECT_MAX)
      }
    }
  }
}

export const publishNotification = (userId, event, payload = {}) =>
  fetch('/notifications/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, event, payload }),
  })

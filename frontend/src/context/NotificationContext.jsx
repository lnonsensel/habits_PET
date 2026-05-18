import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { NotificationStream } from '../api/notifications'

const TOAST_TTL   = 4_000  // ms before auto-dismiss
const MAX_HISTORY = 50     // keep last N notifications

export const EVENT_META = {
  goal_completed:   { icon: '🎯', label: 'Цель выполнена'              },
  daily_remainder:  { icon: '🌱', label: 'Не забудь отметить привычки' },
  streak_lost:      { icon: '🔥', label: 'Серия прервалась'            },
  summary_weekly:   { icon: '📊', label: 'Еженедельный отчёт готов'   },
}

export const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [history, setHistory]   = useState([])   // full list for dropdown
  const [toasts, setToasts]     = useState([])   // transient toasts
  const [unread, setUnread]     = useState(0)
  const streamRef = useRef(null)

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    if (!user?.id) {
      streamRef.current?.stop()
      streamRef.current = null
      return
    }

    const stream = new NotificationStream(user.id, (data) => {
      const item = {
        id:        crypto.randomUUID(),
        event:     data.event,
        payload:   data.payload ?? {},
        timestamp: new Date(),
        read:      false,
      }

      setHistory(prev => [item, ...prev].slice(0, MAX_HISTORY))
      setUnread(n => n + 1)

      // Show toast, auto-dismiss after TTL
      setToasts(prev => [...prev, item])
      setTimeout(() => dismissToast(item.id), TOAST_TTL)
    })

    stream.start()
    streamRef.current = stream
    return () => stream.stop()
  }, [user?.id, dismissToast])

  const markAllRead = useCallback(() => {
    setUnread(0)
    setHistory(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  return (
    <NotificationContext.Provider value={{ history, toasts, unread, markAllRead, dismissToast }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)

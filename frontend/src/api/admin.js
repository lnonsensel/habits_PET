async function adminRequest(path, authHeader, method = 'GET', body = undefined) {
  const res = await fetch(path, {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw { status: res.status, detail: data.detail ?? 'Ошибка запроса' }
  }
  return res.json()
}

export const getAdminStats         = (h)           => adminRequest('/api/admin/stats', h)
export const getAdminUsers         = (h, params)   => adminRequest(`/api/admin/users?${new URLSearchParams(params)}`, h)
export const deleteAdminUser       = (h, id)       => adminRequest(`/api/admin/users/${id}`, h, 'DELETE')
export const getAdminNotifications = (h, params)   => adminRequest(`/api/admin/notifications?${new URLSearchParams(params)}`, h)
export const retryNotification     = (h, id)       => adminRequest(`/api/admin/notifications/${id}/retry`, h, 'POST')
export const getAdminHabits        = (h, params)   => adminRequest(`/api/admin/habits?${new URLSearchParams(params)}`, h)
export const getAdminLogs          = (h, params)   => adminRequest(`/api/admin/logs?${new URLSearchParams(params)}`, h)
export const sendBroadcast         = (h, data)     => adminRequest('/api/admin/notifications/send', h, 'POST', data)

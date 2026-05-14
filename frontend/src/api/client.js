async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { status: res.status, detail: body.detail ?? 'Ошибка запроса' }
  }

  if (res.status === 204) return null
  return res.json()
}

export const get  = (path)        => request(path)
export const post = (path, data)  => request(path, { method: 'POST',   body: JSON.stringify(data) })
export const put  = (path, data)  => request(path, { method: 'PUT',    body: JSON.stringify(data) })
export const del  = (path)        => request(path, { method: 'DELETE' })

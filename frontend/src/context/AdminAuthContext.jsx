import { createContext, useContext, useState } from 'react'

export const AdminAuthContext = createContext(null)

const STORAGE_KEY = 'habit_pet_admin'

function makeHeader(username, password) {
  return 'Basic ' + btoa(`${username}:${password}`)
}

export function AdminAuthProvider({ children }) {
  const [creds, setCreds] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) } catch { return null }
  })

  const adminLogin = (username, password) => {
    const data = { username, password }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setCreds(data)
  }

  const adminLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setCreds(null)
  }

  return (
    <AdminAuthContext.Provider value={{
      isAdmin:    !!creds,
      authHeader: creds ? makeHeader(creds.username, creds.password) : null,
      adminLogin,
      adminLogout,
    }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)

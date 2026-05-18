import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { router } from './router'

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AdminAuthProvider>
          <RouterProvider router={router} />
        </AdminAuthProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

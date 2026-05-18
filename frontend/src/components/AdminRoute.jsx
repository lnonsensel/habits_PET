import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function AdminRoute({ children }) {
  const { isAdmin } = useAdminAuth()
  return isAdmin ? children : <Navigate to="/admin/login" replace />
}

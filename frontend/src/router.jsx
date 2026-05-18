import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HabitsPage from './pages/HabitsPage'
import CreateHabitPage from './pages/CreateHabitPage'
import HabitDetailPage from './pages/HabitDetailPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminNotifsPage from './pages/admin/AdminNotifsPage'
import AdminHabitsPage from './pages/admin/AdminHabitsPage'
import AdminLogsPage from './pages/admin/AdminLogsPage'
import NotFoundPage from './pages/NotFoundPage'
import ForbiddenPage from './pages/ForbiddenPage'
import ServerErrorPage from './pages/ServerErrorPage'

export const router = createBrowserRouter([
  { path: '/login',    element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Main app
  {
    element: <PrivateRoute><Layout /></PrivateRoute>,
    children: [
      { index: true,              element: <HabitsPage /> },
      { path: 'habits/new',       element: <CreateHabitPage /> },
      { path: 'habits/:habitId',  element: <HabitDetailPage /> },
    ],
  },

  // Admin
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    children: [
      { path: '/admin',               element: <AdminDashboard /> },
      { path: '/admin/users',         element: <AdminUsersPage /> },
      { path: '/admin/notifications', element: <AdminNotifsPage /> },
      { path: '/admin/habits',        element: <AdminHabitsPage /> },
      { path: '/admin/logs',          element: <AdminLogsPage /> },
    ],
  },

  { path: '/forbidden',     element: <ForbiddenPage /> },
  { path: '/server-error',  element: <ServerErrorPage /> },
  { path: '*', element: <NotFoundPage /> },
])

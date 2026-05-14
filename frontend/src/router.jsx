import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HabitsPage from './pages/HabitsPage'
import CreateHabitPage from './pages/CreateHabitPage'

export const router = createBrowserRouter([
  { path: '/login',    element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <PrivateRoute><Layout /></PrivateRoute>,
    children: [
      { index: true,          element: <HabitsPage /> },
      { path: 'habits/new',   element: <CreateHabitPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

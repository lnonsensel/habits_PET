import { post } from './client'

export const register = (data) => post('/auth/register/', data)
// login endpoint not yet implemented on the backend
export const login    = (data) => post('/auth/login/', data)

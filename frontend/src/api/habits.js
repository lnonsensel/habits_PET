import { get, post, put, del } from './client'

export const getHabits    = (userId)   => get(`/habits/?user_id=${userId}`)
export const getHabit     = (id)       => get(`/habits/${id}`)
export const createHabit  = (data)     => post('/habits/', data)
export const updateHabit  = (id, data) => put(`/habits/${id}`, data)
export const deleteHabit  = (id)       => del(`/habits/${id}`)

export const createHabitRecord        = (data)              => post('/habit_records/', data)
export const deleteHabitRecord        = (id)                => del(`/habit_records/${id}`)
export const getHabitRecords          = (userId)            => get(`/habit_records/?user_id=${userId}`)
export const getHabitRecordsForHabit  = (userId, habitId)   => get(`/habit_records/?user_id=${userId}&habit_id=${habitId}`)

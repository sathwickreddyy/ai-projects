import axios from 'axios'
import type { ArchSession } from './types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:18000',
})

export const getSession = (id: string) =>
  api.get<ArchSession>(`/api/sessions/${id}`).then((r) => r.data)

export const patchSession = (id: string, body: { title?: string; data?: Record<string, unknown> }) =>
  api.patch<ArchSession>(`/api/sessions/${id}`, body).then((r) => r.data)

export const listSessions = () =>
  api.get<ArchSession[]>('/api/sessions').then((r) => r.data)

import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { listSessions, getSession } from '../api/client'
import type { Session } from '../types'

export function useSession() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const store = useAppStore()

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const data = await listSessions()
      setSessions(data)
      store.setSessions(data)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSession = async (id: string) => {
    setIsLoading(true)
    try {
      const data = await getSession(id)
      store.setCurrentSession(data)
      store.setCurrentDiagram(data.diagram)
    } catch (err) {
      console.error('Failed to load session:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  return {
    sessions,
    loadSession,
    loadSessions,
    isLoading,
  }
}

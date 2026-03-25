import axios from 'axios'
import type { Session, Diagram, PaletteItem, SkillTree, ReviewFeedback, DiagramDiff } from '../types'
import type { SymbolRegistry } from '../types/symbols'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:18000',
})

// Sessions
export const listSessions = () =>
  api.get<Session[]>('/api/sessions').then((r) => r.data)

export const getSession = (id: string) =>
  api.get<Session & { diagram: Diagram }>(`/api/sessions/${id}`).then((r) => r.data)

export const getLatestState = (id: string) =>
  api.get<Diagram & { diff_summary: DiagramDiff }>(`/api/sessions/${id}/latest`).then((r) => r.data)

// Diagrams
export const listDiagramVersions = (sessionId: string) =>
  api.get<Diagram[]>(`/api/diagrams/${sessionId}`).then((r) => r.data)

export const patchDiagram = (diagramId: string, body: Partial<Pick<Diagram, 'nodes' | 'edges' | 'flows' | 'mode' | 'theme'>>) =>
  api.patch<Diagram>(`/api/diagrams/${diagramId}`, body).then((r) => r.data)

export const getDiagramDiff = (diagramId: string) =>
  api.get<DiagramDiff>(`/api/diagrams/${diagramId}/diff`).then((r) => r.data)

// Symbols
export const getSymbols = () =>
  api.get<SymbolRegistry>('/api/symbols/').then((r) => r.data)

export const getPalette = () =>
  api.get<PaletteItem[]>('/api/symbols/palette').then((r) => r.data)

// Skills
export const getSkillTree = () =>
  api.get<SkillTree>('/api/skills/tree').then((r) => r.data)

export const saveAdaptation = (body: { target_subskill: string; decisions: string[]; keywords: string[] }) =>
  api.post('/api/skills/adapt', body).then((r) => r.data)

export const previewImpact = (adaptation: Record<string, unknown>) =>
  api.post('/api/skills/impact', { adaptation }).then((r) => r.data)

// AI
export const reviewDiagram = (diagramId: string, question?: string) =>
  api.post<ReviewFeedback>('/api/ai/review', { diagram_id: diagramId, question }).then((r) => r.data)

export const submitFollowup = (diagramId: string, qaHistory: Array<{ q: string; a: string }>) =>
  api.post<ReviewFeedback>('/api/ai/followup', { diagram_id: diagramId, qa_history: qaHistory }).then((r) => r.data)

export const generateAdaptation = (sessionId: string) =>
  api.post('/api/ai/adaptation', { session_id: sessionId }).then((r) => r.data)

// Auth
export const getAuthStatus = () =>
  api.get<{ mode: string; cli_available: boolean; has_api_key: boolean }>('/api/auth/status').then((r) => r.data)

export const configureAuth = (body: { mode: 'cli' | 'api'; api_key?: string }) =>
  api.post('/api/auth/configure', body).then((r) => r.data)

// SSE streaming review (POST, not EventSource)
export const streamReview = (
  diagramId: string,
  question: string | undefined,
  onChunk: (chunk: string) => void,
  onDone: () => void,
): void => {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:18000'
  fetch(`${baseUrl}/api/ai/review/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ diagram_id: diagramId, question }),
  }).then(async (response) => {
    if (!response.body) return
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.chunk) onChunk(payload.chunk as string)
            if (payload.done) onDone()
          } catch {
            // ignore malformed lines
          }
        }
      }
    }
  }).catch((err) => {
    console.error('streamReview error:', err)
  })
}

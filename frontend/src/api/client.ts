import axios from 'axios'
import type {
  Architecture,
  ComponentsByCategory,
  Project,
  ReviewFeedback,
  Skill,
} from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

// Projects
export const listProjects = () =>
  api.get<Project[]>('/api/projects/').then(r => r.data)

export const createProject = (body: { name: string; path: string; description?: string }) =>
  api.post<Project>('/api/projects/', body).then(r => r.data)

export const getProject = (id: string) =>
  api.get<Project>(`/api/projects/${id}`).then(r => r.data)

export const scanProject = (id: string) =>
  api.post<{ detected: Record<string, boolean>; files_scanned: number; file_list: string[] }>(
    `/api/projects/${id}/scan`
  ).then(r => r.data)

export const generateArchitecture = (
  id: string,
  body: { instruction?: string; name?: string } = {}
) =>
  api.post<Architecture & { architecture_id: string }>(
    `/api/projects/${id}/generate`,
    body
  ).then(r => r.data)

export const listVolumeDirs = () =>
  api.get<{ name: string; path: string }[]>('/api/projects/volume/list').then(r => r.data)

// Architectures
export const listArchitectures = (projectId: string) =>
  api.get<Architecture[]>(`/api/architectures/project/${projectId}`).then(r => r.data)

export const getArchitecture = (id: string) =>
  api.get<Architecture>(`/api/architectures/${id}`).then(r => r.data)

export const patchArchitecture = (
  id: string,
  body: Partial<Pick<Architecture, 'nodes' | 'edges' | 'layout' | 'mode' | 'theme' | 'name'>>
) =>
  api.patch<Architecture>(`/api/architectures/${id}`, body).then(r => r.data)

export const exportArchitecture = (id: string, format: 'mermaid' | 'drawio') =>
  api.get<string>(`/api/architectures/${id}/export/${format}`).then(r => r.data)

// Components
export const getComponents = () =>
  api.get<ComponentsByCategory>('/api/components/').then(r => r.data)

// Preferences
export const getPreferences = (scope = 'global') =>
  api.get<Record<string, unknown>>('/api/preferences/', { params: { scope } }).then(r => r.data)

export const upsertPreference = (body: { scope?: string; key: string; value: unknown }) =>
  api.put('/api/preferences/', body).then(r => r.data)

// Skills
export const listSkills = () =>
  api.get<Skill[]>('/api/skills/').then(r => r.data)

export const createSkill = (body: {
  name: string
  description: string
  prompt_snippet: string
  trigger_pattern?: string[]
  scope?: string
}) =>
  api.post<Skill>('/api/skills/', body).then(r => r.data)

export const toggleSkill = (id: string) =>
  api.patch<Skill>(`/api/skills/${id}/toggle`).then(r => r.data)

export const deleteSkill = (id: string) =>
  api.delete(`/api/skills/${id}`).then(r => r.data)

// Claude
export const applyPreference = (architectureId: string, instruction: string) =>
  api.post<Architecture & { architecture_id: string }>('/api/claude/apply-preference', {
    architecture_id: architectureId,
    instruction,
  }).then(r => r.data)

export const approveSkill = (body: {
  name: string
  description: string
  prompt_snippet: string
  trigger_pattern: string[]
}) =>
  api.post<Skill>('/api/claude/approve-skill', body).then(r => r.data)

// SSE streaming review (POST, not EventSource)
export const streamReview = (
  architectureId: string,
  question: string | undefined,
  onChunk: (chunk: string) => void,
  onDone: (reviewId: string) => void
): void => {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
  fetch(`${baseUrl}/api/claude/review/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ architecture_id: architectureId, question }),
  }).then(async response => {
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
            if (payload.chunk) {
              onChunk(payload.chunk as string)
            }
            if (payload.done) {
              onDone(payload.review_id as string)
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
    }
  }).catch(err => {
    console.error('streamReview error:', err)
  })
}

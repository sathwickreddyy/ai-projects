// Core domain types
export interface Session {
  id: string
  title: string
  status: string
  context: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Diagram {
  id: string
  version: number
  nodes: ArchNode[]
  edges: ArchEdge[]
  flows: ArchFlow[]
  mode: string
  theme: Record<string, unknown>
  created_at: string
}

export interface ArchNode {
  id: string
  symbol_type: string
  name: string
  position: { x: number; y: number }
  props?: Record<string, unknown>
  children?: ArchNode[]
}

export type PortId = 'top' | 'top-right' | 'right' | 'bottom' | 'bottom-left' | 'left'

export interface ArchEdge {
  id: string
  source: string
  target: string
  label?: string
  style?: string
  color?: string
  source_port?: string
  target_port?: string
  props?: Record<string, unknown>
}

export interface ArchFlow {
  id: string
  name: string
  steps: string[]
  color?: string
}

export interface PaletteItem {
  symbol_type: string
  label: string
  category: string
  description?: string
}

export interface ReviewFeedback {
  summary: string
  score?: number
  issues: Array<{
    severity: string
    component?: string
    message: string
    fix?: string
  }>
  missing_components: Array<{
    name: string
    reason: string
    type: string
    symbol_type: string
  }>
  follow_up_questions: Array<{
    question: string
    options: string[]
  }>
  suggested_adaptations: Array<{
    decision: string
    reason: string
  }>
}

export interface DiagramDiff {
  added_nodes: Array<{ id: string; name?: string }>
  removed_nodes: Array<{ id: string; name?: string }>
  modified_nodes: Array<{
    id: string
    changes: Record<string, { old: unknown; new: unknown }>
  }>
  added_edges: Array<{ id: string; source?: string; target?: string }>
  removed_edges: Array<{ id: string; source?: string; target?: string }>
}

// Skill system types
export interface SkillTree {
  skills: Record<string, Skill>
  meta?: {
    version: string
    last_updated: string
  }
}

export interface Skill {
  name: string
  description: string
  subskills: Record<string, SubSkill>
}

export interface SubSkill {
  name: string
  keywords: string[]
  decisions: string[]
  adaptations?: Adaptation[]
}

export interface Adaptation {
  id: string
  timestamp: string
  decisions: string[]
  keywords: string[]
  approved: boolean
}

// Zustand store state
export interface AppState {
  // Session
  currentSession: Session | null
  currentDiagram: Diagram | null
  sessions: Session[]

  // Canvas
  nodes: ArchNode[]
  edges: ArchEdge[]
  flows: ArchFlow[]
  selectedNodeId: string | null
  zoom: number
  pan: { x: number; y: number }

  // Palette
  paletteItems: PaletteItem[]

  // Review
  isReviewing: boolean
  reviewStep: number
  reviewChunks: string[]
  reviewResult: ReviewFeedback | null

  // Skills
  skillTree: SkillTree | null

  // UI
  isGenerating: boolean
  rightPanelTab: 'suggestions' | 'followup' | 'adapt'

  // Auth
  authMode: string | null
  authConfigured: boolean

  // Actions
  setCurrentSession: (session: Session | null) => void
  setCurrentDiagram: (diagram: Diagram | null) => void
  setSessions: (sessions: Session[]) => void
  setNodes: (nodes: ArchNode[]) => void
  setEdges: (edges: ArchEdge[]) => void
  setFlows: (flows: ArchFlow[]) => void
  updateNodePosition: (id: string, x: number, y: number) => void
  setSelectedNodeId: (id: string | null) => void
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  setPaletteItems: (items: PaletteItem[]) => void
  setIsReviewing: (val: boolean) => void
  setReviewStep: (step: number) => void
  appendReviewChunk: (chunk: string) => void
  setReviewResult: (result: ReviewFeedback | null) => void
  resetReview: () => void
  setSkillTree: (tree: SkillTree | null) => void
  setIsGenerating: (val: boolean) => void
  setRightPanelTab: (tab: 'suggestions' | 'followup' | 'adapt') => void
  setAuthMode: (mode: string | null) => void
  setAuthConfigured: (val: boolean) => void
}

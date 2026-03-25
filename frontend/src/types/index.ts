// Context envelope — what the skill sends to the app
export interface ContextEnvelope {
  context: {
    project_name: string
    project_path?: string
    detected_stack: string[]
    user_intent?: string
    skill_used: string
    skill_version?: string
    skill_path?: string
    conversation_summary?: string
    preferences?: Record<string, unknown>
  }
  architecture: ArchitecturePayload
}

export interface ArchitecturePayload {
  title: string
  mode: string
  nodes: ArchNode[]
  edges: ArchEdge[]
  flows: ArchFlow[]
}

export type PortId = 'top' | 'top-right' | 'right' | 'bottom' | 'bottom-left' | 'left'

export interface ArchNode {
  id: string
  symbol_type: string
  name: string
  props: Record<string, unknown>
  position: { x: number; y: number }
  layer: number
}

export interface ArchEdge {
  id: string
  source: string
  source_port?: PortId
  target: string
  target_port?: PortId
  label?: string
  style?: 'solid' | 'animated' | 'dotted'
  color?: string
}

export interface ArchFlow {
  id: string
  name: string
  steps: string[]
  color: string
}

// Session from backend
export interface Session {
  id: string
  title: string
  context: ContextEnvelope['context']
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

// Diagram version
export interface Diagram {
  id: string
  session_id: string
  version: number
  nodes: ArchNode[]
  edges: ArchEdge[]
  flows: ArchFlow[]
  mode: string
  theme: Record<string, unknown>
  created_at: string
}

// AI review feedback
export interface ReviewIssue {
  severity: 'critical' | 'warning' | 'suggestion'
  component: string
  message: string
  fix: string
}

export interface MissingComponent {
  name: string
  reason: string
  type: string
  symbol_type: string
}

export interface FollowUpQuestion {
  question: string
  options: string[]
}

export interface SuggestedAdaptation {
  decision: string
  reason: string
}

export interface ReviewFeedback {
  score: number
  summary: string
  issues: ReviewIssue[]
  missing_components: MissingComponent[]
  follow_up_questions: FollowUpQuestion[]
  suggested_adaptations: SuggestedAdaptation[]
}

// Skill system
export interface SubskillInfo {
  name: string
  file: string
  version: number
  learned_from: number
  content: string
}

export interface KeywordMapping {
  subskill: string
  match_any: string[][]
}

export interface SkillTree {
  name: string
  subskills: SubskillInfo[]
  keywords: KeywordMapping[]
}

export interface SkillAdaptation {
  id: string
  session_id: string
  target_subskill: string
  decisions: string[]
  keywords: string[]
  status: 'pending' | 'approved' | 'discarded'
}

// Diff types for review mode
export interface DiagramDiff {
  added_nodes: Array<{ id: string; name: string }>
  removed_nodes: Array<{ id: string; name: string }>
  modified_nodes: Array<{ id: string; changes: string[] }>
  added_edges: Array<{ id: string }>
  removed_edges: Array<{ id: string }>
}

// Palette item from backend
export interface PaletteItem {
  symbol_type: string
  label: string
  category: string
  shape: string
  keywords: string[]
  color: string
  border_color: string
  props_schema: Record<string, unknown>
}

// App state
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
  authMode: 'cli' | 'api' | null
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
  setRightPanelTab: (tab: AppState['rightPanelTab']) => void
  setAuthMode: (mode: 'cli' | 'api' | null) => void
  setAuthConfigured: (val: boolean) => void
}

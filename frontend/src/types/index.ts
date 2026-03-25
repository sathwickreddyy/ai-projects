export interface Project {
  id: string
  name: string
  path: string
  description?: string
  last_scanned?: string
  metadata: {
    detected?: Record<string, boolean>
    stale?: boolean
    file_count?: number
  }
}

export interface ArchNode {
  id: string
  label: string
  icon: string
  description: string
  type: 'client' | 'service' | 'database' | 'cache' | 'queue' | 'gateway' | 'external' | 'infrastructure'
  layer: number
  x: number
  y: number
  component_name?: string
}

export interface ArchEdge {
  id: string
  source: string
  target: string
  label?: string
  animated: boolean
  color?: string
  order?: number
}

export interface ArchTheme {
  primary: string
  secondary: string
  accent: string
  bg: string
  surface: string
  text: string
  muted: string
}

export interface ArchStep {
  order: number
  title: string
  description: string
  nodes_involved: string[]
}

export interface Architecture {
  id: string
  project_id: string
  name: string
  nodes: ArchNode[]
  edges: ArchEdge[]
  layout: Record<string, unknown>
  mode: string
  theme: ArchTheme
  version: number
  is_active: boolean
}

export interface ComponentLibraryItem {
  id: string
  name: string
  category: string
  icon: string
  color: string
  border_color: string
  keywords: string[]
  default_props: Record<string, unknown>
  sort_order: number
}

export type ComponentsByCategory = Record<string, ComponentLibraryItem[]>

export interface Skill {
  id: string
  name: string
  description: string
  prompt_snippet: string
  trigger_pattern: string[]
  scope: string
  active: boolean
  approved_by: string
  approved_at?: string
}

export interface ReviewIssue {
  severity: 'critical' | 'warning' | 'suggestion'
  component: string
  message: string
  fix: string
}

export interface MissingComponent {
  name: string
  reason: string
  type: 'queue' | 'database' | 'api' | 'infrastructure'
}

export interface ApprovedChange {
  type: 'add_node' | 'remove_node' | 'add_edge' | 'change_label'
  payload: Record<string, unknown>
}

export interface NewSkillSuggestion {
  name: string
  description: string
  prompt_snippet: string
  trigger_pattern: string[]
}

export interface ReviewFeedback {
  score: number
  summary: string
  issues: ReviewIssue[]
  missing_components: MissingComponent[]
  approved_changes: ApprovedChange[]
  new_skill_suggestion?: NewSkillSuggestion
}

export interface AppState {
  activeProject: Project | null
  activeArchitecture: Architecture | null
  components: ComponentsByCategory
  skills: Skill[]
  preferences: Record<string, unknown>
  isGenerating: boolean
  reviewChunks: string[]
  reviewResult: ReviewFeedback | null
  isReviewing: boolean
  setActiveProject: (project: Project | null) => void
  setActiveArchitecture: (arch: Architecture | null) => void
  updateNodes: (nodes: ArchNode[]) => void
  updateEdges: (edges: ArchEdge[]) => void
  setComponents: (components: ComponentsByCategory) => void
  setSkills: (skills: Skill[]) => void
  setPreferences: (prefs: Record<string, unknown>) => void
  appendReviewChunk: (chunk: string) => void
  setReviewResult: (result: ReviewFeedback | null) => void
  setIsGenerating: (val: boolean) => void
  setIsReviewing: (val: boolean) => void
  resetReview: () => void
}

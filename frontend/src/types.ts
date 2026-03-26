export interface ArchSession {
  id: string
  title: string
  data: {
    nodes: ArchNode[]
    edges: ArchEdge[]
  }
  detected_stack: string[]
  created_at: string
  updated_at: string
}

export interface ArchNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface ArchEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  style?: Record<string, string | number>
}

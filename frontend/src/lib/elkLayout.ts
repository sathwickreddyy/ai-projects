import ELK from 'elkjs/lib/elk.bundled.js'
import type { ArchNode, ArchEdge } from '../types'

const elk = new ELK()

const CANVAS_W = 1200
const CANVAS_H = 700

// Default node sizes by shape
const SHAPE_SIZES: Record<string, { width: number; height: number }> = {
  horizontal_cylinder: { width: 160, height: 50 },
  container_box: { width: 200, height: 150 },
  diamond_stack: { width: 120, height: 100 },
  hexagon: { width: 140, height: 80 },
  rounded_rect: { width: 130, height: 60 },
  circle: { width: 80, height: 80 },
  cloud: { width: 140, height: 90 },
}

interface LayoutOptions {
  algorithm?: 'layered' | 'force'
  direction?: 'DOWN' | 'RIGHT' | 'UP' | 'LEFT'
  nodeSpacing?: number
  layerSpacing?: number
}

export async function computeLayout(
  nodes: ArchNode[],
  edges: ArchEdge[],
  symbolShapes: Record<string, string>,  // nodeId -> shape name
  options: LayoutOptions = {}
): Promise<ArchNode[]> {
  const {
    algorithm = 'layered',
    direction = 'DOWN',
    nodeSpacing = 80,
    layerSpacing = 120,
  } = options

  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': algorithm === 'force' ? 'force' : 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': String(nodeSpacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
      'elk.portConstraints': 'FIXED_SIDE',
    },
    children: nodes.map((node) => {
      const shape = symbolShapes[node.id] ?? 'rounded_rect'
      const size = SHAPE_SIZES[shape] ?? { width: 130, height: 60 }
      return {
        id: node.id,
        width: size.width,
        height: size.height,
      }
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }

  const layout = await elk.layout(elkGraph)

  // Convert ELK pixel positions back to 0-1 fractions
  const maxX = Math.max(...(layout.children?.map((c) => (c.x ?? 0) + (c.width ?? 0)) ?? [CANVAS_W]))
  const maxY = Math.max(...(layout.children?.map((c) => (c.y ?? 0) + (c.height ?? 0)) ?? [CANVAS_H]))
  const scaleX = Math.max(maxX, CANVAS_W)
  const scaleY = Math.max(maxY, CANVAS_H)

  return nodes.map((node) => {
    const layoutNode = layout.children?.find((c) => c.id === node.id)
    if (!layoutNode) return node
    return {
      ...node,
      position: {
        x: (layoutNode.x ?? 0) / scaleX,
        y: (layoutNode.y ?? 0) / scaleY,
      },
    }
  })
}

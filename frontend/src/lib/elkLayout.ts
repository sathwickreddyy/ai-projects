import ELK from 'elkjs/lib/elk.bundled.js'
import type { ArchNode, ArchEdge } from '../types'
import { NODE_SIZES, DEFAULT_NODE_SIZE } from './nodeSizes'

const elk = new ELK()

const CANVAS_W = 1200
const CANVAS_H = 700

interface LayoutOptions {
  algorithm?: 'layered' | 'force'
  direction?: 'DOWN' | 'RIGHT' | 'UP' | 'LEFT'
  nodeSpacing?: number
  layerSpacing?: number
}

export async function computeLayout(
  nodes: ArchNode[],
  edges: ArchEdge[],
  symbolShapes: Record<string, string>,
  options: LayoutOptions = {}
): Promise<ArchNode[]> {
  if (nodes.length === 0) return nodes

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
      const size = NODE_SIZES[shape] ?? DEFAULT_NODE_SIZE
      return {
        id: node.id,
        width: size.width,
        height: size.height + 24, // account for text label below node
      }
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }

  const layout = await elk.layout(elkGraph)

  const children = layout.children ?? []
  if (children.length === 0) return nodes

  // Compute ELK content bounds
  const elkMinX = Math.min(...children.map((c) => c.x ?? 0))
  const elkMinY = Math.min(...children.map((c) => c.y ?? 0))
  const elkMaxX = Math.max(...children.map((c) => (c.x ?? 0) + (c.width ?? 0)))
  const elkMaxY = Math.max(...children.map((c) => (c.y ?? 0) + (c.height ?? 0)))

  const elkW = elkMaxX - elkMinX || 1
  const elkH = elkMaxY - elkMinY || 1

  // Scale ELK layout to fit canvas with padding, preserving aspect ratio
  const PAD_PX = 80
  const availW = CANVAS_W - 2 * PAD_PX
  const availH = CANVAS_H - 2 * PAD_PX
  const scale = Math.min(availW / elkW, availH / elkH, 1)

  // Center in canvas
  const scaledW = elkW * scale
  const scaledH = elkH * scale
  const offsetX = (CANVAS_W - scaledW) / 2
  const offsetY = (CANVAS_H - scaledH) / 2

  return nodes.map((node) => {
    const layoutNode = children.find((c) => c.id === node.id)
    if (!layoutNode) return node

    const canvasX = ((layoutNode.x ?? 0) - elkMinX) * scale + offsetX
    const canvasY = ((layoutNode.y ?? 0) - elkMinY) * scale + offsetY

    return {
      ...node,
      position: {
        x: canvasX / CANVAS_W,
        y: canvasY / CANVAS_H,
      },
    }
  })
}

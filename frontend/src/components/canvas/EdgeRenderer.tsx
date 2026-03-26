import React from 'react'
import { useAppStore } from '../../stores/appStore'
import { useSymbolRegistry } from '../../stores/symbolRegistry'
import { CANVAS_W, CANVAS_H } from '../../hooks/useCanvas'
import { NODE_SIZES, DEFAULT_NODE_SIZE } from '../../lib/nodeSizes'
import type { ArchNode } from '../../types'

type PortPosition = 'top' | 'top-right' | 'right' | 'bottom' | 'bottom-left' | 'left'

interface PortCoords {
  x: number
  y: number
}

function getPortPosition(
  node: ArchNode,
  port: PortPosition | undefined,
  width: number = DEFAULT_NODE_SIZE.width,
  height: number = DEFAULT_NODE_SIZE.height
): PortCoords {
  const px = node.position.x * CANVAS_W
  const py = node.position.y * CANVAS_H

  if (!port) {
    // Default to center if no port specified
    return { x: px + width / 2, y: py + height / 2 }
  }

  switch (port) {
    case 'top':
      return { x: px + width / 2, y: py }
    case 'top-right':
      return { x: px + width, y: py + height * 0.25 }
    case 'right':
      return { x: px + width, y: py + height / 2 }
    case 'bottom':
      return { x: px + width / 2, y: py + height }
    case 'bottom-left':
      return { x: px, y: py + height * 0.75 }
    case 'left':
      return { x: px, y: py + height / 2 }
    default:
      return { x: px + width / 2, y: py + height / 2 }
  }
}

function autoSelectPorts(
  sourceNode: ArchNode,
  targetNode: ArchNode
): { sourcePort: PortPosition; targetPort: PortPosition } {
  const sourcePx = sourceNode.position.x * CANVAS_W
  const sourcePy = sourceNode.position.y * CANVAS_H
  const targetPx = targetNode.position.x * CANVAS_W
  const targetPy = targetNode.position.y * CANVAS_H

  // Calculate angle between nodes
  const dx = targetPx - sourcePx
  const dy = targetPy - sourcePy
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  // Select ports based on relative position
  let sourcePort: PortPosition
  let targetPort: PortPosition

  if (angle >= -45 && angle < 45) {
    // Target is to the right
    sourcePort = 'right'
    targetPort = 'left'
  } else if (angle >= 45 && angle < 135) {
    // Target is below
    sourcePort = 'bottom'
    targetPort = 'top'
  } else if (angle >= 135 || angle < -135) {
    // Target is to the left
    sourcePort = 'left'
    targetPort = 'right'
  } else {
    // Target is above
    sourcePort = 'top'
    targetPort = 'bottom'
  }

  return { sourcePort, targetPort }
}

function createPath(start: PortCoords, end: PortCoords): string {
  // Simple curved path
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const curvature = Math.min(distance * 0.3, 50)

  // Determine curve direction based on relative positions
  const cpx1 = start.x + curvature
  const cpy1 = start.y
  const cpx2 = end.x - curvature
  const cpy2 = end.y

  return `M ${start.x},${start.y} C ${cpx1},${cpy1} ${cpx2},${cpy2} ${end.x},${end.y}`
}

function getNodeSize(node: ArchNode): { width: number; height: number } {
  const registry = useSymbolRegistry.getState()
  const sym = registry.getSymbol(node.symbol_type)
  const shape = sym?.shape ?? 'rounded_rect'
  return NODE_SIZES[shape] ?? DEFAULT_NODE_SIZE
}

export function EdgeRenderer() {
  const nodes = useAppStore((s) => s.nodes)
  const edges = useAppStore((s) => s.edges)

  return (
    <g className="edge-layer">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#4b5563" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        const targetNode = nodes.find((n) => n.id === edge.target)

        if (!sourceNode || !targetNode) return null

        const sourceSize = getNodeSize(sourceNode)
        const targetSize = getNodeSize(targetNode)

        // Get edge props for port specification
        const sourcePort = (edge.props as any)?.source_port as PortPosition | undefined
        const targetPort = (edge.props as any)?.target_port as PortPosition | undefined

        // Auto-select ports if not specified
        const { sourcePort: autoSourcePort, targetPort: autoTargetPort } = autoSelectPorts(
          sourceNode,
          targetNode
        )

        const startPos = getPortPosition(sourceNode, sourcePort || autoSourcePort, sourceSize.width, sourceSize.height)
        const endPos = getPortPosition(targetNode, targetPort || autoTargetPort, targetSize.width, targetSize.height)

        const pathData = createPath(startPos, endPos)

        // Determine edge style
        const edgeStyle = edge.style || 'solid'
        const edgeColor = (edge.props as any)?.color || '#4b5563'

        let strokeDasharray: string | undefined
        let animation: React.ReactNode = null

        switch (edgeStyle) {
          case 'animated':
            strokeDasharray = '6 3'
            animation = (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="18"
                dur="1s"
                repeatCount="indefinite"
              />
            )
            break
          case 'dotted':
            strokeDasharray = '2 4'
            break
          default:
            strokeDasharray = undefined
        }

        // Calculate midpoint for label
        const midX = (startPos.x + endPos.x) / 2
        const midY = (startPos.y + endPos.y) / 2

        return (
          <g key={edge.id}>
            {/* Edge path */}
            <path
              d={pathData}
              stroke={edgeColor}
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              strokeDasharray={strokeDasharray}
            >
              {animation}
            </path>

            {edge.label && (
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={edgeColor}
                fontSize="10"
                fontWeight={500}
                fontFamily="system-ui, -apple-system, sans-serif"
                opacity={0.85}
              >
                {edge.label.length > 30 ? edge.label.slice(0, 30) + '...' : edge.label}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

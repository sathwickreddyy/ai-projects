import { useMemo } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSymbolRegistry } from '../stores/symbolRegistry'
import { getPortPosition, autoAssignPorts, routeEdgeSmooth } from '../lib/edgeRouter'
import type { PortId } from '../types'

const CANVAS_W = 1200
const CANVAS_H = 700

const SHAPE_SIZES: Record<string, { width: number; height: number }> = {
  horizontal_cylinder: { width: 160, height: 50 },
  container_box: { width: 200, height: 150 },
  diamond_stack: { width: 120, height: 100 },
  hexagon: { width: 140, height: 80 },
  rounded_rect: { width: 130, height: 60 },
  circle: { width: 80, height: 80 },
  cloud: { width: 140, height: 90 },
}

interface RoutedEdge {
  id: string
  path: string
  label?: string
  color: string
  style: string
  labelX: number
  labelY: number
}

export function useEdgeRouting(): RoutedEdge[] {
  const { nodes, edges } = useAppStore()
  const { renderableSymbols } = useSymbolRegistry()

  return useMemo(() => {
    return edges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source)
      const targetNode = nodes.find((n) => n.id === edge.target)
      if (!sourceNode || !targetNode) {
        return { id: edge.id, path: '', label: edge.label, color: edge.color ?? '#4b5563', style: edge.style ?? 'solid', labelX: 0, labelY: 0 }
      }

      const srcShape = renderableSymbols[sourceNode.symbol_type]?.shape ?? 'rounded_rect'
      const tgtShape = renderableSymbols[targetNode.symbol_type]?.shape ?? 'rounded_rect'
      const srcSize = SHAPE_SIZES[srcShape] ?? { width: 130, height: 60 }
      const tgtSize = SHAPE_SIZES[tgtShape] ?? { width: 130, height: 60 }

      const srcRect = {
        x: sourceNode.position.x * CANVAS_W,
        y: sourceNode.position.y * CANVAS_H,
        width: srcSize.width,
        height: srcSize.height,
      }
      const tgtRect = {
        x: targetNode.position.x * CANVAS_W,
        y: targetNode.position.y * CANVAS_H,
        width: tgtSize.width,
        height: tgtSize.height,
      }

      const ports = edge.source_port && edge.target_port
        ? { sourcePort: edge.source_port as PortId, targetPort: edge.target_port as PortId }
        : autoAssignPorts(srcRect, tgtRect)

      const srcPoint = getPortPosition(srcRect, ports.sourcePort)
      const tgtPoint = getPortPosition(tgtRect, ports.targetPort)

      const path = routeEdgeSmooth(srcPoint, tgtPoint)

      return {
        id: edge.id,
        path,
        label: edge.label,
        color: edge.color ?? '#4b5563',
        style: edge.style ?? 'solid',
        labelX: (srcPoint.x + tgtPoint.x) / 2,
        labelY: (srcPoint.y + tgtPoint.y) / 2,
      }
    })
  }, [nodes, edges, renderableSymbols])
}

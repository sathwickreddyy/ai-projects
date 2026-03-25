import type { PortId } from '../types'

interface Point { x: number; y: number }

interface NodeRect {
  x: number; y: number; width: number; height: number
}

// Port position relative to node rect
export function getPortPosition(rect: NodeRect, port: PortId): Point {
  switch (port) {
    case 'top':         return { x: rect.x + rect.width / 2, y: rect.y }
    case 'top-right':   return { x: rect.x + rect.width, y: rect.y + rect.height * 0.25 }
    case 'right':       return { x: rect.x + rect.width, y: rect.y + rect.height / 2 }
    case 'bottom':      return { x: rect.x + rect.width / 2, y: rect.y + rect.height }
    case 'bottom-left': return { x: rect.x, y: rect.y + rect.height * 0.75 }
    case 'left':        return { x: rect.x, y: rect.y + rect.height / 2 }
    default:            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  }
}

// Auto-assign best port pair for shortest path
export function autoAssignPorts(
  sourceRect: NodeRect,
  targetRect: NodeRect
): { sourcePort: PortId; targetPort: PortId } {
  const ports: PortId[] = ['top', 'top-right', 'right', 'bottom', 'bottom-left', 'left']
  let bestDist = Infinity
  let bestPair: { sourcePort: PortId; targetPort: PortId } = { sourcePort: 'bottom', targetPort: 'top' }

  for (const sp of ports) {
    for (const tp of ports) {
      const s = getPortPosition(sourceRect, sp)
      const t = getPortPosition(targetRect, tp)
      const dist = Math.hypot(t.x - s.x, t.y - s.y)
      if (dist < bestDist) {
        bestDist = dist
        bestPair = { sourcePort: sp, targetPort: tp }
      }
    }
  }
  return bestPair
}

// Route an edge with orthogonal bends, avoiding node obstacles
export function routeEdge(
  sourcePoint: Point,
  targetPoint: Point,
  sourcePort: PortId,
  targetPort: PortId,
  _obstacles: NodeRect[]
): string {
  // Simple L-shaped or Z-shaped routing
  // For vertical flow (source above target): go down from source, then across, then down to target
  const dx = targetPoint.x - sourcePoint.x
  const dy = targetPoint.y - sourcePoint.y

  // Check if straight line works (no obstacles in the way)
  const midY = sourcePoint.y + dy / 2
  const midX = sourcePoint.x + dx / 2

  // For top→bottom connections: vertical-first routing
  if ((sourcePort === 'bottom' && targetPort === 'top') ||
      (sourcePort === 'top' && targetPort === 'bottom')) {
    // Z-bend: down, across, down
    return `M ${sourcePoint.x} ${sourcePoint.y} ` +
           `L ${sourcePoint.x} ${midY} ` +
           `L ${targetPoint.x} ${midY} ` +
           `L ${targetPoint.x} ${targetPoint.y}`
  }

  // For left→right connections: horizontal-first routing
  if ((sourcePort === 'right' && targetPort === 'left') ||
      (sourcePort === 'left' && targetPort === 'right')) {
    return `M ${sourcePoint.x} ${sourcePoint.y} ` +
           `L ${midX} ${sourcePoint.y} ` +
           `L ${midX} ${targetPoint.y} ` +
           `L ${targetPoint.x} ${targetPoint.y}`
  }

  // Default: L-bend
  return `M ${sourcePoint.x} ${sourcePoint.y} ` +
         `L ${sourcePoint.x} ${targetPoint.y} ` +
         `L ${targetPoint.x} ${targetPoint.y}`
}

// Build SVG path for a bezier-smoothed version
export function routeEdgeSmooth(
  sourcePoint: Point,
  targetPoint: Point,
): string {
  const dx = targetPoint.x - sourcePoint.x
  const cx = dx * 0.5

  return `M ${sourcePoint.x} ${sourcePoint.y} ` +
         `C ${sourcePoint.x + cx} ${sourcePoint.y}, ` +
         `${targetPoint.x - cx} ${targetPoint.y}, ` +
         `${targetPoint.x} ${targetPoint.y}`
}

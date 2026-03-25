import React, { useState, useCallback } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useSymbolRegistry } from '../../stores/symbolRegistry'
import { CANVAS_W, CANVAS_H } from '../../hooks/useCanvas'
import type { ArchNode } from '../../types'

type PortPosition = 'top' | 'top-right' | 'right' | 'bottom' | 'bottom-left' | 'left'

interface Port {
  position: PortPosition
  x: number
  y: number
}

interface EdgeCreationState {
  sourceNodeId: string
  sourcePort: PortPosition
  startX: number
  startY: number
  currentX: number
  currentY: number
}

const DEFAULT_NODE_WIDTH = 130
const DEFAULT_NODE_HEIGHT = 60

function getPortsForNode(node: ArchNode): Port[] {
  const px = node.position.x * CANVAS_W
  const py = node.position.y * CANVAS_H
  const w = DEFAULT_NODE_WIDTH
  const h = DEFAULT_NODE_HEIGHT

  return [
    { position: 'top', x: px + w / 2, y: py },
    { position: 'top-right', x: px + w, y: py + h * 0.25 },
    { position: 'right', x: px + w, y: py + h / 2 },
    { position: 'bottom', x: px + w / 2, y: py + h },
    { position: 'bottom-left', x: px, y: py + h * 0.75 },
    { position: 'left', x: px, y: py + h / 2 },
  ]
}

export function PortOverlay() {
  const nodes = useAppStore((s) => s.nodes)
  const edges = useAppStore((s) => s.edges)
  const setEdges = useAppStore((s) => s.setEdges)
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)
  const getSymbol = useSymbolRegistry((s) => s.getSymbol)

  const [edgeCreationState, setEdgeCreationState] = useState<EdgeCreationState | null>(null)
  const [hoveredPort, setHoveredPort] = useState<{
    nodeId: string
    port: PortPosition
  } | null>(null)

  const handlePortMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string, port: PortPosition, x: number, y: number) => {
      e.stopPropagation()
      setEdgeCreationState({
        sourceNodeId: nodeId,
        sourcePort: port,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      })
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      if (!edgeCreationState) return

      const svg = e.currentTarget.ownerSVGElement
      if (!svg) return

      const point = svg.createSVGPoint()
      point.x = e.clientX
      point.y = e.clientY
      const ctm = svg.getScreenCTM()
      if (ctm) {
        const transformed = point.matrixTransform(ctm.inverse())
        setEdgeCreationState((prev) =>
          prev ? { ...prev, currentX: transformed.x, currentY: transformed.y } : null
        )
      }
    },
    [edgeCreationState]
  )

  const handlePortMouseUp = useCallback(
    (nodeId: string, port: PortPosition) => {
      if (!edgeCreationState) return

      // Don't create self-edges
      if (edgeCreationState.sourceNodeId === nodeId) {
        setEdgeCreationState(null)
        return
      }

      // Create new edge
      const newEdge = {
        id: `edge-${Date.now()}`,
        source: edgeCreationState.sourceNodeId,
        target: nodeId,
        props: {
          source_port: edgeCreationState.sourcePort,
          target_port: port,
        },
      }

      setEdges([...edges, newEdge])
      setEdgeCreationState(null)

      // TODO: Call backend POST /api/sessions/{session_id}/diagrams/{diagram_id}/edges
    },
    [edgeCreationState, edges, setEdges]
  )

  const handleMouseUp = useCallback(() => {
    // Cancel edge creation if released outside a port
    setEdgeCreationState(null)
  }, [])

  // Determine which nodes should show ports
  const nodesWithPorts = nodes.filter((node) => {
    if (edgeCreationState) return true // Show all ports during edge creation
    if (selectedNodeId === node.id) return true
    return false
  })

  return (
    <g
      className="port-layer"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Render ports for relevant nodes */}
      {nodesWithPorts.map((node) => {
        const renderableSymbol = getSymbol(node.symbol_type)
        if (!renderableSymbol) return null

        const ports = getPortsForNode(node)
        const borderColor = renderableSymbol.borderColor

        return (
          <g key={`ports-${node.id}`}>
            {ports.map((port) => {
              const isHovered =
                hoveredPort?.nodeId === node.id && hoveredPort?.port === port.position
              const isCreatingFromThisPort =
                edgeCreationState?.sourceNodeId === node.id &&
                edgeCreationState?.sourcePort === port.position

              return (
                <circle
                  key={`${node.id}-${port.position}`}
                  cx={port.x}
                  cy={port.y}
                  r={isHovered || isCreatingFromThisPort ? 6 : 4}
                  fill={isCreatingFromThisPort ? '#60a5fa' : borderColor}
                  stroke={isHovered ? '#fff' : 'none'}
                  strokeWidth="2"
                  style={{ cursor: 'crosshair' }}
                  onMouseDown={(e) =>
                    handlePortMouseDown(e, node.id, port.position, port.x, port.y)
                  }
                  onMouseEnter={() => setHoveredPort({ nodeId: node.id, port: port.position })}
                  onMouseLeave={() => setHoveredPort(null)}
                  onMouseUp={() => handlePortMouseUp(node.id, port.position)}
                />
              )
            })}
          </g>
        )
      })}

      {/* Preview line during edge creation */}
      {edgeCreationState && (
        <line
          x1={edgeCreationState.startX}
          y1={edgeCreationState.startY}
          x2={edgeCreationState.currentX}
          y2={edgeCreationState.currentY}
          stroke="#60a5fa"
          strokeWidth="2"
          strokeDasharray="4 4"
          pointerEvents="none"
        />
      )}
    </g>
  )
}

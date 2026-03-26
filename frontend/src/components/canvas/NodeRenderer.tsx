import React, { useState, useCallback, useRef } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useSymbolRegistry } from '../../stores/symbolRegistry'
import { getShapeComponent } from '../symbols'
import { CANVAS_W, CANVAS_H } from '../../hooks/useCanvas'
import { NODE_SIZES, DEFAULT_NODE_SIZE } from '../../lib/nodeSizes'

interface DragState {
  nodeId: string
  startX: number
  startY: number
  startNodeX: number
  startNodeY: number
}

export function NodeRenderer() {
  const nodes = useAppStore((s) => s.nodes)
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId)
  const updateNodePosition = useAppStore((s) => s.updateNodePosition)
  const getSymbol = useSymbolRegistry((s) => s.getSymbol)

  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
      // Only drag on left click without modifiers
      if (e.button !== 0 || e.ctrlKey) return

      e.stopPropagation()
      setSelectedNodeId(nodeId)
      setDragState({
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        startNodeX: nodeX,
        startNodeY: nodeY,
      })
    },
    [setSelectedNodeId]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      if (!dragState) return

      const dx = e.clientX - dragState.startX
      const dy = e.clientY - dragState.startY

      // Convert screen pixels to canvas fractions
      // Account for zoom by getting the current zoom from store
      const zoom = useAppStore.getState().zoom
      const canvasDx = dx / zoom
      const canvasDy = dy / zoom

      const newX = Math.max(0, Math.min(1, dragState.startNodeX + canvasDx / CANVAS_W))
      const newY = Math.max(0, Math.min(1, dragState.startNodeY + canvasDy / CANVAS_H))

      // Update position immediately for smooth dragging
      updateNodePosition(dragState.nodeId, newX, newY)

      // Debounce backend sync
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
      updateTimerRef.current = setTimeout(() => {
        // TODO: Call backend PATCH /api/sessions/{session_id}/diagrams/{diagram_id}/nodes/{node_id}
        // For now, position is updated in store only
      }, 500)
    },
    [dragState, updateNodePosition]
  )

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  return (
    <g
      className="node-layer"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {nodes.map((node) => {
        const renderableSymbol = getSymbol(node.symbol_type)
        if (!renderableSymbol) return null

        const ShapeComponent = getShapeComponent(renderableSymbol.shape)
        const defaultSize = NODE_SIZES[renderableSymbol.shape] || DEFAULT_NODE_SIZE

        // Convert fractional position to pixel position
        const px = node.position.x * CANVAS_W
        const py = node.position.y * CANVAS_H

        const isSelected = node.id === selectedNodeId
        const isHovered = node.id === hoveredNodeId

        return (
          <g
            key={node.id}
            transform={`translate(${px}, ${py})`}
            onMouseDown={(e) => handleMouseDown(e, node.id, node.position.x, node.position.y)}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
            style={{ cursor: 'move' }}
          >
            {/* Selection highlight */}
            {isSelected && (
              <rect
                x={-5}
                y={-5}
                width={defaultSize.width + 10}
                height={defaultSize.height + 10}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
                strokeDasharray="4 4"
                rx="4"
              />
            )}

            {/* Hover highlight */}
            {isHovered && !isSelected && (
              <rect
                x={-3}
                y={-3}
                width={defaultSize.width + 6}
                height={defaultSize.height + 6}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1"
                rx="4"
              />
            )}

            {/* Render the shape component */}
            <ShapeComponent
              name={node.name}
              props={node.props || {}}
              color={renderableSymbol.color}
              borderColor={renderableSymbol.borderColor}
              bgColor={renderableSymbol.bgColor}
              width={defaultSize.width}
              height={defaultSize.height}
            />
          </g>
        )
      })}
    </g>
  )
}

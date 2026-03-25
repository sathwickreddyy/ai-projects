import React, { useCallback } from 'react'
import { useCanvas, CANVAS_W, CANVAS_H } from '../../hooks/useCanvas'
import { useAppStore } from '../../stores/appStore'
import { CanvasBackground } from './CanvasBackground'
import { EdgeRenderer } from './EdgeRenderer'
import { NodeRenderer } from './NodeRenderer'
import { PortOverlay } from './PortOverlay'

export function Canvas() {
  const { viewBox, handlers, screenToCanvas } = useCanvas()
  const nodes = useAppStore((s) => s.nodes)
  const setNodes = useAppStore((s) => s.setNodes)

  const handleDrop = useCallback(
    (e: React.DragEvent<SVGSVGElement>) => {
      e.preventDefault()

      try {
        // Get the symbol type from the drag event
        const symbolType = e.dataTransfer.getData('application/symbol-type')
        if (!symbolType) return

        // Get the label
        const label = e.dataTransfer.getData('application/symbol-label') || 'New Node'

        // Convert screen coordinates to canvas coordinates
        const svg = e.currentTarget
        const canvasCoords = screenToCanvas(e.clientX, e.clientY, svg)

        // Convert to fractional coordinates (0-1)
        const x = Math.max(0, Math.min(1, canvasCoords.x / CANVAS_W))
        const y = Math.max(0, Math.min(1, canvasCoords.y / CANVAS_H))

        // Create new node
        const newNode = {
          id: `node-${Date.now()}`,
          symbol_type: symbolType,
          name: label,
          position: { x, y },
          props: {},
        }

        setNodes([...nodes, newNode])

        // TODO: Call backend POST /api/sessions/{session_id}/diagrams/{diagram_id}/nodes
      } catch (error) {
        console.error('Failed to handle drop:', error)
      }
    },
    [nodes, setNodes, screenToCanvas]
  )

  const handleDragOver = useCallback((e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault()
    // Allow drop
  }, [])

  return (
    <svg
      viewBox={viewBox}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0f1419',
      }}
      onWheel={handlers.onWheel}
      onMouseDown={handlers.onMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseUp={handlers.onMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Background layer */}
      <CanvasBackground />

      {/* Edge layer (below nodes) */}
      <g className="edge-layer">
        <EdgeRenderer />
      </g>

      {/* Node layer */}
      <g className="node-layer">
        <NodeRenderer />
      </g>

      {/* Port layer (on top) */}
      <g className="port-layer">
        <PortOverlay />
      </g>
    </svg>
  )
}

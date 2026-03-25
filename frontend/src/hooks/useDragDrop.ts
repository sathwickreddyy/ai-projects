import { useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { useCanvas, CANVAS_W, CANVAS_H } from './useCanvas'
import type { PaletteItem } from '../types'

export function useDragDrop() {
  const nodes = useAppStore((s) => s.nodes)
  const setNodes = useAppStore((s) => s.setNodes)
  const { screenToCanvas } = useCanvas()

  const onDragOver = useCallback((e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault()
    // Allow drop
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent<SVGSVGElement>) => {
      e.preventDefault()

      try {
        // Read symbol_type from dataTransfer
        const symbolType = e.dataTransfer.getData('symbol_type')
        if (!symbolType) return

        // Read symbol_data (PaletteItem JSON) from dataTransfer
        const symbolDataStr = e.dataTransfer.getData('symbol_data')
        let paletteItem: PaletteItem | null = null
        if (symbolDataStr) {
          try {
            paletteItem = JSON.parse(symbolDataStr) as PaletteItem
          } catch {
            // Fallback if JSON parse fails
          }
        }

        // Convert drop position to canvas coordinates
        const svg = e.currentTarget
        const canvasCoords = screenToCanvas(e.clientX, e.clientY, svg)

        // Convert to 0-1 fractions
        const x = Math.max(0, Math.min(1, canvasCoords.x / CANVAS_W))
        const y = Math.max(0, Math.min(1, canvasCoords.y / CANVAS_H))

        // Create new ArchNode with unique ID, symbol_type, default props from item
        const newNode = {
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          symbol_type: symbolType,
          name: paletteItem?.label || symbolType,
          position: { x, y },
          props: {},
        }

        // Add to store nodes
        setNodes([...nodes, newNode])

        // TODO: Optionally call backend API to persist the node
      } catch (error) {
        console.error('Failed to handle drop:', error)
      }
    },
    [nodes, setNodes, screenToCanvas]
  )

  return { onDrop, onDragOver }
}

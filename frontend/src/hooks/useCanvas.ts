import { useState, useCallback, useRef } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSymbolRegistry } from '../stores/symbolRegistry'
import { NODE_SIZES, DEFAULT_NODE_SIZE } from '../lib/nodeSizes'

const CANVAS_W = 1200
const CANVAS_H = 700

interface CanvasHook {
  zoom: number
  pan: { x: number; y: number }
  viewBox: string
  handlers: {
    onWheel: (e: React.WheelEvent<SVGSVGElement>) => void
    onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void
    onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void
    onMouseUp: (e: React.MouseEvent<SVGSVGElement>) => void
  }
  screenToCanvas: (screenX: number, screenY: number, svgElement: SVGSVGElement) => { x: number; y: number }
  fitToContent: () => void
}

export function useCanvas(): CanvasHook {
  const zoom = useAppStore((s) => s.zoom)
  const pan = useAppStore((s) => s.pan)
  const setZoom = useAppStore((s) => s.setZoom)
  const setPan = useAppStore((s) => s.setPan)

  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)

  // Compute viewBox from zoom and pan
  const width = CANVAS_W / zoom
  const height = CANVAS_H / zoom
  const x = pan.x
  const y = pan.y
  const viewBox = `${x} ${y} ${width} ${height}`

  // Handle zoom with scroll wheel
  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault()
      const delta = e.deltaY
      const zoomFactor = delta > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor))
      setZoom(newZoom)
    },
    [zoom, setZoom]
  )

  // Handle pan with middle-click or ctrl+drag
  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        e.preventDefault()
        setIsPanning(true)
        panStartRef.current = { x: e.clientX, y: e.clientY }
      }
    },
    []
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isPanning && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x
        const dy = e.clientY - panStartRef.current.y
        const canvasDx = dx / zoom
        const canvasDy = dy / zoom

        setPan({
          x: pan.x - canvasDx,
          y: pan.y - canvasDy,
        })

        panStartRef.current = { x: e.clientX, y: e.clientY }
      }
    },
    [isPanning, pan, zoom, setPan]
  )

  const onMouseUp = useCallback(() => {
    setIsPanning(false)
    panStartRef.current = null
  }, [])

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number, svgElement: SVGSVGElement) => {
      const svgPoint = svgElement.createSVGPoint()
      svgPoint.x = screenX
      svgPoint.y = screenY
      const ctm = svgElement.getScreenCTM()
      if (ctm) {
        const transformed = svgPoint.matrixTransform(ctm.inverse())
        return { x: transformed.x, y: transformed.y }
      }
      return { x: 0, y: 0 }
    },
    []
  )

  // Fit viewport to frame all nodes with padding
  const fitToContent = useCallback(() => {
    const nodes = useAppStore.getState().nodes
    if (nodes.length === 0) return

    const registry = useSymbolRegistry.getState()
    const PAD = 80

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const node of nodes) {
      const sym = registry.getSymbol(node.symbol_type)
      const shape = sym?.shape ?? 'rounded_rect'
      const size = NODE_SIZES[shape] ?? DEFAULT_NODE_SIZE

      const px = node.position.x * CANVAS_W
      const py = node.position.y * CANVAS_H

      minX = Math.min(minX, px)
      minY = Math.min(minY, py)
      maxX = Math.max(maxX, px + size.width)
      maxY = Math.max(maxY, py + size.height + 24) // +24 for text label
    }

    const contentW = maxX - minX + PAD * 2
    const contentH = maxY - minY + PAD * 2

    // Zoom to fit: viewBox width = CANVAS_W / zoom, so zoom = CANVAS_W / desiredWidth
    const fitZoom = Math.min(CANVAS_W / contentW, CANVAS_H / contentH)
    const clampedZoom = Math.max(0.2, Math.min(3, fitZoom))

    setPan({
      x: minX - PAD,
      y: minY - PAD,
    })
    setZoom(clampedZoom)
  }, [setZoom, setPan])

  return {
    zoom,
    pan,
    viewBox,
    handlers: {
      onWheel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
    },
    screenToCanvas,
    fitToContent,
  }
}

export { CANVAS_W, CANVAS_H }

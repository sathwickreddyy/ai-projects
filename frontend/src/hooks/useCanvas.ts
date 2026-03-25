import { useState, useCallback, useRef } from 'react'
import { useAppStore } from '../stores/appStore'

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
}

export function useCanvas(): CanvasHook {
  const zoom = useAppStore((s) => s.zoom)
  const pan = useAppStore((s) => s.pan)
  const setZoom = useAppStore((s) => s.setZoom)
  const setPan = useAppStore((s) => s.setPan)

  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)

  // Compute viewBox from zoom and pan
  // The viewBox defines what portion of the canvas coordinate space is visible
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
      // Middle mouse button or ctrl+left click
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

        // Convert screen pixels to canvas units (considering zoom)
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
  }
}

export { CANVAS_W, CANVAS_H }

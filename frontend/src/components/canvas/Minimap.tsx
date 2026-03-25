import { useAppStore } from '../../stores/appStore'
import { useSymbolRegistry } from '../../stores/symbolRegistry'
import { useCanvas, CANVAS_W, CANVAS_H } from '../../hooks/useCanvas'

const MINIMAP_WIDTH = 120
const MINIMAP_HEIGHT = 80
const NODE_SIZE = 4 // Small rectangle size for nodes in minimap

export function Minimap() {
  const nodes = useAppStore((s) => s.nodes)
  const { viewBox } = useCanvas()
  const { renderableSymbols } = useSymbolRegistry()

  // Parse viewBox to get current viewport
  const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number)

  // Calculate scale factors
  const scaleX = MINIMAP_WIDTH / CANVAS_W
  const scaleY = MINIMAP_HEIGHT / CANVAS_H

  // Calculate viewport indicator rectangle
  const viewportX = vbX * scaleX
  const viewportY = vbY * scaleY
  const viewportWidth = vbWidth * scaleX
  const viewportHeight = vbHeight * scaleY

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        zIndex: 10,
        width: `${MINIMAP_WIDTH}px`,
        height: `${MINIMAP_HEIGHT}px`,
        backgroundColor: '#0f1117',
        border: '1px solid #1e2430',
        borderRadius: '6px',
        opacity: 0.8,
        overflow: 'hidden',
      }}
    >
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
        style={{ display: 'block' }}
      >
        {/* Render nodes as small colored rectangles */}
        {nodes.map((node) => {
          // Convert fractional position (0-1) to canvas pixels, then to minimap pixels
          const x = node.position.x * CANVAS_W * scaleX
          const y = node.position.y * CANVAS_H * scaleY

          // Get color from symbol registry
          const symbol = renderableSymbols[node.symbol_type]
          const color = symbol?.color ?? '#6b7280'

          return (
            <rect
              key={node.id}
              x={x - NODE_SIZE / 2}
              y={y - NODE_SIZE / 2}
              width={NODE_SIZE}
              height={NODE_SIZE * 0.75} // Slightly wider than tall for better visibility
              fill={color}
              rx={0.5}
            />
          )
        })}

        {/* Viewport indicator - shows what portion of the canvas is currently visible */}
        <rect
          x={viewportX}
          y={viewportY}
          width={viewportWidth}
          height={viewportHeight}
          fill="none"
          stroke="#2563eb"
          strokeWidth={1}
          opacity={0.6}
        />
      </svg>
    </div>
  )
}

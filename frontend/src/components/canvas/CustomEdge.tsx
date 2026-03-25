import React from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  MarkerType,
  type EdgeProps,
} from '@xyflow/react'

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const animated = (data as { animated?: boolean })?.animated ?? false
  const label = (data as { label?: string })?.label ?? ''
  const color = (data as { color?: string })?.color ?? '#4b5563'

  const strokeStyle = animated
    ? { strokeDasharray: '6 3', animation: 'dash 1.5s linear infinite' }
    : {}

  return (
    <>
      <style>{`@keyframes dash { to { stroke-dashoffset: -18; } }`}</style>
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#arrow-${id})`}
        style={{ stroke: color, strokeWidth: 2, ...strokeStyle }}
      />
      <defs>
        <marker id={`arrow-${id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              background: '#161b27',
              border: `1px solid ${color}44`,
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 10,
              color: '#9ca3af',
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

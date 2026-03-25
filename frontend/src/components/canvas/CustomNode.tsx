import React from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ArchNode } from '../../types'

type CustomNodeData = ArchNode & { color?: string; border_color?: string }

export default function CustomNode({ data }: NodeProps) {
  const d = data as CustomNodeData
  const color = d.color ?? '#6366f1'
  const borderColor = d.border_color ?? color

  return (
    <div
      style={{
        background: color + '22',
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        padding: '12px 16px',
        minWidth: 120,
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: borderColor }} />
      <Handle type="target" position={Position.Left} style={{ background: borderColor }} />
      <Handle type="source" position={Position.Bottom} style={{ background: borderColor }} />
      <Handle type="source" position={Position.Right} style={{ background: borderColor }} />

      <div style={{ fontSize: 24, marginBottom: 4 }}>{d.icon}</div>
      <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12 }}>{d.label}</div>
      <div
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          fontSize: 9,
          color: borderColor,
          background: color + '33',
          padding: '1px 4px',
          borderRadius: 3,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {d.type}
      </div>
    </div>
  )
}

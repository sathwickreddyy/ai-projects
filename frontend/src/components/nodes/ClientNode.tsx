import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface ClientData {
  label: string
  subtitle?: string
  details?: string[]
}

export function ClientNode({ data }: NodeProps) {
  const d = data as unknown as ClientData
  const s = CATEGORY_STYLES.client

  return (
    <div
      className="rounded-lg min-w-[140px] p-3 text-center"
      style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
    >
      <Handle type="target" position={Position.Top} id="top" className="!bg-[#a78bfa]" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-[#a78bfa]" />

      <div
        className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center"
        style={{ border: `1.5px solid ${s.border}` }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.border} strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12" y2="18.01" />
        </svg>
      </div>
      <div className="font-bold text-[13px]" style={{ color: s.text }}>{d.label}</div>
      {d.subtitle && <div className="text-[10px]" style={{ color: s.border }}>{d.subtitle}</div>}
      {d.details && (
        <div className="mt-1 text-[10px] text-[#6b7280]">
          {d.details.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#a78bfa]" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#a78bfa]" />
    </div>
  )
}

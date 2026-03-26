import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface ExternalData {
  label: string
  provider?: string
  details?: string[]
}

export function ExternalNode({ data }: NodeProps) {
  const d = data as unknown as ExternalData
  const s = CATEGORY_STYLES.external

  return (
    <div
      className="rounded-2xl min-w-[140px] p-3 text-center"
      style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#9ca3af]" />
      <Handle type="target" position={Position.Left} className="!bg-[#9ca3af]" />

      <div className="font-bold text-[13px]" style={{ color: s.text }}>{d.label}</div>
      {d.provider && <div className="text-[10px]" style={{ color: s.border }}>{d.provider}</div>}
      {d.details && (
        <div className="mt-1 text-[10px] text-[#6b7280]">
          {d.details.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#9ca3af]" />
      <Handle type="source" position={Position.Right} className="!bg-[#9ca3af]" />
    </div>
  )
}

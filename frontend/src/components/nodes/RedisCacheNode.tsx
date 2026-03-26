import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface RedisCacheData {
  label: string
  role?: string
  details?: string[]
}

export function RedisCacheNode({ data }: NodeProps) {
  const d = data as unknown as RedisCacheData
  const s = CATEGORY_STYLES.cache

  return (
    <div className="min-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-[#f87171]" />
      <Handle type="target" position={Position.Left} className="!bg-[#f87171]" />

      <div
        className="h-5 rounded-[50%] -mb-1 relative z-10"
        style={{ background: `${s.accent}30`, border: `2px solid ${s.border}` }}
      />
      <div
        className="px-4 py-3 text-center"
        style={{
          background: '#0f1117',
          borderLeft: `2px solid ${s.border}`,
          borderRight: `2px solid ${s.border}`,
        }}
      >
        <div className="font-bold text-sm" style={{ color: s.text }}>{d.label}</div>
        {d.role && (
          <div className="text-[11px] mt-0.5" style={{ color: s.border }}>
            [{d.role}]
          </div>
        )}
        {d.details && d.details.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {d.details.map((detail, i) => (
              <div key={i} className="text-[10px] text-[#6b7280]">{detail}</div>
            ))}
          </div>
        )}
      </div>
      <div
        className="h-5 rounded-[50%] -mt-1 relative z-10"
        style={{ background: `${s.accent}20`, border: `2px solid ${s.border}` }}
      />

      <Handle type="source" position={Position.Bottom} className="!bg-[#f87171]" />
      <Handle type="source" position={Position.Right} className="!bg-[#f87171]" />
    </div>
  )
}

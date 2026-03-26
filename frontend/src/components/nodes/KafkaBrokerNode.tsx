import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface KafkaBrokerData {
  label: string
  subtitle?: string
  topics?: Array<{ name: string; partitions: number }>
}

export function KafkaBrokerNode({ data }: NodeProps) {
  const d = data as unknown as KafkaBrokerData
  const s = CATEGORY_STYLES.messaging

  return (
    <div
      className="rounded-lg overflow-hidden min-w-[200px]"
      style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#f87171]" />
      <Handle type="target" position={Position.Left} className="!bg-[#f87171]" />

      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ background: s.headerFill, borderBottom: `1px solid ${s.border}` }}
      >
        <span className="font-bold text-sm" style={{ color: s.text }}>{d.label}</span>
        {d.subtitle && <span className="text-xs text-[#6b7280]">{d.subtitle}</span>}
      </div>

      {d.topics && d.topics.length > 0 && (
        <div className="p-2 flex flex-col gap-1.5">
          {d.topics.map((topic) => (
            <div
              key={topic.name}
              className="flex items-center gap-2 rounded-full px-2.5 py-1"
              style={{ background: s.fill, border: `1.5px solid ${s.border}50` }}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(topic.partitions, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[18px] h-[14px] rounded-sm flex items-center justify-center"
                    style={{
                      background: `${s.accent}30`,
                      border: `1px solid ${s.accent}50`,
                      fontSize: 7,
                      color: s.text,
                    }}
                  >
                    P{i}
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-medium" style={{ color: s.text }}>
                {topic.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#f87171]" />
      <Handle type="source" position={Position.Right} className="!bg-[#f87171]" />
    </div>
  )
}

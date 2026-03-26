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
      className="rounded-lg overflow-hidden min-w-[260px]"
      style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
    >
      {/* Broker-level handles */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-[#f87171]" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-[#f87171]" />

      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ background: s.headerFill, borderBottom: `1px solid ${s.border}` }}
      >
        <span className="font-bold text-sm" style={{ color: s.text }}>{d.label}</span>
        {d.subtitle && <span className="text-xs text-[#6b7280]">{d.subtitle}</span>}
      </div>

      {/* Topics as horizontal cylinders */}
      {d.topics && d.topics.length > 0 && (
        <div className="p-2.5 flex flex-col gap-2">
          {d.topics.map((topic) => (
            <div key={topic.name} className="relative flex items-center">
              {/* Per-topic target handle on left */}
              <Handle
                type="target"
                position={Position.Left}
                id={`topic-${topic.name}-in`}
                className="!bg-[#f87171] !w-2 !h-2"
                style={{ top: '50%', left: -6 }}
              />

              {/* Horizontal cylinder shape */}
              <div className="flex items-stretch w-full">
                {/* Left cap (ellipse) */}
                <div
                  className="w-3 rounded-l-full flex-shrink-0"
                  style={{ background: `${s.accent}25`, borderTop: `1.5px solid ${s.border}80`, borderBottom: `1.5px solid ${s.border}80`, borderLeft: `1.5px solid ${s.border}80` }}
                />
                {/* Cylinder body */}
                <div
                  className="flex-1 flex items-center gap-2 px-2 py-1.5"
                  style={{ background: `${s.accent}10`, borderTop: `1.5px solid ${s.border}80`, borderBottom: `1.5px solid ${s.border}80` }}
                >
                  {/* Partition blocks */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(topic.partitions, 5) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[20px] h-[16px] rounded-sm flex items-center justify-center"
                        style={{
                          background: `${s.accent}35`,
                          border: `1px solid ${s.accent}60`,
                          fontSize: 8,
                          fontWeight: 600,
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
                {/* Right cap (ellipse) */}
                <div
                  className="w-3 rounded-r-full flex-shrink-0"
                  style={{ background: `${s.accent}15`, borderTop: `1.5px solid ${s.border}80`, borderBottom: `1.5px solid ${s.border}80`, borderRight: `1.5px solid ${s.border}80` }}
                />
              </div>

              {/* Per-topic source handle on right */}
              <Handle
                type="source"
                position={Position.Right}
                id={`topic-${topic.name}-out`}
                className="!bg-[#f87171] !w-2 !h-2"
                style={{ top: '50%', right: -6 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Broker-level handles */}
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#f87171]" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#f87171]" />
    </div>
  )
}

import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface PostgresDBData {
  label: string
  subtitle?: string
  tables?: string[]
  role?: string
}

export function PostgresDBNode({ data, selected }: NodeProps) {
  const d = data as unknown as PostgresDBData
  const s = CATEGORY_STYLES.database

  return (
    <>
      <NodeResizer isVisible={!!selected} minWidth={160} minHeight={80} lineClassName="!border-[#60a5fa]" handleClassName="!bg-[#60a5fa] !w-2 !h-2" />
      <div className="w-full h-full">
        <Handle type="target" position={Position.Top} id="top" className="!bg-[#60a5fa]" />
        <Handle type="target" position={Position.Left} id="left" className="!bg-[#60a5fa]" />

        <div
          className="h-[18px] rounded-[50%] -mb-1 relative z-10"
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
          {d.subtitle && <div className="text-[10px]" style={{ color: s.border }}>{d.subtitle}</div>}
          {d.tables && d.tables.length > 0 && (
            <div className="mt-2 pt-1 border-t border-dashed" style={{ borderColor: `${s.border}40` }}>
              <div className="text-[10px] text-[#6b7280]">{d.tables.join(' · ')}</div>
            </div>
          )}
          {d.role && <div className="text-[9px] mt-1" style={{ color: '#f59e0b' }}>{d.role}</div>}
        </div>
        <div
          className="h-[18px] rounded-[50%] -mt-1 relative z-10"
          style={{ background: `${s.accent}20`, border: `2px solid ${s.border}` }}
        />

        <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#60a5fa]" />
        <Handle type="source" position={Position.Right} id="right" className="!bg-[#60a5fa]" />
      </div>
    </>
  )
}

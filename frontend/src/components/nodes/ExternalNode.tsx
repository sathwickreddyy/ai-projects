import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface ExternalData {
  label: string
  provider?: string
  details?: string[]
}

export function ExternalNode({ data, selected }: NodeProps) {
  const d = data as unknown as ExternalData
  const s = CATEGORY_STYLES.external

  return (
    <>
      <NodeResizer isVisible={!!selected} minWidth={140} minHeight={60} lineClassName="!border-[#9ca3af]" handleClassName="!bg-[#9ca3af] !w-2 !h-2" />
      <div
        className="rounded-2xl w-full h-full p-3 text-center"
        style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
      >
        <Handle type="target" position={Position.Top} id="top" className="!bg-[#9ca3af]" />
        <Handle type="target" position={Position.Left} id="left" className="!bg-[#9ca3af]" />

        <div className="font-bold text-[13px]" style={{ color: s.text }}>{d.label}</div>
        {d.provider && <div className="text-[10px]" style={{ color: s.border }}>{d.provider}</div>}
        {d.details && (
          <div className="mt-1 text-[10px] text-[#6b7280]">
            {d.details.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}

        <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#9ca3af]" />
        <Handle type="source" position={Position.Right} id="right" className="!bg-[#9ca3af]" />
      </div>
    </>
  )
}

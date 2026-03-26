import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface APIServiceData {
  label: string
  step?: number
  endpoints?: string[]
  mode?: string
  framework?: string
}

export function APIServiceNode({ data }: NodeProps) {
  const d = data as unknown as APIServiceData
  const s = CATEGORY_STYLES.api

  return (
    <div
      className="rounded-lg min-w-[180px] p-3"
      style={{ background: s.fill, border: `2px solid ${s.border}` }}
    >
      <Handle type="target" position={Position.Top} id="top" className="!bg-[#34d399]" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-[#34d399]" />

      <div className="flex items-center gap-2 mb-2">
        {d.step != null && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: s.accent, color: 'white' }}
          >
            {d.step}
          </span>
        )}
        <span className="font-bold text-sm" style={{ color: s.text }}>{d.label}</span>
      </div>

      {d.framework && (
        <div className="text-[10px] mb-1.5" style={{ color: s.accent }}>{d.framework}</div>
      )}

      {d.endpoints && d.endpoints.length > 0 && (
        <div className="text-[11px] leading-relaxed text-[#9ca3af]">
          {d.endpoints.map((ep, i) => (
            <div key={i}>{ep}</div>
          ))}
        </div>
      )}

      {d.mode && (
        <div
          className="mt-2 pt-1.5 text-[10px] border-t"
          style={{ color: s.border, borderColor: `${s.border}30` }}
        >
          {d.mode}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#34d399]" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#34d399]" />
    </div>
  )
}

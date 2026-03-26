import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES, type Category } from './nodeStyles'

interface ContainerData {
  label: string
  subtitle?: string
  category?: Category
  children?: Array<{ name: string; detail?: string }>
}

export function ContainerNode({ data, selected }: NodeProps) {
  const d = data as unknown as ContainerData
  const s = CATEGORY_STYLES[d.category ?? 'infrastructure']

  return (
    <>
      <NodeResizer isVisible={!!selected} minWidth={200} minHeight={80} lineClassName="!border-[#38bdf8]" handleClassName="!bg-[#38bdf8] !w-2 !h-2" />
      <div
        className="rounded-lg overflow-hidden w-full h-full"
        style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
      >
        <Handle type="target" position={Position.Top} id="top" className="!bg-[#38bdf8]" />
        <Handle type="target" position={Position.Left} id="left" className="!bg-[#38bdf8]" />

        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{ background: s.headerFill, borderBottom: `1px solid ${s.border}` }}
        >
          <span className="font-bold text-sm" style={{ color: s.text }}>{d.label}</span>
          {d.subtitle && <span className="text-xs text-[#6b7280]">{d.subtitle}</span>}
        </div>

        {d.children && d.children.length > 0 && (
          <div className="p-2 space-y-1.5">
            {d.children.map((child) => (
              <div
                key={child.name}
                className="rounded px-2.5 py-1.5"
                style={{ background: s.fill, border: `1px solid ${s.border}40` }}
              >
                <div className="text-[11px] font-medium" style={{ color: s.text }}>{child.name}</div>
                {child.detail && (
                  <div className="text-[10px] text-[#6b7280]">{child.detail}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[#38bdf8]" />
        <Handle type="source" position={Position.Right} id="right" className="!bg-[#38bdf8]" />
      </div>
    </>
  )
}

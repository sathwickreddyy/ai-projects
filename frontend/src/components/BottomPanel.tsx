import { useState } from 'react'
import type { ArchSession } from '../types'

interface BottomPanelProps {
  session: ArchSession | null
  nodeCount: number
  edgeCount: number
}

export function BottomPanel({ session, nodeCount, edgeCount }: BottomPanelProps) {
  const [expanded, setExpanded] = useState(true)

  if (!session) return null

  const nodesByType: Record<string, number> = {}
  for (const node of session.data.nodes) {
    const type = node.type || 'unknown'
    nodesByType[type] = (nodesByType[type] || 0) + 1
  }

  return (
    <div
      className="border-t border-[#1e2430] bg-[#161b27] transition-all"
      style={{ height: expanded ? 160 : 36 }}
    >
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-9 px-4 flex items-center justify-between text-xs hover:bg-[#1e2430] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#7c9adb] font-semibold">AI Generated</span>
          <span className="text-[#6b7280]">
            {nodeCount} nodes · {edgeCount} edges
          </span>
        </div>
        <span className="text-[#6b7280]">{expanded ? '▾' : '▴'}</span>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-3 flex gap-6 overflow-x-auto">
          {/* Summary */}
          <div className="flex-shrink-0">
            <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">Architecture</div>
            <div className="text-[13px] text-[#c9d1e0] font-medium">{session.title}</div>
            <div className="flex gap-1.5 mt-2">
              {session.detected_stack.map((tech) => (
                <span
                  key={tech}
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#1e2430] text-[#9ca3af]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Component breakdown */}
          <div className="flex-shrink-0 border-l border-[#1e2430] pl-6">
            <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">Components</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {Object.entries(nodesByType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 text-[11px]">
                  <span className="text-[#c9d1e0]">{count}x</span>
                  <span className="text-[#6b7280]">{type.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Edge summary */}
          <div className="flex-shrink-0 border-l border-[#1e2430] pl-6">
            <div className="text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">Connections</div>
            <div className="space-y-1">
              {session.data.edges.slice(0, 5).map((edge) => (
                <div key={edge.id} className="text-[11px] text-[#9ca3af]">
                  <span className="text-[#c9d1e0]">{edge.source}</span>
                  <span className="text-[#6b7280] mx-1">→</span>
                  <span className="text-[#c9d1e0]">{edge.target}</span>
                  {edge.label && (
                    <span className="text-[#6b7280] ml-1">({edge.label})</span>
                  )}
                </div>
              ))}
              {session.data.edges.length > 5 && (
                <div className="text-[10px] text-[#6b7280]">
                  +{session.data.edges.length - 5} more
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

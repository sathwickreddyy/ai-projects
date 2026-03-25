import { useAppStore } from '../../stores/appStore'
import { computeDiff } from '../../lib/diffEngine'
import { useEffect, useState } from 'react'
import type { DiagramDiff } from '../../types'

export function DiffView() {
  const currentDiagram = useAppStore((state) => state.currentDiagram)
  const nodes = useAppStore((state) => state.nodes)
  const edges = useAppStore((state) => state.edges)
  const [diff, setDiff] = useState<DiagramDiff | null>(null)

  useEffect(() => {
    if (currentDiagram) {
      // v1 = original diagram, v2 = current nodes/edges
      const v1Nodes = currentDiagram.nodes
      const v1Edges = currentDiagram.edges
      const v2Nodes = nodes
      const v2Edges = edges

      const diffResult = computeDiff(v1Nodes, v1Edges, v2Nodes, v2Edges)
      setDiff(diffResult)
    }
  }, [currentDiagram, nodes, edges])

  if (!diff || !currentDiagram) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>No diff available</p>
      </div>
    )
  }

  const addedNodeIds = new Set(diff.added_nodes.map((n) => n.id))
  const removedNodeIds = new Set(diff.removed_nodes.map((n) => n.id))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Two-column layout */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-6 overflow-y-auto">
        {/* Left Panel: System Generated (v1) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-white">System Generated</h3>
            <span className="px-2 py-1 text-xs font-medium bg-[#3b82f6] text-white rounded">
              v1
            </span>
          </div>
          <div className="space-y-2">
            {currentDiagram.nodes.map((node) => {
              const isRemoved = removedNodeIds.has(node.id)
              return (
                <div
                  key={node.id}
                  className={`p-3 rounded-lg border ${
                    isRemoved
                      ? 'bg-[#1a0f0f] border-[#ef4444] opacity-50'
                      : 'bg-[#161b27] border-[#1e2430]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isRemoved && (
                      <span className="text-xs font-semibold text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded">
                        REMOVED
                      </span>
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isRemoved ? 'line-through text-gray-500' : 'text-white'
                      }`}
                    >
                      {node.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{node.symbol_type}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Panel: Your Modified (v2) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-white">Your Modified</h3>
            <span className="px-2 py-1 text-xs font-medium bg-[#22c55e] text-white rounded">
              current
            </span>
          </div>
          <div className="space-y-2">
            {nodes.map((node) => {
              const isAdded = addedNodeIds.has(node.id)
              return (
                <div
                  key={node.id}
                  className={`p-3 rounded-lg border ${
                    isAdded
                      ? 'bg-[#0f1a0f] border-[#22c55e]'
                      : 'bg-[#161b27] border-[#1e2430]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isAdded && (
                      <span className="text-xs font-semibold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded">
                        NEW
                      </span>
                    )}
                    <span className="text-sm font-medium text-white">{node.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{node.symbol_type}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Change Summary Bar */}
      <div className="border-t border-[#1e2430] bg-[#0f1117] px-6 py-3">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#22c55e] font-semibold">
              +{diff.added_nodes.length}
            </span>
            <span className="text-gray-400">nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#ef4444] font-semibold">
              -{diff.removed_nodes.length}
            </span>
            <span className="text-gray-400">nodes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#eab308] font-semibold">
              ~{diff.added_edges.length + diff.removed_edges.length}
            </span>
            <span className="text-gray-400">edges</span>
          </div>
        </div>
      </div>
    </div>
  )
}

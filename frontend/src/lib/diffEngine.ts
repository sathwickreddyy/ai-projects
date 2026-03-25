import type { ArchNode, ArchEdge, DiagramDiff } from '../types'

export function computeDiff(
  v1Nodes: ArchNode[],
  v1Edges: ArchEdge[],
  v2Nodes: ArchNode[],
  v2Edges: ArchEdge[],
): DiagramDiff {
  const v1NodeIds = new Set(v1Nodes.map(n => n.id))
  const v2NodeIds = new Set(v2Nodes.map(n => n.id))
  const v1EdgeIds = new Set(v1Edges.map(e => e.id))
  const v2EdgeIds = new Set(v2Edges.map(e => e.id))

  return {
    added_nodes: v2Nodes.filter(n => !v1NodeIds.has(n.id)).map(n => ({ id: n.id, name: n.name })),
    removed_nodes: v1Nodes.filter(n => !v2NodeIds.has(n.id)).map(n => ({ id: n.id, name: n.name })),
    modified_nodes: v2Nodes
      .filter(n => v1NodeIds.has(n.id))
      .filter(n => {
        const v1 = v1Nodes.find(v => v.id === n.id)
        return v1 && (v1.name !== n.name || v1.symbol_type !== n.symbol_type)
      })
      .map(n => {
        const v1 = v1Nodes.find(v => v.id === n.id)!
        const changes: Record<string, { old: unknown; new: unknown }> = {}
        if (v1.name !== n.name) {
          changes.name = { old: v1.name, new: n.name }
        }
        if (v1.symbol_type !== n.symbol_type) {
          changes.symbol_type = { old: v1.symbol_type, new: n.symbol_type }
        }
        return { id: n.id, changes }
      }),
    added_edges: v2Edges.filter(e => !v1EdgeIds.has(e.id)).map(e => ({ id: e.id })),
    removed_edges: v1Edges.filter(e => !v2EdgeIds.has(e.id)).map(e => ({ id: e.id })),
  }
}

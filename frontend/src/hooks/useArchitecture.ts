import { useCallback } from 'react'
import { patchArchitecture } from '../api/client'
import { useAppStore } from '../stores/appStore'
import type { ArchEdge, ArchNode } from '../types'

export function useArchitecture() {
  const { activeArchitecture, updateNodes, updateEdges } = useAppStore()

  const saveNodes = useCallback(
    async (nodes: ArchNode[]) => {
      if (!activeArchitecture) return
      updateNodes(nodes)
      await patchArchitecture(activeArchitecture.id, { nodes })
    },
    [activeArchitecture, updateNodes]
  )

  const saveEdges = useCallback(
    async (edges: ArchEdge[]) => {
      if (!activeArchitecture) return
      updateEdges(edges)
      await patchArchitecture(activeArchitecture.id, { edges })
    },
    [activeArchitecture, updateEdges]
  )

  return { saveNodes, saveEdges }
}

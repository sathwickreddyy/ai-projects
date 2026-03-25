import { useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { useSymbolRegistry } from '../stores/symbolRegistry'
import { computeLayout } from '../lib/elkLayout'

export function useLayout() {
  const { nodes, edges, setNodes } = useAppStore()
  const { renderableSymbols } = useSymbolRegistry()

  const autoArrange = useCallback(async () => {
    const symbolShapes: Record<string, string> = {}
    for (const node of nodes) {
      const sym = renderableSymbols[node.symbol_type]
      symbolShapes[node.id] = sym?.shape ?? 'rounded_rect'
    }

    const layouted = await computeLayout(nodes, edges, symbolShapes)
    setNodes(layouted)
  }, [nodes, edges, renderableSymbols, setNodes])

  return { autoArrange }
}

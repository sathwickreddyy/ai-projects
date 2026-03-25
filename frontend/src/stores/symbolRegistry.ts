import { create } from 'zustand'
import type { RenderableSymbol, SymbolRegistry } from '../types/symbols'
import { parseSymbolRegistry } from '../lib/symbolParser'

interface SymbolRegistryStore {
  registry: SymbolRegistry | null
  renderableSymbols: Record<string, RenderableSymbol>
  setRegistry: (data: SymbolRegistry) => void
  getSymbol: (symbolType: string) => RenderableSymbol | undefined
}

export const useSymbolRegistry = create<SymbolRegistryStore>((set, get) => ({
  registry: null,
  renderableSymbols: {},
  setRegistry: (data) => {
    const parsed = parseSymbolRegistry(data)
    set({ registry: data, renderableSymbols: parsed })
  },
  getSymbol: (symbolType) => get().renderableSymbols[symbolType],
}))

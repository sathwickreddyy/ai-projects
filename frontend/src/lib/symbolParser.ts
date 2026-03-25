import type { RenderableSymbol, SymbolRegistry } from '../types/symbols'

/**
 * Parse the raw symbol registry from the backend into render-ready structures.
 * Each symbol type gets resolved colors from its category palette and
 * shape capabilities from the meta schema.
 */
export function parseSymbolRegistry(
  registry: SymbolRegistry
): Record<string, RenderableSymbol> {
  const result: Record<string, RenderableSymbol> = {}
  const palette = registry.meta.color_palette
  const shapes = registry.meta.shapes

  for (const [symbolType, defn] of Object.entries(registry.symbols)) {
    const category = defn.category
    const colors = palette[category] ?? { primary: '#6b7280', border: '#9ca3af', bg: '#0f0f0f' }
    const shapeMeta = shapes[defn.shape]

    result[symbolType] = {
      symbolType,
      label: defn.label,
      category,
      shape: defn.shape,
      color: colors.primary,
      borderColor: colors.border,
      bgColor: colors.bg,
      internalElements: defn.internal_elements ?? [],
      supportsChildren: shapeMeta?.supports_children ?? false,
      childType: defn.children?.type,
      childLayout: defn.children?.layout,
      propsSchema: defn.props_schema,
    }
  }

  return result
}

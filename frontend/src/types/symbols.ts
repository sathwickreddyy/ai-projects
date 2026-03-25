// Types derived from the symbol instruction set (symbols.yaml)

export interface ShapeMeta {
  description: string
  renders_as: string
  default_aspect_ratio: string
  supports_children: boolean
  supports_internal_elements: boolean
  child_layout_options?: string[]
}

export interface InternalElementMeta {
  description: string
  visual: string
  placement_options: string[]
  repeat_from: string
}

export interface PortDefinition {
  id: string
  position: string
}

export interface ColorPalette {
  primary: string
  border: string
  bg: string
}

export interface SymbolDefinition {
  category: string
  label: string
  shape: string
  keywords: string[]
  children?: {
    type: string
    layout: string
  }
  internal_elements?: Array<{
    type: string
    from_prop?: string
  }>
  props_schema: Record<string, unknown>
}

export interface SymbolMeta {
  version: string
  shapes: Record<string, ShapeMeta>
  internal_elements: Record<string, InternalElementMeta>
  ports: {
    definition: PortDefinition[]
    note: string
  }
  animations: Record<string, { description: string; applies_to: string }>
  color_palette: Record<string, ColorPalette>
  prop_types: Record<string, unknown>
}

export interface SymbolRegistry {
  meta: SymbolMeta
  symbols: Record<string, SymbolDefinition>
}

// Parsed render-ready structure used by SVG components
export interface RenderableSymbol {
  symbolType: string
  label: string
  category: string
  shape: string
  color: string
  borderColor: string
  bgColor: string
  internalElements: Array<{
    type: string
    fromProp?: string
  }>
  supportsChildren: boolean
  childType?: string
  childLayout?: string
  propsSchema: Record<string, unknown>
}

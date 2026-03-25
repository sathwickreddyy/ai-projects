// Symbol registry types
export interface SymbolRegistry {
  symbols: Record<string, SymbolDefinition>
  meta: SymbolMeta
}

export interface SymbolDefinition {
  label: string
  category: string
  shape: string
  internal_elements?: string[]
  children?: {
    type: string
    layout: string
  }
  props_schema?: Record<string, unknown>
}

export interface SymbolMeta {
  version: string
  color_palette: Record<string, ColorPalette>
  shapes: Record<string, ShapeCapability>
}

export interface ColorPalette {
  primary: string
  border: string
  bg: string
}

export interface ShapeCapability {
  supports_children: boolean
  default_width?: number
  default_height?: number
}

// Renderable symbol (parsed from registry)
export interface RenderableSymbol {
  symbolType: string
  label: string
  category: string
  shape: string
  color: string
  borderColor: string
  bgColor: string
  internalElements: string[]
  supportsChildren: boolean
  childType?: string
  childLayout?: string
  propsSchema?: Record<string, unknown>
}

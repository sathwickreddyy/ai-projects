// Single source of truth for node sizes by shape.
// Used by: NodeRenderer, EdgeRenderer, ELK layout, fitToContent.
export const NODE_SIZES: Record<string, { width: number; height: number }> = {
  horizontal_cylinder: { width: 180, height: 60 },
  container_box: { width: 220, height: 150 },
  diamond_stack: { width: 140, height: 110 },
  hexagon: { width: 160, height: 90 },
  rounded_rect: { width: 150, height: 70 },
  circle: { width: 90, height: 90 },
  cloud: { width: 160, height: 100 },
}

export const DEFAULT_NODE_SIZE = { width: 150, height: 70 }

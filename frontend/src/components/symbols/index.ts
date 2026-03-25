import React from 'react'
import { HorizontalCylinder, type SymbolProps } from './HorizontalCylinder'
import { ContainerBox } from './ContainerBox'
import { DiamondStack } from './DiamondStack'
import { Hexagon } from './Hexagon'
import { RoundedRect } from './RoundedRect'
import { Circle } from './Circle'
import { Cloud } from './Cloud'

export type { SymbolProps } from './HorizontalCylinder'
export { HorizontalCylinder } from './HorizontalCylinder'
export { ContainerBox } from './ContainerBox'
export { DiamondStack } from './DiamondStack'
export { Hexagon } from './Hexagon'
export { RoundedRect } from './RoundedRect'
export { Circle } from './Circle'
export { Cloud } from './Cloud'
export * from './InternalElements'

export const SHAPE_COMPONENTS: Record<string, React.ComponentType<SymbolProps>> = {
  horizontal_cylinder: HorizontalCylinder,
  container_box: ContainerBox,
  diamond_stack: DiamondStack,
  hexagon: Hexagon,
  rounded_rect: RoundedRect,
  circle: Circle,
  cloud: Cloud,
}

export function getShapeComponent(shape: string): React.ComponentType<SymbolProps> {
  return SHAPE_COMPONENTS[shape] ?? RoundedRect
}

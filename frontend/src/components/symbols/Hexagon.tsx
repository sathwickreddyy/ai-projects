import { SymbolProps } from './HorizontalCylinder'
import { EndpointText } from './InternalElements'

export function Hexagon({
  name,
  props,
  color,
  borderColor,
  width = 140,
  height = 80,
  selected,
}: SymbolProps) {
  const centerX = width / 2
  const centerY = height / 2
  const hexWidth = width * 0.8
  const hexHeight = height * 0.75

  // Hexagon points (flat-top orientation)
  const hexPoints = `
    ${centerX - hexWidth / 2},${centerY}
    ${centerX - hexWidth / 4},${centerY - hexHeight / 2}
    ${centerX + hexWidth / 4},${centerY - hexHeight / 2}
    ${centerX + hexWidth / 2},${centerY}
    ${centerX + hexWidth / 4},${centerY + hexHeight / 2}
    ${centerX - hexWidth / 4},${centerY + hexHeight / 2}
  `

  const framework = props.framework as string | undefined
  const endpoints = props.endpoints as string[] | undefined

  return (
    <g>
      <polygon
        points={hexPoints}
        fill={borderColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 3 : 2}
      />
      <text
        x={centerX}
        y={framework ? centerY - 8 : centerY}
        fill="#e2e8f0"
        fontSize={13}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name.length > 14 ? name.slice(0, 14) + '...' : name}
      </text>
      {framework && (
        <text
          x={centerX}
          y={centerY + 8}
          fill={color}
          fontSize={10}
          textAnchor="middle"
          opacity={0.9}
        >
          {framework}
        </text>
      )}
      {endpoints && endpoints.length > 0 && !framework && (
        <EndpointText
          endpoints={endpoints}
          x={centerX - hexWidth / 3}
          y={centerY + 12}
          color={color}
        />
      )}
    </g>
  )
}

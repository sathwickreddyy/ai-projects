import { SymbolProps } from './HorizontalCylinder'
import { EndpointText } from './InternalElements'

export function Hexagon({
  name,
  props,
  color,
  borderColor,
  bgColor,
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
      {/* Hexagon shape */}
      <polygon
        points={hexPoints}
        fill={bgColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 2.5 : 1.5}
      />

      {/* Name text */}
      <text
        x={centerX}
        y={framework ? centerY - 8 : centerY}
        fill="#e2e8f0"
        fontSize={13}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name.length > 12 ? name.slice(0, 12) + '...' : name}
      </text>

      {/* Framework subtitle */}
      {framework && (
        <text
          x={centerX}
          y={centerY + 8}
          fill={color}
          fontSize={10}
          textAnchor="middle"
          opacity={0.8}
        >
          {framework}
        </text>
      )}

      {/* Endpoint list (if space allows) */}
      {endpoints && endpoints.length > 0 && !framework && (
        <EndpointText
          endpoints={endpoints}
          x={centerX - hexWidth / 3}
          y={centerY + 12}
          color={color}
        />
      )}

      {/* Name label below */}
      <text
        x={centerX}
        y={height + 18}
        fill="#e2e8f0"
        fontSize={12}
        fontWeight={500}
        textAnchor="middle"
      >
        {name}
      </text>
    </g>
  )
}

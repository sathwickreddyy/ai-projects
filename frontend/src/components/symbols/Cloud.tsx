import { SymbolProps } from './HorizontalCylinder'

export function Cloud({
  name,
  props,
  color,
  borderColor,
  bgColor,
  width = 140,
  height = 90,
  selected,
}: SymbolProps) {
  const centerX = width / 2
  const centerY = height / 2

  // Cloud path using bezier curves
  const cloudPath = `
    M ${centerX - 35},${centerY + 10}
    Q ${centerX - 45},${centerY + 10} ${centerX - 45},${centerY}
    Q ${centerX - 45},${centerY - 15} ${centerX - 30},${centerY - 20}
    Q ${centerX - 25},${centerY - 30} ${centerX - 10},${centerY - 30}
    Q ${centerX},${centerY - 35} ${centerX + 10},${centerY - 30}
    Q ${centerX + 25},${centerY - 30} ${centerX + 30},${centerY - 20}
    Q ${centerX + 45},${centerY - 15} ${centerX + 45},${centerY}
    Q ${centerX + 45},${centerY + 10} ${centerX + 35},${centerY + 10}
    Z
  `

  const provider = props.provider as string | undefined

  return (
    <g>
      {/* Cloud shape */}
      <path
        d={cloudPath}
        fill={bgColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 2.5 : 1.5}
      />

      {/* Name text */}
      <text
        x={centerX}
        y={provider ? centerY - 4 : centerY}
        fill="#e2e8f0"
        fontSize={12}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name.length > 12 ? name.slice(0, 12) + '...' : name}
      </text>

      {/* Provider subtitle */}
      {provider && (
        <text
          x={centerX}
          y={centerY + 10}
          fill={color}
          fontSize={9}
          textAnchor="middle"
          opacity={0.7}
        >
          {provider}
        </text>
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

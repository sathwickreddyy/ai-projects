import { SymbolProps } from './HorizontalCylinder'

export function Cloud({
  name,
  props,
  color,
  borderColor,
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
      <path
        d={cloudPath}
        fill={borderColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 3 : 2}
      />
      <text
        x={centerX}
        y={provider ? centerY - 4 : centerY}
        fill="#e2e8f0"
        fontSize={12}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name.length > 14 ? name.slice(0, 14) + '...' : name}
      </text>
      {provider && (
        <text
          x={centerX}
          y={centerY + 10}
          fill={color}
          fontSize={9}
          textAnchor="middle"
          opacity={0.8}
        >
          {provider}
        </text>
      )}
    </g>
  )
}

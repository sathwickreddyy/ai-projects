import { SymbolProps } from './HorizontalCylinder'

export function Circle({
  name,
  props,
  color,
  borderColor,
  width = 80,
  height = 80,
  selected,
}: SymbolProps) {
  const radius = Math.min(width, height) / 2 - 2
  const centerX = width / 2
  const centerY = height / 2

  const clientType = props.type as string | undefined

  return (
    <g>
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill={borderColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 3 : 2}
      />
      <text
        x={centerX}
        y={clientType ? centerY - 6 : centerY}
        fill="#e2e8f0"
        fontSize={12}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name.length > 12 ? name.slice(0, 12) + '...' : name}
      </text>
      {clientType && (
        <text
          x={centerX}
          y={centerY + 10}
          fill={color}
          fontSize={9}
          textAnchor="middle"
          opacity={0.8}
        >
          {clientType}
        </text>
      )}
    </g>
  )
}

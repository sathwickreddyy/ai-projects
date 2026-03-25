import { SymbolProps } from './HorizontalCylinder'

export function Circle({
  name,
  props,
  color,
  borderColor,
  bgColor,
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
      {/* Circle shape */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill={bgColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 2.5 : 1.5}
      />

      {/* Name text */}
      <text
        x={centerX}
        y={clientType ? centerY - 6 : centerY}
        fill="#e2e8f0"
        fontSize={12}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name.length > 10 ? name.slice(0, 10) + '...' : name}
      </text>

      {/* Type label (browser, mobile, cli, iot) */}
      {clientType && (
        <text
          x={centerX}
          y={centerY + 10}
          fill={color}
          fontSize={9}
          textAnchor="middle"
          opacity={0.7}
        >
          {clientType}
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

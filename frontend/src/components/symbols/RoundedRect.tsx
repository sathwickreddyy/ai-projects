import { SymbolProps } from './HorizontalCylinder'
import { StatusIndicator } from './InternalElements'

export function RoundedRect({
  name,
  props,
  borderColor,
  bgColor,
  width = 130,
  height = 60,
  selected,
}: SymbolProps) {
  const status = props.status as 'healthy' | 'warning' | 'error' | undefined

  return (
    <g>
      {/* Rounded rectangle */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={8}
        fill={bgColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 2.5 : 1.5}
      />

      {/* Name text */}
      <text
        x={width / 2}
        y={height / 2}
        fill="#e2e8f0"
        fontSize={13}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name.length > 15 ? name.slice(0, 15) + '...' : name}
      </text>

      {/* Status indicator in top-right corner */}
      {status && (
        <StatusIndicator
          status={status}
          x={width - 10}
          y={10}
        />
      )}

      {/* Name label below */}
      <text
        x={width / 2}
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

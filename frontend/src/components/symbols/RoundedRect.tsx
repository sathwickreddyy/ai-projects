import { SymbolProps } from './HorizontalCylinder'
import { StatusIndicator } from './InternalElements'

export function RoundedRect({
  name,
  props,
  borderColor,
  width = 130,
  height = 60,
  selected,
}: SymbolProps) {
  const status = props.status as 'healthy' | 'warning' | 'error' | undefined

  return (
    <g>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={8}
        fill={borderColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 3 : 2}
      />
      <text
        x={width / 2}
        y={height / 2}
        fill="#e2e8f0"
        fontSize={13}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {name.length > 18 ? name.slice(0, 18) + '...' : name}
      </text>
      {status && (
        <StatusIndicator
          status={status}
          x={width - 10}
          y={10}
        />
      )}
    </g>
  )
}

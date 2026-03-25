import { SymbolProps } from './HorizontalCylinder'

export function ContainerBox({
  name,
  props,
  color,
  borderColor,
  bgColor,
  width = 200,
  height,
  selected,
  children,
}: SymbolProps) {
  const headerHeight = 28
  const padding = 12

  // Calculate height based on children or use default
  const contentHeight = height ? height - headerHeight : 120
  const totalHeight = headerHeight + contentHeight

  return (
    <g>
      {/* Container box */}
      <rect
        x={0}
        y={0}
        width={width}
        height={totalHeight}
        rx={8}
        fill={bgColor}
        fillOpacity={0.1}
        stroke={borderColor}
        strokeWidth={selected ? 2.5 : 1.5}
      />

      {/* Header bar */}
      <rect
        x={0}
        y={0}
        width={width}
        height={headerHeight}
        rx={8}
        fill={color}
        fillOpacity={0.2}
      />
      <line
        x1={0}
        y1={headerHeight}
        x2={width}
        y2={headerHeight}
        stroke={borderColor}
        strokeWidth={1}
      />

      {/* Header text */}
      <text
        x={padding}
        y={headerHeight / 2 + 5}
        fill="#e2e8f0"
        fontSize={13}
        fontWeight={600}
      >
        {name}
      </text>

      {/* Children content area */}
      {children && (
        <g transform={`translate(${padding}, ${headerHeight + padding})`}>
          {children}
        </g>
      )}

      {/* If no children but has topics/channels in props, show count */}
      {!children && (
        <text
          x={width / 2}
          y={headerHeight + contentHeight / 2}
          fill="#e2e8f0"
          fontSize={11}
          textAnchor="middle"
          opacity={0.5}
        >
          {props.topics ? `${(props.topics as unknown[]).length} topics` : ''}
          {props.channels ? `${(props.channels as unknown[]).length} channels` : ''}
        </text>
      )}
    </g>
  )
}

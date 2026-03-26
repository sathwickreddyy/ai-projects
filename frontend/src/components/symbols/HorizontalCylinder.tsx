import { PartitionLanes, MessageBlocks, RowLines, SubscriberPulse } from './InternalElements'

export interface SymbolProps {
  name: string
  props: Record<string, unknown>
  color: string
  borderColor: string
  bgColor: string
  width: number
  height: number
  selected?: boolean
  children?: React.ReactNode
}

export function HorizontalCylinder({
  name,
  props,
  color,
  borderColor,
  width = 160,
  height = 50,
  selected,
}: SymbolProps) {
  const capRadius = 12
  const bodyX = capRadius
  const bodyWidth = width - 2 * capRadius

  // Parse internal element hints
  const partitions = props.partitions as number | undefined
  const messagesHint = props.messages_hint as number | undefined
  const tables = props.tables as string[] | undefined
  const subscribers = props.subscribers as number | undefined

  return (
    <g>
      <ellipse
        cx={capRadius}
        cy={height / 2}
        rx={capRadius}
        ry={height / 2}
        fill={borderColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 3 : 2}
      />
      <rect
        x={bodyX}
        y={0}
        width={bodyWidth}
        height={height}
        fill={borderColor}
        fillOpacity={0.15}
        stroke="none"
      />
      <ellipse
        cx={width - capRadius}
        cy={height / 2}
        rx={capRadius}
        ry={height / 2}
        fill={borderColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 3 : 2}
      />
      <line
        x1={bodyX}
        y1={0}
        x2={width - capRadius}
        y2={0}
        stroke={borderColor}
        strokeWidth={selected ? 3 : 2}
      />
      <line
        x1={bodyX}
        y1={height}
        x2={width - capRadius}
        y2={height}
        stroke={borderColor}
        strokeWidth={selected ? 3 : 2}
      />

      {/* Internal elements */}
      {partitions && partitions > 1 && (
        <PartitionLanes
          count={partitions}
          x={bodyX + 4}
          y={4}
          width={bodyWidth - 8}
          height={height - 8}
          color={color}
        />
      )}

      {partitions && messagesHint && (
        <g>
          {Array.from({ length: partitions }).map((_, i) => (
            <MessageBlocks
              key={i}
              count={messagesHint}
              x={bodyX + 4 + i * ((bodyWidth - 8) / partitions)}
              y={4}
              laneWidth={(bodyWidth - 8) / partitions}
              height={height - 8}
              color={color}
            />
          ))}
        </g>
      )}

      {tables && (
        <RowLines
          labels={tables}
          x={bodyX + 8}
          y={12}
          width={bodyWidth - 16}
          color={color}
        />
      )}

      {subscribers && subscribers > 0 && (
        <SubscriberPulse
          count={subscribers}
          x={width - capRadius + 8}
          y={height / 2 - (Math.min(subscribers, 3) - 1) * 6}
          color={color}
        />
      )}

      {/* Name label */}
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

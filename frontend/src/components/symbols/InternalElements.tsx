interface PartitionLanesProps {
  count: number
  x: number
  y: number
  width: number
  height: number
  color: string
}

export function PartitionLanes({ count, x, y, width, height, color }: PartitionLanesProps) {
  const laneWidth = width / count
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <g key={i}>
          <rect
            x={x + i * laneWidth}
            y={y}
            width={laneWidth}
            height={height}
            fill={color}
            fillOpacity={0.1}
            stroke={color}
            strokeWidth={1}
            strokeOpacity={0.3}
          />
          <text
            x={x + i * laneWidth + laneWidth / 2}
            y={y + 15}
            fill="#e2e8f0"
            fontSize={10}
            textAnchor="middle"
            opacity={0.6}
          >
            P{i}
          </text>
        </g>
      ))}
    </g>
  )
}

interface MessageBlocksProps {
  count: number
  x: number
  y: number
  laneWidth: number
  height: number
  color: string
}

export function MessageBlocks({ count, x, y, laneWidth, height, color }: MessageBlocksProps) {
  const blockHeight = 8
  const gap = 2
  return (
    <g>
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <rect
          key={i}
          x={x + 4}
          y={y + height - (i + 1) * (blockHeight + gap)}
          width={laneWidth - 8}
          height={blockHeight}
          fill={color}
          fillOpacity={0.6}
          rx={1}
        />
      ))}
    </g>
  )
}

interface KeyPatternTextProps {
  patterns: string[]
  x: number
  y: number
  color: string
}

export function KeyPatternText({ patterns, x, y, color }: KeyPatternTextProps) {
  return (
    <g>
      {patterns.slice(0, 3).map((pattern, i) => (
        <text
          key={i}
          x={x}
          y={y + i * 14}
          fill={color}
          fontSize={10}
          fontFamily="monospace"
          opacity={0.8}
        >
          {pattern.length > 15 ? pattern.slice(0, 15) + '...' : pattern}
        </text>
      ))}
    </g>
  )
}

interface EndpointTextProps {
  endpoints: string[]
  x: number
  y: number
  color: string
}

export function EndpointText({ endpoints, x, y, color }: EndpointTextProps) {
  return (
    <g>
      {endpoints.slice(0, 4).map((endpoint, i) => (
        <text
          key={i}
          x={x}
          y={y + i * 12}
          fill={color}
          fontSize={9}
          opacity={0.7}
        >
          {endpoint.length > 20 ? endpoint.slice(0, 20) + '...' : endpoint}
        </text>
      ))}
    </g>
  )
}

interface RowLinesProps {
  labels: string[]
  x: number
  y: number
  width: number
  color: string
}

export function RowLines({ labels, x, y, width, color }: RowLinesProps) {
  const rowHeight = 12
  return (
    <g>
      {labels.slice(0, 5).map((label, i) => (
        <g key={i}>
          <line
            x1={x}
            y1={y + i * rowHeight}
            x2={x + width}
            y2={y + i * rowHeight}
            stroke={color}
            strokeWidth={1}
            strokeDasharray="2,2"
            strokeOpacity={0.3}
          />
          <text
            x={x + 4}
            y={y + i * rowHeight + 9}
            fill="#e2e8f0"
            fontSize={9}
            opacity={0.7}
          >
            {label.length > 12 ? label.slice(0, 12) + '...' : label}
          </text>
        </g>
      ))}
    </g>
  )
}

interface AnimatedMessageProps {
  x: number
  y: number
  width: number
  color: string
}

export function AnimatedMessage({ x, y, width, color }: AnimatedMessageProps) {
  return (
    <rect
      x={x}
      y={y}
      width={16}
      height={6}
      fill={color}
      fillOpacity={0.8}
      rx={1}
    >
      <animate
        attributeName="x"
        from={x}
        to={x + width - 16}
        dur="2s"
        repeatCount="indefinite"
      />
    </rect>
  )
}

interface SubscriberPulseProps {
  count: number
  x: number
  y: number
  color: string
}

export function SubscriberPulse({ count, x, y, color }: SubscriberPulseProps) {
  return (
    <g>
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <circle
          key={i}
          cx={x}
          cy={y + i * 12}
          r={4}
          fill={color}
          fillOpacity={0.6}
        >
          <animate
            attributeName="r"
            values="4;6;4"
            dur="1.5s"
            repeatCount="indefinite"
            begin={`${i * 0.3}s`}
          />
          <animate
            attributeName="fill-opacity"
            values="0.6;0.9;0.6"
            dur="1.5s"
            repeatCount="indefinite"
            begin={`${i * 0.3}s`}
          />
        </circle>
      ))}
    </g>
  )
}

interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'error'
  x: number
  y: number
}

export function StatusIndicator({ status, x, y }: StatusIndicatorProps) {
  const colors = {
    healthy: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  }

  return (
    <circle
      cx={x}
      cy={y}
      r={4}
      fill={colors[status]}
      opacity={0.9}
    >
      <animate
        attributeName="opacity"
        values="0.9;0.5;0.9"
        dur="2s"
        repeatCount="indefinite"
      />
    </circle>
  )
}

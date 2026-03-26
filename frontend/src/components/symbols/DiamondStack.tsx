import { SymbolProps } from './HorizontalCylinder'
import { KeyPatternText } from './InternalElements'

export function DiamondStack({
  name,
  props,
  color,
  borderColor,
  width = 120,
  height = 100,
  selected,
}: SymbolProps) {
  const centerX = width / 2
  const centerY = height / 2
  const diamondWidth = width * 0.7
  const diamondHeight = height * 0.6

  // Diamond points (top, right, bottom, left)
  const mainDiamond = `
    ${centerX},${centerY - diamondHeight / 2}
    ${centerX + diamondWidth / 2},${centerY}
    ${centerX},${centerY + diamondHeight / 2}
    ${centerX - diamondWidth / 2},${centerY}
  `

  // Offset diamonds for 3D effect
  const offset = 4
  const backDiamond1 = `
    ${centerX + offset},${centerY - diamondHeight / 2 + offset}
    ${centerX + diamondWidth / 2 + offset},${centerY + offset}
    ${centerX + offset},${centerY + diamondHeight / 2 + offset}
    ${centerX - diamondWidth / 2 + offset},${centerY + offset}
  `
  const backDiamond2 = `
    ${centerX + offset * 2},${centerY - diamondHeight / 2 + offset * 2}
    ${centerX + diamondWidth / 2 + offset * 2},${centerY + offset * 2}
    ${centerX + offset * 2},${centerY + diamondHeight / 2 + offset * 2}
    ${centerX - diamondWidth / 2 + offset * 2},${centerY + offset * 2}
  `

  const keyPatterns = props.key_patterns as string[] | undefined

  return (
    <g>
      <polygon
        points={backDiamond2}
        fill={borderColor}
        fillOpacity={0.06}
        stroke={borderColor}
        strokeWidth={1}
        strokeOpacity={0.4}
      />
      <polygon
        points={backDiamond1}
        fill={borderColor}
        fillOpacity={0.1}
        stroke={borderColor}
        strokeWidth={1}
        strokeOpacity={0.6}
      />
      <polygon
        points={mainDiamond}
        fill={borderColor}
        fillOpacity={0.15}
        stroke={borderColor}
        strokeWidth={selected ? 3 : 2}
      />

      {/* Connection lines for 3D effect */}
      <line
        x1={centerX}
        y1={centerY - diamondHeight / 2}
        x2={centerX + offset * 2}
        y2={centerY - diamondHeight / 2 + offset * 2}
        stroke={borderColor}
        strokeWidth={1}
        strokeOpacity={0.3}
      />
      <line
        x1={centerX + diamondWidth / 2}
        y1={centerY}
        x2={centerX + diamondWidth / 2 + offset * 2}
        y2={centerY + offset * 2}
        stroke={borderColor}
        strokeWidth={1}
        strokeOpacity={0.3}
      />

      {/* Key patterns inside */}
      {keyPatterns && keyPatterns.length > 0 && (
        <KeyPatternText
          patterns={keyPatterns}
          x={centerX - diamondWidth / 4}
          y={centerY - 12}
          color={color}
        />
      )}

      {/* Name label */}
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

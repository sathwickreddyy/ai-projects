import type { PaletteItem as PaletteItemType } from '../../types'

interface PaletteItemProps {
  item: PaletteItemType
  categoryColor: string
}

// Simple SVG icon for each symbol type
function getMiniIcon(symbolType: string) {
  // Return a simple 20x20 SVG shape outline
  switch (symbolType) {
    case 'circle':
    case 'actor':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'rounded_rect':
    case 'component':
    case 'container':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'hexagon':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M10 2 L17 6 L17 14 L10 18 L3 14 L3 6 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'cloud':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path
            d="M14 10c1.1 0 2 .9 2 2s-.9 2-2 2H6c-1.7 0-3-1.3-3-3s1.3-3 3-3c0-2.2 1.8-4 4-4 1.9 0 3.5 1.3 3.9 3.1.4-.1.7-.1 1.1-.1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )
    case 'horizontal_cylinder':
    case 'database':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <ellipse cx="10" cy="10" rx="7" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'diamond_stack':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M10 2 L18 10 L10 18 L2 10 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <rect x="3" y="3" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
  }
}

export function PaletteItem({ item, categoryColor }: PaletteItemProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('symbol_type', item.symbol_type)
    e.dataTransfer.setData('symbol_data', JSON.stringify(item))
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderLeft: `3px solid ${categoryColor}`,
        backgroundColor: '#0f1117',
        cursor: 'grab',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#161b27'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#0f1117'
      }}
    >
      {/* Mini icon */}
      <div style={{ color: categoryColor, display: 'flex', flexShrink: 0 }}>
        {getMiniIcon(item.symbol_type)}
      </div>

      {/* Label and description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: '#c9d1e0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.label}
        </div>
        {item.description && (
          <div
            style={{
              fontSize: 8,
              color: '#6b7280',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.description}
          </div>
        )}
      </div>
    </div>
  )
}

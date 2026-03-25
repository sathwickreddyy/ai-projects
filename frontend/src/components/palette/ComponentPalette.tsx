import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { getPalette } from '../../api/client'
import { PaletteItem as PaletteItemComponent } from './PaletteItem'
import type { PaletteItem } from '../../types'

const CATEGORY_COLORS: Record<string, string> = {
  messaging: '#f97316',
  database: '#3b82f6',
  api: '#22c55e',
  infra: '#6366f1',
  client: '#06b6d4',
  compute: '#8b5cf6',
  storage: '#ec4899',
}

const TAG_FILTERS = ['messaging', 'database', 'api', 'infra', 'client']

export function ComponentPalette() {
  const paletteItems = useAppStore((s) => s.paletteItems)
  const setPaletteItems = useAppStore((s) => s.setPaletteItems)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Fetch palette items on mount
    getPalette()
      .then((items) => {
        setPaletteItems(items)
      })
      .catch((err) => {
        console.error('Failed to load palette:', err)
      })
  }, [setPaletteItems])

  const toggleFilter = (filter: string) => {
    const newFilters = new Set(activeFilters)
    if (newFilters.has(filter)) {
      newFilters.delete(filter)
    } else {
      newFilters.add(filter)
    }
    setActiveFilters(newFilters)
  }

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category)
    } else {
      newCollapsed.add(category)
    }
    setCollapsedCategories(newCollapsed)
  }

  // Filter items
  const filteredItems = paletteItems.filter((item) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !item.label.toLowerCase().includes(query) &&
        !item.symbol_type.toLowerCase().includes(query) &&
        !(item.description || '').toLowerCase().includes(query)
      ) {
        return false
      }
    }

    // Tag filter
    if (activeFilters.size > 0) {
      if (!activeFilters.has(item.category)) {
        return false
      }
    }

    return true
  })

  // Group by category
  const groupedItems: Record<string, PaletteItem[]> = {}
  filteredItems.forEach((item) => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = []
    }
    groupedItems[item.category].push(item)
  })

  return (
    <div
      style={{
        height: '100%',
        backgroundColor: '#0f1117',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Search input */}
      <div style={{ padding: 12 }}>
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#161b27',
            border: '1px solid #1e2430',
            borderRadius: 4,
            color: '#c9d1e0',
            padding: '8px 12px',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Tag filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: '0 12px 12px',
        }}
      >
        {TAG_FILTERS.map((tag) => {
          const isActive = activeFilters.has(tag)
          const color = CATEGORY_COLORS[tag] || '#6b7280'
          return (
            <button
              key={tag}
              onClick={() => toggleFilter(tag)}
              style={{
                backgroundColor: isActive ? color : '#161b27',
                color: isActive ? 'white' : '#6b7280',
                border: `1px solid ${isActive ? color : '#1e2430'}`,
                borderRadius: 12,
                padding: '4px 10px',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Scrollable item list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {Object.entries(groupedItems).map(([category, items]) => {
          const isCollapsed = collapsedCategories.has(category)
          const categoryColor = CATEGORY_COLORS[category] || '#6b7280'

          return (
            <div key={category}>
              {/* Category header */}
              <div
                onClick={() => toggleCategory(category)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#161b27',
                  borderBottom: '1px solid #1e2430',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: categoryColor,
                  }}
                >
                  {category} ({items.length})
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#6b7280',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                >
                  ▼
                </div>
              </div>

              {/* Items */}
              {!isCollapsed &&
                items.map((item) => (
                  <PaletteItemComponent key={item.symbol_type} item={item} categoryColor={categoryColor} />
                ))}
            </div>
          )
        })}

        {filteredItems.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: '#6b7280',
              fontSize: 12,
            }}
          >
            No components found
          </div>
        )}
      </div>
    </div>
  )
}

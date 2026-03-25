import React, { useEffect, useState } from 'react'
import { getComponents } from '../../api/client'
import { useAppStore } from '../../stores/appStore'
import type { ComponentLibraryItem } from '../../types'

export default function ComponentPalette() {
  const { components, setComponents } = useAppStore()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    getComponents().then(setComponents).catch(console.error)
  }, [setComponents])

  const handleDragStart = (e: React.DragEvent, item: ComponentLibraryItem) => {
    e.dataTransfer.setData('component-name', item.name)
    e.dataTransfer.effectAllowed = 'move'
  }

  const filtered = Object.entries(components).reduce<typeof components>(
    (acc, [cat, items]) => {
      const matched = items.filter(
        i =>
          !search ||
          i.name.toLowerCase().includes(search.toLowerCase())
      )
      if (matched.length) acc[cat] = matched
      return acc
    },
    {}
  )

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '8px 0',
        background: '#0f1117',
      }}
    >
      <div style={{ padding: '6px 12px 8px' }}>
        <input
          placeholder="Search components..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            background: '#161b27',
            border: '1px solid #1e2430',
            borderRadius: 6,
            color: '#c9d1e0',
            padding: '5px 10px',
            fontSize: 12,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {Object.entries(filtered).map(([category, items]) => (
        <div key={category}>
          <button
            onClick={() => setCollapsed(c => ({ ...c, [category]: !c[category] }))}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: '6px 12px',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            {collapsed[category] ? '▶' : '▼'} {category}
          </button>

          {!collapsed[category] &&
            items.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={e => handleDragStart(e, item)}
                style={{
                  margin: '2px 8px',
                  padding: '8px 10px',
                  background: item.color + '11',
                  border: `1px solid ${item.color}33`,
                  borderLeft: `3px solid ${item.color}`,
                  borderRadius: 6,
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ color: '#c9d1e0', fontSize: 12, fontWeight: 500 }}>{item.name}</span>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}

import { CATEGORY_STYLES, type Category } from './nodes/nodeStyles'

interface PaletteItem {
  type: string
  label: string
  category: Category
  defaultData: Record<string, unknown>
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'api_service',
    label: 'API Service',
    category: 'api',
    defaultData: { label: 'Service', endpoints: [] },
  },
  {
    type: 'kafka_broker',
    label: 'Kafka Broker',
    category: 'messaging',
    defaultData: { label: 'Kafka', topics: [{ name: 'events', partitions: 3 }] },
  },
  {
    type: 'redis_cache',
    label: 'Redis',
    category: 'cache',
    defaultData: { label: 'Redis', role: 'Cache', details: [] },
  },
  {
    type: 'postgres_db',
    label: 'PostgreSQL',
    category: 'database',
    defaultData: { label: 'PostgreSQL', tables: [] },
  },
  {
    type: 'client_actor',
    label: 'Client',
    category: 'client',
    defaultData: { label: 'Client', details: [] },
  },
  {
    type: 'external_service',
    label: 'External',
    category: 'external',
    defaultData: { label: 'External Service' },
  },
  {
    type: 'container_box',
    label: 'Container',
    category: 'infrastructure',
    defaultData: { label: 'Service Group', children: [] },
  },
]

function onDragStart(event: React.DragEvent, item: PaletteItem) {
  event.dataTransfer.setData('application/arch-node-type', item.type)
  event.dataTransfer.setData('application/arch-node-data', JSON.stringify(item.defaultData))
  event.dataTransfer.effectAllowed = 'move'
}

export function Palette() {
  return (
    <div className="w-56 bg-[#161b27] border-r border-[#1e2430] h-full overflow-y-auto">
      <div className="p-3 border-b border-[#1e2430]">
        <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
          Components
        </span>
      </div>
      <div className="p-2 space-y-1">
        {PALETTE_ITEMS.map((item) => {
          const s = CATEGORY_STYLES[item.category]
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded cursor-grab active:cursor-grabbing hover:bg-[#1e2430] transition-colors"
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ background: s.border, opacity: 0.8 }}
              />
              <span className="text-[12px] font-medium" style={{ color: s.text }}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

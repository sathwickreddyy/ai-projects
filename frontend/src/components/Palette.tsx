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

      {/* Connection guide */}
      <div className="p-3 border-t border-[#1e2430]">
        <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
          Connections
        </span>
        <div className="mt-2 space-y-1.5 text-[10px] text-[#6b7280] leading-relaxed">
          <div className="flex items-start gap-1.5">
            <span className="text-[#34d399] mt-0.5">+</span>
            <span>Drag from a <span className="text-[#c9d1e0]">dot</span> on one node to a dot on another</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#f87171] mt-0.5">-</span>
            <span>Click edge + <span className="text-[#c9d1e0]">Backspace</span> to delete</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#60a5fa] mt-0.5">~</span>
            <span>Drag edge endpoint to <span className="text-[#c9d1e0]">reconnect</span></span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-[#a78bfa] mt-0.5">*</span>
            <span>Click node + drag <span className="text-[#c9d1e0]">corners</span> to resize</span>
          </div>
        </div>
      </div>
    </div>
  )
}

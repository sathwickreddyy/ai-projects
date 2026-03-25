import { useAppStore } from '../../stores/appStore'

export function StatusBar() {
  const nodes = useAppStore((s) => s.nodes)
  const edges = useAppStore((s) => s.edges)
  const flows = useAppStore((s) => s.flows)
  const zoom = useAppStore((s) => s.zoom)

  return (
    <div
      style={{
        height: 32,
        backgroundColor: '#161b27',
        borderTop: '1px solid #1e2430',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontSize: 10,
        color: '#475569',
        gap: 16,
      }}
    >
      <div>
        {nodes.length} nodes • {edges.length} edges • {flows.length} flows
      </div>
      <div style={{ flex: 1 }} />
      <div>ELK layered</div>
      <div>Zoom: {Math.round(zoom * 100)}%</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#22c55e',
          }}
        />
        Saved
      </div>
    </div>
  )
}

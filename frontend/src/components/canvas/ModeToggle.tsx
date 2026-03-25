import { useAppStore } from '../../stores/appStore'
import { useLayout } from '../../hooks/useLayout'

const MODES = [
  { id: 'stage_diagram', label: 'Stage' },
  { id: 'animated_flow', label: 'Flow' },
  { id: 'step_by_step', label: 'Steps' },
  { id: 'mental_map', label: 'Map' },
] as const

type ModeId = typeof MODES[number]['id']

export function ModeToggle() {
  const currentDiagram = useAppStore((s) => s.currentDiagram)
  const setCurrentDiagram = useAppStore((s) => s.setCurrentDiagram)
  const { autoArrange } = useLayout()

  const currentMode = currentDiagram?.mode ?? 'stage_diagram'

  const handleModeClick = async (modeId: ModeId) => {
    if (!currentDiagram || modeId === currentMode) return

    // Update diagram mode in store
    const updatedDiagram = {
      ...currentDiagram,
      mode: modeId,
    }
    setCurrentDiagram(updatedDiagram)

    // Trigger auto-arrange based on the new mode
    if (modeId === 'mental_map') {
      // Force-directed layout for mental map
      await autoArrange({ algorithm: 'force' })
    } else if (modeId === 'stage_diagram') {
      // Layered layout for stage diagram
      await autoArrange({ algorithm: 'layered' })
    }
    // Other modes (animated_flow, step_by_step) don't trigger layout changes
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: '4px',
        padding: '4px',
        backgroundColor: '#161b27',
        border: '1px solid #1e2430',
        borderRadius: '8px',
      }}
    >
      {MODES.map((mode) => {
        const isActive = mode.id === currentMode
        return (
          <button
            key={mode.id}
            onClick={() => handleModeClick(mode.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: isActive ? '#2563eb' : 'transparent',
              color: isActive ? 'white' : '#6b7280',
              fontWeight: isActive ? 'bold' : 'normal',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#1e2430'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}

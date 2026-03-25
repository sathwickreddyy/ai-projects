import React from 'react'
import { useAppStore } from '../../stores/appStore'
import { applyPreference } from '../../api/client'

const MODES = [
  { id: 'stage_diagram', label: 'Stage', icon: '⬛' },
  { id: 'animated_flow', label: 'Flow', icon: '▶' },
  { id: 'step_by_step', label: 'Steps', icon: '1️⃣' },
  { id: 'mental_map', label: 'Map', icon: '🗺' },
]

export default function ModeToggle() {
  const { activeArchitecture, setActiveArchitecture, setIsGenerating } = useAppStore()
  const currentMode = activeArchitecture?.mode ?? 'stage_diagram'

  const handleMode = async (mode: string) => {
    if (!activeArchitecture || mode === currentMode) return
    setIsGenerating(true)
    try {
      const updated = await applyPreference(activeArchitecture.id, `switch to ${mode} mode`)
      setActiveArchitecture({
        ...activeArchitecture,
        ...updated,
        id: updated.architecture_id ?? activeArchitecture.id,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 4,
        background: '#161b27',
        border: '1px solid #1e2430',
        borderRadius: 8,
        padding: 4,
        zIndex: 10,
      }}
    >
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={() => handleMode(m.id)}
          title={m.label}
          style={{
            background: currentMode === m.id ? '#2563eb' : 'transparent',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            color: currentMode === m.id ? '#fff' : '#6b7280',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: currentMode === m.id ? 700 : 400,
          }}
        >
          {m.icon} {m.label}
        </button>
      ))}
    </div>
  )
}

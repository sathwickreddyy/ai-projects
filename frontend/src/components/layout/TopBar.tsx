import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/appStore'
import { useLayout } from '../../hooks/useLayout'

const STACK_COLORS: Record<string, string> = {
  fastapi: '#059669',
  kafka: '#ef4444',
  redis: '#f97316',
  postgres: '#3b82f6',
  mongodb: '#22c55e',
  docker: '#0ea5e9',
  kubernetes: '#6366f1',
}

export function TopBar() {
  const navigate = useNavigate()
  const currentSession = useAppStore((s) => s.currentSession)
  const currentDiagram = useAppStore((s) => s.currentDiagram)
  const sessions = useAppStore((s) => s.sessions)
  const authMode = useAppStore((s) => s.authMode)
  const setIsReviewing = useAppStore((s) => s.setIsReviewing)
  const { autoArrange } = useLayout()

  const detectedStack = (currentSession?.context?.detected_stack as string[]) || []
  const isModified = currentDiagram?.version ? currentDiagram.version > 1 : false

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sessionId = e.target.value
    if (sessionId) {
      navigate(`/session/${sessionId}`)
    }
  }

  const handleReview = () => {
    setIsReviewing(true)
  }

  const handleAutoArrange = () => {
    autoArrange()
  }

  return (
    <div
      style={{
        height: 48,
        backgroundColor: '#161b27',
        borderBottom: '1px solid #1e2430',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }}
    >
      {/* Brand */}
      <div
        style={{
          color: '#7c9adb',
          fontWeight: 'bold',
          fontSize: 14,
        }}
      >
        arch-viewer
      </div>

      {/* Session selector */}
      <select
        value={currentSession?.id ?? ''}
        onChange={handleSessionChange}
        style={{
          backgroundColor: '#0f1117',
          border: '1px solid #1e2430',
          borderRadius: 4,
          color: '#c9d1e0',
          padding: '4px 8px',
          fontSize: 12,
          minWidth: 200,
          cursor: 'pointer',
        }}
      >
        {!currentSession && <option value="">No session</option>}
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.title}
          </option>
        ))}
      </select>

      {/* Stack badges */}
      {detectedStack.length > 0 && (
        <div style={{ display: 'flex', gap: 6 }}>
          {detectedStack.map((tech) => (
            <div
              key={tech}
              style={{
                backgroundColor: STACK_COLORS[tech.toLowerCase()] || '#6b7280',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {tech}
            </div>
          ))}
        </div>
      )}

      {/* Flex spacer */}
      <div style={{ flex: 1 }} />

      {/* Version indicator */}
      {currentDiagram && (
        <div
          style={{
            backgroundColor: '#1e2430',
            color: '#6b7280',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 11,
          }}
        >
          v{currentDiagram.version}
          {isModified && ' (modified)'}
        </div>
      )}

      {/* Auth indicator */}
      {authMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#6b7280',
            fontSize: 11,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
            }}
          />
          {authMode === 'cli' ? 'CLI auth' : 'API auth'}
        </div>
      )}

      {/* Review button */}
      <button
        onClick={handleReview}
        style={{
          backgroundColor: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Review
      </button>

      {/* Auto-arrange button */}
      <button
        onClick={handleAutoArrange}
        style={{
          backgroundColor: '#1e2430',
          color: '#c9d1e0',
          border: '1px solid #2d3748',
          borderRadius: 4,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Auto-arrange
      </button>
    </div>
  )
}

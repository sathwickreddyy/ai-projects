import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useSession } from '../../hooks/useSession'
import { useLayout } from '../../hooks/useLayout'
import { useCanvas } from '../../hooks/useCanvas'
import { useAppStore } from '../../stores/appStore'
import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { ComponentPalette } from '../palette/ComponentPalette'
import { Canvas } from '../canvas/Canvas'
import { ReviewModal } from '../review/ReviewModal'

export function AppShell() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { loadSession } = useSession()
  const { autoArrange } = useLayout()
  const { fitToContent } = useCanvas()
  const nodes = useAppStore((s) => s.nodes)
  const arrangedRef = useRef<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [sessionId])

  // Auto-arrange and fit viewport after nodes load for a new session
  useEffect(() => {
    if (nodes.length > 0 && sessionId && arrangedRef.current !== sessionId) {
      arrangedRef.current = sessionId
      autoArrange().then(() => {
        // Small delay for store to update after ELK layout
        setTimeout(fitToContent, 50)
      })
    }
  }, [nodes.length, sessionId])

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 320px',
          gridTemplateRows: '48px 1fr 32px',
          height: '100vh',
          backgroundColor: '#0f1117',
          overflow: 'hidden',
        }}
      >
        {/* Top Bar (spans all 3 columns) */}
        <div style={{ gridColumn: '1 / 4', gridRow: 1 }}>
          <TopBar />
        </div>

        {/* Left Panel - Component Palette */}
        <div
          style={{
            gridColumn: 1,
            gridRow: 2,
            borderRight: '1px solid #1e2430',
            overflow: 'hidden',
          }}
        >
          <ComponentPalette />
        </div>

        {/* Center - Canvas */}
        <div
          style={{
            gridColumn: 2,
            gridRow: 2,
            overflow: 'hidden',
          }}
        >
          <Canvas />
        </div>

        {/* Right Panel - Placeholder for now */}
        <div
          style={{
            gridColumn: 3,
            gridRow: 2,
            borderLeft: '1px solid #1e2430',
            backgroundColor: '#0f1117',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontSize: 12,
          }}
        >
          Right Panel (Task 7.2)
        </div>

        {/* Status Bar (spans all 3 columns) */}
        <div style={{ gridColumn: '1 / 4', gridRow: 3 }}>
          <StatusBar />
        </div>
      </div>

      {/* Review Modal - renders on top when active */}
      <ReviewModal />
    </>
  )
}

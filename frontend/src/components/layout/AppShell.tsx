import { TopBar } from './TopBar'
import { StatusBar } from './StatusBar'
import { ComponentPalette } from '../palette/ComponentPalette'
import { Canvas } from '../canvas/Canvas'
import { ReviewModal } from '../review/ReviewModal'

export function AppShell() {
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

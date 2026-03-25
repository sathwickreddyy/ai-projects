import React from 'react'
import TopBar from './TopBar'
import ComponentPalette from '../palette/ComponentPalette'
import ArchCanvas from '../canvas/ArchCanvas'
import RightPanel from '../panels/RightPanel'

export default function AppShell() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 320px',
        gridTemplateRows: '48px 1fr',
        height: '100vh',
        overflow: 'hidden',
        background: '#0f1117',
      }}
    >
      <div style={{ gridColumn: '1 / -1' }}>
        <TopBar />
      </div>
      <div style={{ overflow: 'hidden', borderRight: '1px solid #1e2430' }}>
        <ComponentPalette />
      </div>
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <ArchCanvas />
      </div>
      <div style={{ overflow: 'hidden', borderLeft: '1px solid #1e2430' }}>
        <RightPanel />
      </div>
    </div>
  )
}

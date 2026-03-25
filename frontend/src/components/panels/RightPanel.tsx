import React, { useState } from 'react'
import ReviewPanel from './ReviewPanel'
import PreferencesPanel from './PreferencesPanel'
import SkillsPanel from './SkillsPanel'
import ExportPanel from './ExportPanel'

const TABS = ['Review', 'Preferences', 'Skills', 'Export'] as const
type Tab = typeof TABS[number]

export default function RightPanel() {
  const [active, setActive] = useState<Tab>('Review')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f1117' }}>
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e2430',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: active === tab ? '2px solid #2563eb' : '2px solid transparent',
              color: active === tab ? '#e2e8f0' : '#6b7280',
              fontSize: 12,
              fontWeight: active === tab ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {active === 'Review' && <ReviewPanel />}
        {active === 'Preferences' && <PreferencesPanel />}
        {active === 'Skills' && <SkillsPanel />}
        {active === 'Export' && <ExportPanel />}
      </div>
    </div>
  )
}

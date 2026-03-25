import { useState } from 'react'
import { SkillAdaptForm } from './SkillAdaptForm'
import { SkillTree } from './SkillTree'

export function AdaptPanel() {
  const [activeSubTab, setActiveSubTab] = useState<'adapt' | 'tree'>('adapt')

  const subTabs = [
    { key: 'adapt' as const, label: 'Adapt Skill' },
    { key: 'tree' as const, label: 'Skill Tree' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex border-b border-[#1e2430] bg-[#0f1117]">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
              activeSubTab === tab.key
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {activeSubTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubTab === 'adapt' && <SkillAdaptForm />}
        {activeSubTab === 'tree' && <SkillTree />}
      </div>
    </div>
  )
}

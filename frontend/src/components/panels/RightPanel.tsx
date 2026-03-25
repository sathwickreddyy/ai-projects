import { useAppStore } from '../../stores/appStore'
import { SuggestionsPanel } from './SuggestionsPanel'
import { FollowUpPanel } from './FollowUpPanel'
import { AdaptPanel } from './AdaptPanel'

export function RightPanel() {
  const rightPanelTab = useAppStore((state) => state.rightPanelTab)
  const setRightPanelTab = useAppStore((state) => state.setRightPanelTab)

  const tabs = [
    { key: 'suggestions' as const, label: 'Suggestions' },
    { key: 'followup' as const, label: 'Follow-up' },
    { key: 'adapt' as const, label: 'Adapt' },
  ]

  return (
    <div className="flex flex-col h-full bg-[#0f1117] border-l border-[#1e2430]">
      {/* Tab bar */}
      <div className="flex border-b border-[#1e2430]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRightPanelTab(tab.key)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              rightPanelTab === tab.key
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {rightPanelTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#60a5fa]" />
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'suggestions' && <SuggestionsPanel />}
        {rightPanelTab === 'followup' && <FollowUpPanel />}
        {rightPanelTab === 'adapt' && <AdaptPanel />}
      </div>
    </div>
  )
}

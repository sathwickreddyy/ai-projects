import { SuggestionsPanel } from '../panels/SuggestionsPanel'
import { FollowUpPanel } from '../panels/FollowUpPanel'

export function SuggestionsStep() {
  return (
    <div className="grid grid-cols-2 gap-6 p-6 h-full overflow-hidden">
      {/* Left: Suggestions */}
      <div className="flex flex-col overflow-hidden">
        <h2 className="text-lg font-semibold text-white mb-4">
          Missing Components
        </h2>
        <div className="flex-1 overflow-y-auto">
          <SuggestionsPanel />
        </div>
      </div>

      {/* Right: Follow-up Questions */}
      <div className="flex flex-col overflow-hidden">
        <h2 className="text-lg font-semibold text-white mb-4">
          Follow-up Questions
        </h2>
        <div className="flex-1 overflow-y-auto">
          <FollowUpPanel />
        </div>
      </div>
    </div>
  )
}

import { AdaptPanel } from '../panels/AdaptPanel'

export function AdaptStep() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">
          Skill Adaptation
        </h2>
        <p className="text-sm text-gray-400">
          Review the suggested adaptations and save learnings back to the skill system.
          These will help improve future diagram generations.
        </p>
      </div>
      <div className="h-[calc(80vh-120px)] overflow-hidden">
        <AdaptPanel />
      </div>
    </div>
  )
}

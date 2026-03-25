import { useEffect, useState } from 'react'
import { useSkills } from '../../hooks/useSkills'

export function SkillTree() {
  const { skillTree, loadSkillTree, isLoading } = useSkills()
  const [expandedSubskills, setExpandedSubskills] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSkillTree()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Loading skill tree...</p>
      </div>
    )
  }

  if (!skillTree || !skillTree.skills || Object.keys(skillTree.skills).length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>No skills available</p>
      </div>
    )
  }

  const toggleSubskill = (subskillKey: string) => {
    setExpandedSubskills((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(subskillKey)) {
        newSet.delete(subskillKey)
      } else {
        newSet.add(subskillKey)
      }
      return newSet
    })
  }

  return (
    <div className="p-4 space-y-4">
      {Object.entries(skillTree.skills).map(([skillKey, skill]) => (
        <div key={skillKey} className="space-y-2">
          {/* Root node (skill name) */}
          <div className="bg-[#161b27] border border-[#1e2430] rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white">{skill.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{skill.description}</p>
          </div>

          {/* Vertical connector + subskills */}
          <div className="ml-6 border-l-2 border-[#1e2430] pl-6 space-y-3">
            {Object.entries(skill.subskills).map(([subskillKey, subskill]) => {
              const isExpanded = expandedSubskills.has(subskillKey)
              const archCount = subskill.adaptations?.length || 0

              return (
                <div key={subskillKey} className="relative">
                  {/* Horizontal connector line */}
                  <div className="absolute left-[-24px] top-6 w-6 h-0.5 bg-[#1e2430]" />

                  {/* Subskill card */}
                  <div className="bg-[#161b27] border border-[#1e2430] rounded-lg overflow-hidden">
                    {/* Header */}
                    <button
                      onClick={() => toggleSubskill(subskillKey)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#1e2430] transition-colors text-left"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: getColorForSubskill(subskillKey),
                        }}
                      />
                      <span className="flex-1 font-medium text-white">
                        {subskill.name}
                      </span>
                      {archCount > 0 && (
                        <span className="px-2 py-1 bg-[#7c3aed] text-white text-xs font-medium rounded">
                          {archCount}
                        </span>
                      )}
                      <span className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>

                    {/* Keywords (always visible) */}
                    {subskill.keywords.length > 0 && (
                      <div className="px-4 pb-3">
                        <div className="flex flex-wrap gap-1">
                          {subskill.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="px-2 py-0.5 bg-[#fbbf24] text-[#0f1117] text-xs font-medium rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-[#1e2430] pt-3">
                        {/* Decisions */}
                        {subskill.decisions.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                              Decisions
                            </h4>
                            <ul className="space-y-1">
                              {subskill.decisions.map((decision, i) => (
                                <li key={i} className="text-sm text-gray-300">
                                  • {decision}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Adaptations */}
                        {subskill.adaptations && subskill.adaptations.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                              Recent Adaptations
                            </h4>
                            <div className="space-y-2">
                              {subskill.adaptations.slice(0, 3).map((adaptation) => (
                                <div
                                  key={adaptation.id}
                                  className="p-2 bg-[#0f1117] rounded text-xs"
                                >
                                  <p className="text-gray-400 mb-1">
                                    {new Date(adaptation.timestamp).toLocaleDateString()}
                                  </p>
                                  <p className="text-gray-300">
                                    {adaptation.decisions.join(', ')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Create new subskill button */}
          <div className="ml-6 border-l-2 border-[#1e2430] pl-6">
            <button className="w-full px-4 py-2 text-sm font-medium text-gray-400 hover:text-white border border-dashed border-[#1e2430] hover:border-[#7c3aed] rounded-lg transition-colors">
              + Create new subskill
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper function to get a color based on subskill key
function getColorForSubskill(subskillKey: string): string {
  const colors = [
    '#60a5fa', // blue
    '#a78bfa', // purple
    '#f59e0b', // orange
    '#ec4899', // pink
    '#10b981', // green
    '#06b6d4', // cyan
    '#8b5cf6', // violet
    '#f97316', // orange
  ]

  // Simple hash function to get consistent color per subskill
  let hash = 0
  for (let i = 0; i < subskillKey.length; i++) {
    hash = subskillKey.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

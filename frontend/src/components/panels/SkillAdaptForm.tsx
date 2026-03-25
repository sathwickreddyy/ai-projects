import { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useSkills } from '../../hooks/useSkills'

export function SkillAdaptForm() {
  const reviewResult = useAppStore((state) => state.reviewResult)
  const currentSession = useAppStore((state) => state.currentSession)
  const { skillTree, saveAdaptation, previewImpact } = useSkills()

  const [targetSubskill, setTargetSubskill] = useState('')
  const [selectedDecisions, setSelectedDecisions] = useState<Set<number>>(new Set())
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [impactPreview, setImpactPreview] = useState<any>(null)
  const [isLoadingImpact, setIsLoadingImpact] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Pre-populate keywords from detected stack
  useEffect(() => {
    if (currentSession?.context?.detected_stack) {
      setKeywords(currentSession.context.detected_stack as string[])
    }
  }, [currentSession])

  // Pre-select all decisions by default
  useEffect(() => {
    if (reviewResult?.suggested_adaptations) {
      const allIndices = new Set(
        reviewResult.suggested_adaptations.map((_, i) => i)
      )
      setSelectedDecisions(allIndices)
    }
  }, [reviewResult])

  if (!reviewResult) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Run a review to see adaptation suggestions</p>
      </div>
    )
  }

  const adaptations = reviewResult.suggested_adaptations || []

  if (adaptations.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>No adaptation suggestions available</p>
      </div>
    )
  }

  // Get all subskills from skill tree
  const subskillOptions: string[] = []
  if (skillTree?.skills) {
    Object.values(skillTree.skills).forEach((skill) => {
      Object.keys(skill.subskills).forEach((subskillKey) => {
        subskillOptions.push(subskillKey)
      })
    })
  }

  const toggleDecision = (index: number) => {
    setSelectedDecisions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()])
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handlePreviewImpact = async () => {
    setIsLoadingImpact(true)
    try {
      const selectedDecisionTexts = Array.from(selectedDecisions).map(
        (i) => adaptations[i].decision
      )
      const impact = await previewImpact({
        target_subskill: targetSubskill,
        decisions: selectedDecisionTexts,
        keywords,
      })
      setImpactPreview(impact)
    } catch (err) {
      console.error('Failed to preview impact:', err)
    } finally {
      setIsLoadingImpact(false)
    }
  }

  const handleApprove = async () => {
    if (!targetSubskill) {
      alert('Please select a target subskill')
      return
    }

    setIsSaving(true)
    try {
      const selectedDecisionTexts = Array.from(selectedDecisions).map(
        (i) => adaptations[i].decision
      )
      await saveAdaptation(targetSubskill, selectedDecisionTexts, keywords)
      alert('Adaptation saved successfully!')
    } catch (err) {
      console.error('Failed to save adaptation:', err)
      alert('Failed to save adaptation')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    setSelectedDecisions(new Set())
    setTargetSubskill('')
    setImpactPreview(null)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Target subskill */}
      <div className="bg-[#161b27] border border-[#1e2430] rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Target:
        </label>
        <select
          value={targetSubskill}
          onChange={(e) => setTargetSubskill(e.target.value)}
          className="w-full px-3 py-2 bg-[#0f1117] border border-[#1e2430] rounded text-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="">Select or type new subskill...</option>
          {subskillOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {!subskillOptions.includes(targetSubskill) && targetSubskill && (
          <p className="mt-2 text-xs text-yellow-400">
            New subskill will be created: {targetSubskill}
          </p>
        )}
      </div>

      {/* Learned decisions */}
      <div className="bg-[#161b27] border border-[#1e2430] rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Learned Decisions
        </h3>
        <div className="space-y-2">
          {adaptations.map((adaptation, index) => (
            <label
              key={index}
              className="flex items-start gap-3 p-3 rounded hover:bg-[#1e2430] cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedDecisions.has(index)}
                onChange={() => toggleDecision(index)}
                className="mt-0.5 w-4 h-4 text-[#7c3aed] bg-[#0f1117] border-gray-600 rounded focus:ring-[#7c3aed] focus:ring-2"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{adaptation.decision}</p>
                <p className="text-xs text-gray-400 mt-1">{adaptation.reason}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Trigger keywords */}
      <div className="bg-[#161b27] border border-[#1e2430] rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Trigger Keywords
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-1 px-2 py-1 bg-[#fbbf24] text-[#0f1117] text-xs font-medium rounded"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="hover:text-red-600 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Add keyword..."
            className="flex-1 px-3 py-2 bg-[#0f1117] border border-[#1e2430] rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
          <button
            onClick={addKeyword}
            className="px-3 py-2 text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Impact preview */}
      <div className="bg-[#161b27] border border-[#1e2430] rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Impact Preview
        </h3>
        {impactPreview ? (
          <div className="p-3 bg-[#1e3a5f] border border-[#60a5fa] rounded">
            <p className="text-sm text-white">
              {impactPreview.impacts?.join(', ') || 'No impact information available'}
            </p>
            {impactPreview.affected_keywords && (
              <p className="text-xs text-gray-300 mt-2">
                Affected keywords: {impactPreview.affected_keywords.join(', ')}
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={handlePreviewImpact}
            disabled={!targetSubskill || selectedDecisions.size === 0 || isLoadingImpact}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-[#60a5fa] hover:bg-[#3b82f6] disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
          >
            {isLoadingImpact ? 'Loading...' : 'Preview Impact'}
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={!targetSubskill || selectedDecisions.size === 0 || isSaving}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
        >
          {isSaving ? 'Saving...' : `Approve & Save to :${targetSubskill || '...'}`}
        </button>
        <button
          onClick={handleDiscard}
          className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  )
}

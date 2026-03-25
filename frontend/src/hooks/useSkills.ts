import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { getSkillTree, saveAdaptation as apiSaveAdaptation, previewImpact as apiPreviewImpact } from '../api/client'

export function useSkills() {
  const store = useAppStore()
  const [isLoading, setIsLoading] = useState(false)

  const loadSkillTree = async () => {
    setIsLoading(true)
    try {
      const tree = await getSkillTree()
      store.setSkillTree(tree)
    } catch (err) {
      console.error('Failed to load skill tree:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveAdaptation = async (
    targetSubskill: string,
    decisions: string[],
    keywords: string[]
  ) => {
    try {
      await apiSaveAdaptation({
        target_subskill: targetSubskill,
        decisions,
        keywords,
      })
      // Reload the skill tree after saving
      await loadSkillTree()
    } catch (err) {
      console.error('Failed to save adaptation:', err)
      throw err
    }
  }

  const previewImpact = async (adaptation: Record<string, unknown>) => {
    try {
      const result = await apiPreviewImpact(adaptation)
      return result
    } catch (err) {
      console.error('Failed to preview impact:', err)
      throw err
    }
  }

  return {
    skillTree: store.skillTree,
    isLoading,
    loadSkillTree,
    saveAdaptation,
    previewImpact,
  }
}

import { useCallback, useEffect, useState } from 'react'
import { createProject, generateArchitecture, listArchitectures, listProjects, listVolumeDirs } from '../api/client'
import { useAppStore } from '../stores/appStore'
import type { Project } from '../types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [volumeDirs, setVolumeDirs] = useState<{ name: string; path: string }[]>([])
  const [loading, setLoading] = useState(false)
  const { setActiveProject, setActiveArchitecture, setIsGenerating } = useAppStore()

  useEffect(() => {
    listProjects().then(setProjects).catch(console.error)
    listVolumeDirs().then(setVolumeDirs).catch(console.error)
  }, [])

  const selectProject = useCallback(
    async (dirName: string) => {
      const existing = projects.find(p => p.name === dirName)
      if (existing) {
        setActiveProject(existing)
        const archs = await listArchitectures(existing.id)
        if (archs.length > 0) {
          setActiveArchitecture(archs[0])
        }
        return
      }

      setIsGenerating(true)
      try {
        const project = await createProject({ name: dirName, path: dirName })
        setProjects(prev => [project, ...prev])
        setActiveProject(project)

        const arch = await generateArchitecture(project.id)
        setActiveArchitecture({
          ...arch,
          id: arch.architecture_id,
          project_id: project.id,
          name: arch.title ?? 'Default',
          version: 1,
          is_active: true,
          layout: {},
        })
      } finally {
        setIsGenerating(false)
      }
    },
    [projects, setActiveProject, setActiveArchitecture, setIsGenerating]
  )

  return { projects, volumeDirs, loading, selectProject }
}

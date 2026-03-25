import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useProjects } from '../../hooks/useProjects'
import { generateArchitecture, exportArchitecture } from '../../api/client'

const STACK_COLORS: Record<string, string> = {
  fastapi: '#059669',
  kafka: '#ef4444',
  redis: '#f97316',
  postgres: '#3b82f6',
  mongodb: '#22c55e',
  docker: '#0ea5e9',
  kubernetes: '#6366f1',
  rabbitmq: '#f97316',
  celery: '#84cc16',
  elasticsearch: '#f59e0b',
  grpc: '#7c3aed',
  graphql: '#e11d48',
  websocket: '#16a34a',
}

export default function TopBar() {
  const { volumeDirs, selectProject } = useProjects()
  const { activeProject, activeArchitecture, isGenerating, setIsGenerating, setActiveArchitecture } =
    useAppStore()
  const [showExport, setShowExport] = useState(false)

  const detected = activeProject?.metadata?.detected ?? {}
  const activeStack = Object.entries(detected)
    .filter(([, v]) => v)
    .map(([k]) => k)

  const handleGenerate = async () => {
    if (!activeProject) return
    setIsGenerating(true)
    try {
      const arch = await generateArchitecture(activeProject.id)
      setActiveArchitecture({
        ...arch,
        id: arch.architecture_id,
        project_id: activeProject.id,
        name: (arch as { title?: string }).title ?? 'Default',
        version: 1,
        is_active: true,
        layout: {},
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      style={{
        height: 48,
        background: '#161b27',
        borderBottom: '1px solid #1e2430',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
      }}
    >
      <span style={{ color: '#7c9adb', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
        arch-platform
      </span>

      <select
        style={{
          background: '#0f1117',
          color: '#c9d1e0',
          border: '1px solid #1e2430',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 13,
          cursor: 'pointer',
        }}
        value={activeProject?.name ?? ''}
        onChange={e => e.target.value && selectProject(e.target.value)}
      >
        <option value="">Select project...</option>
        {volumeDirs.map(d => (
          <option key={d.name} value={d.name}>
            {d.name}
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
        {activeStack.map(tech => (
          <span
            key={tech}
            style={{
              background: (STACK_COLORS[tech] ?? '#6b7280') + '22',
              color: STACK_COLORS[tech] ?? '#6b7280',
              border: `1px solid ${STACK_COLORS[tech] ?? '#6b7280'}44`,
              borderRadius: 12,
              padding: '1px 8px',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      {activeArchitecture && (
        <span
          style={{
            color: '#4b5563',
            fontSize: 11,
            background: '#1e2430',
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {activeArchitecture.mode}
        </span>
      )}

      <button
        onClick={handleGenerate}
        disabled={!activeProject || isGenerating}
        style={{
          background: isGenerating ? '#374151' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 13,
          cursor: isGenerating ? 'wait' : 'pointer',
          fontWeight: 600,
          opacity: !activeProject ? 0.5 : 1,
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  )
}

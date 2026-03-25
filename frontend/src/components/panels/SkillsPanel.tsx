import React, { useEffect, useState } from 'react'
import { listSkills, createSkill, toggleSkill, deleteSkill } from '../../api/client'
import { useAppStore } from '../../stores/appStore'

export default function SkillsPanel() {
  const { skills, setSkills } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', prompt_snippet: '', triggers: '' })

  useEffect(() => {
    listSkills().then(setSkills).catch(console.error)
  }, [setSkills])

  const handleToggle = async (id: string) => {
    const updated = await toggleSkill(id)
    setSkills(skills.map(s => (s.id === id ? updated : s)))
  }

  const handleDelete = async (id: string) => {
    await deleteSkill(id)
    setSkills(skills.filter(s => s.id !== id))
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    const created = await createSkill({
      name: form.name,
      description: form.description,
      prompt_snippet: form.prompt_snippet,
      trigger_pattern: form.triggers ? form.triggers.split(',').map(t => t.trim()) : [],
    })
    setSkills([created, ...skills])
    setShowForm(false)
    setForm({ name: '', description: '', prompt_snippet: '', triggers: '' })
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          background: '#1e2430',
          color: '#c9d1e0',
          border: '1px solid #374151',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 12,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        + Add Skill
      </button>

      {showForm && (
        <div style={{ background: '#161b27', border: '1px solid #1e2430', borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(['name', 'description', 'prompt_snippet', 'triggers'] as const).map(field => (
            <input
              key={field}
              placeholder={field === 'triggers' ? 'triggers (comma-separated)' : field.replace('_', ' ')}
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              style={{ background: '#0f1117', border: '1px solid #1e2430', borderRadius: 4, color: '#c9d1e0', padding: '5px 8px', fontSize: 11 }}
            />
          ))}
          <button
            onClick={handleCreate}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 0', fontSize: 11, cursor: 'pointer' }}
          >
            Save
          </button>
        </div>
      )}

      {skills.map(skill => (
        <div
          key={skill.id}
          style={{
            background: '#161b27',
            border: `1px solid ${skill.active ? '#065f46' : '#1e2430'}`,
            borderRadius: 6,
            padding: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>{skill.name}</span>
                {skill.approved_by === 'system' && (
                  <span style={{ background: '#1e3a5f', color: '#60a5fa', fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                    built-in
                  </span>
                )}
              </div>
              <p style={{ color: '#6b7280', fontSize: 11, margin: '2px 0' }}>{skill.description}</p>
              {skill.trigger_pattern?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {skill.trigger_pattern.map(t => (
                    <span key={t} style={{ background: '#1e2430', color: '#9ca3af', fontSize: 9, padding: '1px 5px', borderRadius: 3 }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
              <button
                onClick={() => handleToggle(skill.id)}
                style={{
                  background: skill.active ? '#065f46' : '#374151',
                  color: skill.active ? '#34d399' : '#6b7280',
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                {skill.active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => handleDelete(skill.id)}
                style={{ background: 'none', color: '#4b5563', border: 'none', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

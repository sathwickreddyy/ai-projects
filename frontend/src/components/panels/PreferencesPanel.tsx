import React, { useEffect, useState } from 'react'
import { getPreferences, upsertPreference, applyPreference } from '../../api/client'
import { useAppStore } from '../../stores/appStore'

export default function PreferencesPanel() {
  const { preferences, setPreferences, activeArchitecture, setActiveArchitecture } = useAppStore()
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')
  const [instruction, setInstruction] = useState('')
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    getPreferences().then(prefs => {
      setPreferences(prefs)
      setEditValues(Object.fromEntries(Object.entries(prefs).map(([k, v]) => [k, JSON.stringify(v)])))
    }).catch(console.error)
  }, [setPreferences])

  const handleSave = async (key: string) => {
    try {
      const value = JSON.parse(editValues[key])
      await upsertPreference({ key, value })
      setPreferences({ ...preferences, [key]: value })
    } catch (e) {
      console.error('Invalid JSON value', e)
    }
  }

  const handleAdd = async () => {
    if (!newKey.trim()) return
    try {
      const value = JSON.parse(newVal)
      await upsertPreference({ key: newKey, value })
      setPreferences({ ...preferences, [newKey]: value })
      setEditValues(prev => ({ ...prev, [newKey]: newVal }))
      setNewKey('')
      setNewVal('')
    } catch (e) {
      console.error('Invalid JSON value', e)
    }
  }

  const handleApplyToDiagram = async () => {
    if (!activeArchitecture || !instruction.trim()) return
    setApplying(true)
    try {
      const updated = await applyPreference(activeArchitecture.id, instruction)
      setActiveArchitecture({ ...activeArchitecture, ...updated, id: updated.architecture_id ?? activeArchitecture.id })
      setInstruction('')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Global preferences</p>

      {Object.entries(preferences).map(([key]) => (
        <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: 11, minWidth: 120 }}>{key}</span>
          <input
            value={editValues[key] ?? ''}
            onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
            style={{
              flex: 1,
              background: '#161b27',
              border: '1px solid #1e2430',
              borderRadius: 4,
              color: '#c9d1e0',
              padding: '3px 6px',
              fontSize: 11,
            }}
          />
          <button
            onClick={() => handleSave(key)}
            style={{
              background: '#1e2430',
              color: '#c9d1e0',
              border: 'none',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      ))}

      <div style={{ borderTop: '1px solid #1e2430', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>+ Add preference</p>
        <input
          placeholder="key"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          style={{ background: '#161b27', border: '1px solid #1e2430', borderRadius: 4, color: '#c9d1e0', padding: '4px 8px', fontSize: 11 }}
        />
        <input
          placeholder="value (JSON)"
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
          style={{ background: '#161b27', border: '1px solid #1e2430', borderRadius: 4, color: '#c9d1e0', padding: '4px 8px', fontSize: 11 }}
        />
        <button
          onClick={handleAdd}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 0', fontSize: 11, cursor: 'pointer' }}
        >
          Add
        </button>
      </div>

      <div style={{ borderTop: '1px solid #1e2430', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Apply to diagram</p>
        <input
          placeholder="e.g. make all nodes dark blue"
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          style={{ background: '#161b27', border: '1px solid #1e2430', borderRadius: 4, color: '#c9d1e0', padding: '4px 8px', fontSize: 11 }}
        />
        <button
          onClick={handleApplyToDiagram}
          disabled={applying || !activeArchitecture}
          style={{
            background: applying ? '#374151' : '#7c3aed',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '5px 0',
            fontSize: 11,
            cursor: applying ? 'wait' : 'pointer',
          }}
        >
          {applying ? 'Applying...' : 'Apply'}
        </button>
      </div>
    </div>
  )
}

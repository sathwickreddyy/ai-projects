import React, { useState } from 'react'
import { toPng } from 'html-to-image'
import { exportArchitecture } from '../../api/client'
import { useAppStore } from '../../stores/appStore'

export default function ExportPanel() {
  const { activeArchitecture } = useAppStore()
  const [mermaidText, setMermaidText] = useState('')
  const [copied, setCopied] = useState(false)

  const handlePng = async () => {
    const el = document.getElementById('arch-canvas-wrapper')
    if (!el) return
    const dataUrl = await toPng(el, {
      filter: (node: HTMLElement) => {
        if (node.classList?.contains('react-flow__controls')) return false
        if (node.classList?.contains('react-flow__minimap')) return false
        return true
      },
    })
    const link = document.createElement('a')
    link.download = 'architecture.png'
    link.href = dataUrl
    link.click()
  }

  const handleMermaid = async () => {
    if (!activeArchitecture) return
    const text = await exportArchitecture(activeArchitecture.id, 'mermaid')
    setMermaidText(text)
  }

  const handleDrawio = async () => {
    if (!activeArchitecture) return
    const xml = await exportArchitecture(activeArchitecture.id, 'drawio')
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'architecture.drawio'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(mermaidText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cardStyle: React.CSSProperties = {
    background: '#161b27',
    border: '1px solid #1e2430',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🖼</span>
          <div>
            <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700, margin: 0 }}>PNG Image</p>
            <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Screenshot of the canvas</p>
          </div>
        </div>
        <button
          onClick={handlePng}
          disabled={!activeArchitecture}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
        >
          Download PNG
        </button>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📝</span>
          <div>
            <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700, margin: 0 }}>Mermaid</p>
            <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Embed in Markdown docs</p>
          </div>
        </div>
        <button
          onClick={handleMermaid}
          disabled={!activeArchitecture}
          style={{ background: '#1e2430', color: '#c9d1e0', border: '1px solid #374151', borderRadius: 6, padding: '6px 0', fontSize: 12, cursor: 'pointer' }}
        >
          Generate Mermaid
        </button>
        {mermaidText && (
          <div style={{ position: 'relative' }}>
            <textarea
              readOnly
              value={mermaidText}
              rows={6}
              style={{
                width: '100%',
                background: '#0a0d14',
                border: '1px solid #1e2430',
                borderRadius: 4,
                color: '#9ca3af',
                fontSize: 10,
                fontFamily: 'monospace',
                padding: '6px 8px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                background: copied ? '#065f46' : '#1e2430',
                color: copied ? '#34d399' : '#6b7280',
                border: 'none',
                borderRadius: 3,
                padding: '2px 6px',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📐</span>
          <div>
            <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700, margin: 0 }}>draw.io</p>
            <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Open in diagrams.net</p>
          </div>
        </div>
        <button
          onClick={handleDrawio}
          disabled={!activeArchitecture}
          style={{ background: '#1e2430', color: '#c9d1e0', border: '1px solid #374151', borderRadius: 6, padding: '6px 0', fontSize: 12, cursor: 'pointer' }}
        >
          Download draw.io
        </button>
      </div>
    </div>
  )
}

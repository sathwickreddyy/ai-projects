import React, { useRef, useState } from 'react'
import { useClaudeReview } from '../../hooks/useClaudeReview'
import { approveSkill } from '../../api/client'
import { useAppStore } from '../../stores/appStore'

const SEVERITY_ICON: Record<string, string> = {
  critical: '🔴',
  warning: '🟡',
  suggestion: '💡',
}

export default function ReviewPanel() {
  const { startReview, reviewChunks, reviewResult, isReviewing } = useClaudeReview()
  const { setSkills, skills } = useAppStore()
  const [question, setQuestion] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleReview = () => {
    startReview(question || undefined)
  }

  const handleApproveSkill = async () => {
    if (!reviewResult?.new_skill_suggestion) return
    const s = reviewResult.new_skill_suggestion
    const created = await approveSkill({
      name: s.name,
      description: s.description,
      prompt_snippet: s.prompt_snippet,
      trigger_pattern: s.trigger_pattern,
    })
    setSkills([created, ...skills])
  }

  const scoreColor = reviewResult
    ? reviewResult.score < 5
      ? '#ef4444'
      : reviewResult.score < 8
      ? '#eab308'
      : '#22c55e'
    : '#6b7280'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 12, gap: 8, overflowY: 'auto' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Ask Claude about this architecture..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleReview()}
          style={{
            flex: 1,
            background: '#161b27',
            border: '1px solid #1e2430',
            borderRadius: 6,
            color: '#c9d1e0',
            padding: '6px 10px',
            fontSize: 12,
          }}
        />
        <button
          onClick={handleReview}
          disabled={isReviewing}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12,
            cursor: isReviewing ? 'wait' : 'pointer',
            fontWeight: 600,
          }}
        >
          Review
        </button>
      </div>

      {isReviewing && (
        <div
          ref={scrollRef}
          style={{
            background: '#0a0d14',
            border: '1px solid #1e2430',
            borderRadius: 6,
            padding: 10,
            fontSize: 11,
            color: '#6b7280',
            fontFamily: 'monospace',
            maxHeight: 180,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          <span style={{ color: '#22c55e' }}>● </span>
          {reviewChunks.join('')}
        </div>
      )}

      {reviewResult && !isReviewing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: scoreColor,
              }}
            >
              {reviewResult.score}/10
            </span>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>{reviewResult.summary}</p>
          </div>

          {reviewResult.issues?.map((issue, i) => (
            <div
              key={i}
              style={{
                background: '#161b27',
                border: '1px solid #1e2430',
                borderRadius: 6,
                padding: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span>{SEVERITY_ICON[issue.severity] ?? '💡'}</span>
                <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{issue.message}</span>
              </div>
              {issue.fix && (
                <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0 22px' }}>{issue.fix}</p>
              )}
            </div>
          ))}

          {reviewResult.missing_components?.map((mc, i) => (
            <div
              key={i}
              style={{
                background: '#161b27',
                border: '1px solid #374151',
                borderRadius: 6,
                padding: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{mc.name}</span>
                <p style={{ color: '#6b7280', fontSize: 11, margin: '2px 0 0' }}>{mc.reason}</p>
              </div>
            </div>
          ))}

          {reviewResult.new_skill_suggestion && (
            <div
              style={{
                background: '#0f2027',
                border: '1px solid #065f46',
                borderRadius: 6,
                padding: 10,
              }}
            >
              <p style={{ color: '#34d399', fontSize: 12, fontWeight: 700, margin: '0 0 4px' }}>
                Skill Suggestion
              </p>
              <p style={{ color: '#9ca3af', fontSize: 11, margin: '0 0 8px' }}>
                {reviewResult.new_skill_suggestion.name}: {reviewResult.new_skill_suggestion.description}
              </p>
              <button
                onClick={handleApproveSkill}
                style={{
                  background: '#065f46',
                  color: '#34d399',
                  border: '1px solid #059669',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Approve as Skill
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

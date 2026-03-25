import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { streamReview } from '../api/client'
import type { ReviewFeedback } from '../types'

export function useAI() {
  const [isReviewing, setIsReviewing] = useState(false)
  const store = useAppStore()

  const startReview = (diagramId: string, question?: string) => {
    // Reset review state
    store.resetReview()
    setIsReviewing(true)
    store.setIsReviewing(true)

    let fullText = ''

    streamReview(
      diagramId,
      question,
      (chunk: string) => {
        fullText += chunk
        store.appendReviewChunk(chunk)
      },
      () => {
        // Parse the accumulated text as JSON
        try {
          const result = JSON.parse(fullText) as ReviewFeedback
          store.setReviewResult(result)
        } catch (err) {
          console.error('Failed to parse review result:', err)
          // Set a fallback result
          store.setReviewResult({
            summary: 'Review completed but failed to parse result.',
            score: 0,
            issues: [],
            missing_components: [],
            follow_up_questions: [],
            suggested_adaptations: [],
          })
        }
        setIsReviewing(false)
        store.setIsReviewing(false)
      }
    )
  }

  return {
    startReview,
    isReviewing,
    reviewResult: store.reviewResult,
  }
}

import { useCallback } from 'react'
import { streamReview } from '../api/client'
import { useAppStore } from '../stores/appStore'
import type { ReviewFeedback } from '../types'

export function useClaudeReview() {
  const {
    activeArchitecture,
    appendReviewChunk,
    setReviewResult,
    setIsReviewing,
    resetReview,
    reviewChunks,
    reviewResult,
    isReviewing,
  } = useAppStore()

  const startReview = useCallback(
    (question?: string) => {
      if (!activeArchitecture) return
      resetReview()
      setIsReviewing(true)

      const accumulated: string[] = []

      streamReview(
        activeArchitecture.id,
        question,
        (chunk) => {
          accumulated.push(chunk)
          appendReviewChunk(chunk)
        },
        (_reviewId) => {
          const full = accumulated.join('')
          try {
            const parsed = JSON.parse(full) as ReviewFeedback
            setReviewResult(parsed)
          } catch {
            setReviewResult(null)
          }
          setIsReviewing(false)
        }
      )
    },
    [activeArchitecture, resetReview, setIsReviewing, appendReviewChunk, setReviewResult]
  )

  return { startReview, reviewChunks, reviewResult, isReviewing }
}

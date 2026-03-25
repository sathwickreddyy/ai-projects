import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { submitFollowup } from '../../api/client'

export function FollowUpPanel() {
  const reviewResult = useAppStore((state) => state.reviewResult)
  const currentDiagram = useAppStore((state) => state.currentDiagram)
  const setReviewResult = useAppStore((state) => state.setReviewResult)

  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!reviewResult) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Run a review to see follow-up questions</p>
      </div>
    )
  }

  const questions = reviewResult.follow_up_questions || []

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>No follow-up questions</p>
      </div>
    )
  }

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }))
  }

  const handleSubmit = async () => {
    if (!currentDiagram) return

    // Build Q&A history
    const qaHistory = questions.map((q, index) => ({
      q: q.question,
      a: answers[index] || '',
    }))

    setIsSubmitting(true)
    try {
      const updatedResult = await submitFollowup(currentDiagram.id, qaHistory)
      setReviewResult(updatedResult)
      // Clear answers after successful submission
      setAnswers({})
    } catch (err) {
      console.error('Failed to submit follow-up answers:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const allAnswered = questions.every((_, index) => answers[index])

  return (
    <div className="p-4 space-y-4">
      {questions.map((question, index) => (
        <div
          key={index}
          className="bg-[#161b27] border border-[#1e2430] rounded-lg p-4"
        >
          <h3 className="font-semibold text-white mb-3">{question.question}</h3>

          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className="flex items-center gap-3 p-2 rounded hover:bg-[#1e2430] cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={option}
                  checked={answers[index] === option}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="w-4 h-4 text-[#60a5fa] bg-[#0f1117] border-gray-600 focus:ring-[#60a5fa] focus:ring-2"
                />
                <span className="text-sm text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || isSubmitting}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-[#60a5fa] hover:bg-[#3b82f6] disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answers'}
      </button>
    </div>
  )
}

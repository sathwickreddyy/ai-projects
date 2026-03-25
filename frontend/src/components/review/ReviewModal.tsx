import { useAppStore } from '../../stores/appStore'
import { ScoreSummary } from './ScoreSummary'
import { DiffView } from './DiffView'
import { SuggestionsStep } from './SuggestionsStep'
import { AdaptStep } from './AdaptStep'

export function ReviewModal() {
  const isReviewing = useAppStore((state) => state.isReviewing)
  const reviewStep = useAppStore((state) => state.reviewStep)
  const setReviewStep = useAppStore((state) => state.setReviewStep)
  const resetReview = useAppStore((state) => state.resetReview)

  if (!isReviewing) return null

  const steps = [
    { number: 1, name: 'Score & Summary', component: ScoreSummary },
    { number: 2, name: 'Side-by-Side Diff', component: DiffView },
    { number: 3, name: 'Suggestions & Follow-up', component: SuggestionsStep },
    { number: 4, name: 'Skill Adaptation', component: AdaptStep },
  ]

  const currentStep = steps.find((s) => s.number === reviewStep) || steps[0]
  const StepComponent = currentStep.component

  const handlePrevious = () => {
    if (reviewStep > 1) {
      setReviewStep(reviewStep - 1)
    }
  }

  const handleNext = () => {
    if (reviewStep < steps.length) {
      setReviewStep(reviewStep + 1)
    }
  }

  const handleExit = () => {
    resetReview()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0f]/95 backdrop-blur-sm"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Header with Step Indicator */}
      <div className="flex-shrink-0 border-b border-[#1e2430] bg-[#0f1117]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-400">
                Step {reviewStep} of {steps.length}
              </span>
              <span className="text-lg font-semibold text-white">
                {currentStep.name}
              </span>
            </div>
            <button
              onClick={handleExit}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Exit Review
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step.number <= reviewStep ? 'bg-[#7c3aed]' : 'bg-[#1e2430]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        <StepComponent />
      </div>

      {/* Navigation Footer */}
      <div className="flex-shrink-0 border-t border-[#1e2430] bg-[#0f1117] px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={reviewStep === 1}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1e2430] hover:bg-[#2a3040] disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={reviewStep === steps.length}
            className="px-4 py-2 text-sm font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            {reviewStep === steps.length ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

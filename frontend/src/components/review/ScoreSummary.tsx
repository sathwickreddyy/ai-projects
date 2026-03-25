import { useAppStore } from '../../stores/appStore'

export function ScoreSummary() {
  const reviewResult = useAppStore((state) => state.reviewResult)
  const reviewChunks = useAppStore((state) => state.reviewChunks)

  // If review is streaming and not yet complete
  if (reviewChunks.length > 0 && !reviewResult) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#22c55e] animate-pulse" />
          <h2 className="text-lg font-semibold text-white">Streaming review...</h2>
        </div>
        <div
          className="bg-[#161b27] border border-[#1e2430] rounded-lg p-4 font-mono text-sm text-gray-300 overflow-y-auto"
          style={{ maxHeight: '60vh' }}
        >
          {reviewChunks.join('')}
        </div>
      </div>
    )
  }

  // If review is complete
  if (reviewResult) {
    const score = reviewResult.score ?? 0
    const scoreColor = score < 5 ? '#ef4444' : score < 8 ? '#eab308' : '#22c55e'

    return (
      <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        {/* Score Display */}
        <div className="text-center space-y-3">
          <div
            className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4"
            style={{ borderColor: scoreColor }}
          >
            <span className="text-6xl font-bold" style={{ color: scoreColor }}>
              {score}
            </span>
          </div>
          <p className="text-sm text-gray-400">out of 10</p>
        </div>

        {/* Summary */}
        <div className="bg-[#161b27] border border-[#1e2430] rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
          <p className="text-gray-300 leading-relaxed">{reviewResult.summary}</p>
        </div>

        {/* Issues */}
        {reviewResult.issues && reviewResult.issues.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Issues</h3>
            {reviewResult.issues.map((issue, index) => {
              const severityIcon =
                issue.severity === 'critical'
                  ? '🔴'
                  : issue.severity === 'warning'
                  ? '🟡'
                  : '💡'

              return (
                <div
                  key={index}
                  className="bg-[#161b27] border border-[#1e2430] rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{severityIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase">
                          {issue.severity}
                        </span>
                        {issue.component && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-xs text-gray-500">
                              {issue.component}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{issue.message}</p>
                      {issue.fix && (
                        <div className="mt-2 p-3 bg-[#0f1117] rounded border border-[#1e2430]">
                          <p className="text-xs text-gray-400 mb-1">Suggested fix:</p>
                          <p className="text-sm text-[#22c55e]">{issue.fix}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Default: no review yet
  return (
    <div className="p-6 text-center text-gray-400">
      <p>No review available</p>
    </div>
  )
}

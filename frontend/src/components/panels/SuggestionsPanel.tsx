import { useAppStore } from '../../stores/appStore'
import type { ArchNode } from '../../types'

export function SuggestionsPanel() {
  const reviewResult = useAppStore((state) => state.reviewResult)
  const nodes = useAppStore((state) => state.nodes)
  const setNodes = useAppStore((state) => state.setNodes)

  if (!reviewResult) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Run a review to see suggestions</p>
      </div>
    )
  }

  const suggestions = reviewResult.missing_components || []

  if (suggestions.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>No suggestions available</p>
      </div>
    )
  }

  const handleAddToDiagram = (suggestion: typeof suggestions[0]) => {
    // Create a new node with auto-generated ID
    const newNode: ArchNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol_type: suggestion.symbol_type,
      name: suggestion.name,
      position: { x: 100, y: 100 }, // Default position, will be auto-arranged
      props: {},
    }

    // Add to store
    setNodes([...nodes, newNode])

    // TODO: Trigger auto-arrange for the new node
    // This will be handled by the layout engine
  }

  const handleDismiss = (index: number) => {
    // Remove the suggestion from the review result
    const updatedResult = {
      ...reviewResult,
      missing_components: suggestions.filter((_, i) => i !== index),
    }
    useAppStore.getState().setReviewResult(updatedResult)
  }

  return (
    <div className="p-4 space-y-3">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="bg-[#161b27] border border-[#1e2430] rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            {/* Icon/shape preview */}
            <div className="flex-shrink-0 mt-1">
              <div
                className="w-8 h-8 rounded-full"
                style={{
                  backgroundColor: getColorForSymbolType(suggestion.symbol_type),
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white mb-1">
                {suggestion.name}
              </h3>
              <p className="text-sm text-gray-400 mb-3">{suggestion.reason}</p>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToDiagram(suggestion)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-[#22c55e] hover:bg-[#16a34a] rounded transition-colors"
                >
                  + Add to Diagram
                </button>
                <button
                  onClick={() => handleDismiss(index)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper function to get a color based on symbol type
function getColorForSymbolType(symbolType: string): string {
  const colors: Record<string, string> = {
    service: '#60a5fa',
    database: '#a78bfa',
    queue: '#f59e0b',
    cache: '#ec4899',
    api: '#10b981',
    frontend: '#06b6d4',
    backend: '#8b5cf6',
    external: '#6366f1',
  }

  return colors[symbolType.toLowerCase()] || '#64748b'
}

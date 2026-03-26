import { useParams } from 'react-router-dom'

export function Canvas() {
  const { sessionId } = useParams<{ sessionId: string }>()
  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <p className="text-[#6b7280]">Loading session {sessionId}...</p>
    </div>
  )
}

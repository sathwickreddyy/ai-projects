let socket: WebSocket | null = null

export function connectReviewWS(
  diagramId: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  question?: string,
): void {
  const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:18000'
  socket = new WebSocket(`${wsUrl}/ws/review/${diagramId}`)

  socket.onopen = () => {
    socket?.send(JSON.stringify({ question }))
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.chunk) onChunk(data.chunk)
      if (data.done) onDone()
      if (data.error) console.error('WS error:', data.error)
    } catch {
      // ignore
    }
  }

  socket.onerror = (err) => {
    console.error('WebSocket error:', err)
  }

  socket.onclose = () => {
    socket = null
  }
}

export function disconnectReviewWS(): void {
  if (socket) {
    socket.close()
    socket = null
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  reconnectEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './nodes'
import { Palette } from './Palette'
import { getSession, patchSession } from '../api'
import type { ArchSession } from '../types'

function CanvasInner() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [error, setError] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId)
      .then((data) => {
        setNodes(data.data.nodes as Node[])
        setEdges(data.data.edges as Edge[])
      })
      .catch((err) => setError(err.message))
  }, [sessionId, setNodes, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({
        ...connection,
        id: `e-${connection.source}-${connection.sourceHandle ?? 'out'}-${connection.target}-${connection.targetHandle ?? 'in'}`,
      }, eds))
    },
    [setEdges]
  )

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds))
    },
    [setEdges]
  )

  // Drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/arch-node-type')
      if (!type) return

      const dataStr = event.dataTransfer.getData('application/arch-node-data')
      const data = dataStr ? JSON.parse(dataStr) : { label: type }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position,
        data,
      }

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes]
  )

  // Save state
  const saveState = useCallback(() => {
    if (!sessionId) return
    const payload = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type ?? 'api_service',
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
        ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}),
        ...(e.label ? { label: String(e.label) } : {}),
        ...(e.animated ? { animated: e.animated } : {}),
        ...(e.style ? { style: e.style } : {}),
      })),
    }
    patchSession(sessionId, { data: payload }).catch(
      (err) => console.error('Failed to save:', err)
    )
  }, [sessionId, nodes, edges])

  const onNodeDragStop = useCallback(() => saveState(), [saveState])

  // Debounced save on edge changes
  useEffect(() => {
    if (!sessionId || edges.length === 0) return
    const timer = setTimeout(saveState, 500)
    return () => clearTimeout(timer)
  }, [edges, sessionId, saveState])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0f]">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-48px)]">
      <Palette />
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onNodeDragStop={onNodeDragStop}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={['Backspace', 'Delete']}
          defaultEdgeOptions={{
            style: { stroke: '#4b5563', strokeWidth: 2 },
            type: 'smoothstep',
          }}
          style={{ background: '#0a0a0f' }}
        >
          <Background color="#1e2430" gap={20} />
          <Controls
            style={{ background: '#161b27', border: '1px solid #1e2430', borderRadius: 8 }}
          />
          <MiniMap
            style={{ background: '#161b27', border: '1px solid #1e2430' }}
            nodeColor="#1e2430"
            maskColor="rgba(0,0,0,0.5)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}

export function Canvas() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<ArchSession | null>(null)

  // Load session title for top bar
  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId).then(setSession).catch(() => {})
  }, [sessionId])

  return (
    <div className="h-screen w-screen bg-[#0a0a0f]">
      <div className="h-12 bg-[#161b27] border-b border-[#1e2430] flex items-center px-4 gap-3">
        <span className="text-[#7c9adb] font-bold text-sm">arch-viewer</span>
        {session && (
          <>
            <span className="text-[#c9d1e0] text-sm">{session.title}</span>
            <div className="flex gap-1.5 ml-2">
              {session.detected_stack.map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1e2430] text-[#9ca3af]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <ReactFlowProvider>
        <CanvasInner />
      </ReactFlowProvider>
    </div>
  )
}

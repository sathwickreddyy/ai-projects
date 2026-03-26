import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './nodes'
import { getSession, patchSession } from '../api'
import type { ArchSession } from '../types'

export function Canvas() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<ArchSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId)
      .then((data) => {
        setSession(data)
        setNodes(data.data.nodes as Node[])
        setEdges(data.data.edges as Edge[])
      })
      .catch((err) => setError(err.message))
  }, [sessionId, setNodes, setEdges])

  const onNodeDragStop = useCallback(
    () => {
      if (!sessionId) return
      // Save current state as plain objects for the backend JSONB column
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
          ...(e.label ? { label: String(e.label) } : {}),
          ...(e.animated ? { animated: e.animated } : {}),
          ...(e.style ? { style: e.style } : {}),
        })),
      }
      patchSession(sessionId, { data: payload }).catch(
        (err) => console.error('Failed to save positions:', err)
      )
    },
    [sessionId, nodes, edges]
  )

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

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

      <div className="h-[calc(100vh-48px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
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

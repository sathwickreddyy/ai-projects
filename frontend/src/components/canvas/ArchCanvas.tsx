import React, { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  addEdge,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useAppStore } from '../../stores/appStore'
import { useArchitecture } from '../../hooks/useArchitecture'
import { patchArchitecture } from '../../api/client'
import type { ArchEdge, ArchNode } from '../../types'
import CustomNode from './CustomNode'
import CustomEdge from './CustomEdge'
import ModeToggle from './ModeToggle'

const nodeTypes = { custom: CustomNode }
const edgeTypes = { custom: CustomEdge }

const CANVAS_W = 1200
const CANVAS_H = 700

function toRFNode(node: ArchNode, components: Record<string, { color: string; border_color: string }[]>): Node {
  const allComponents = Object.values(components).flat()
  const comp = allComponents.find(c => (c as { name?: string }).name === node.component_name)
  return {
    id: node.id,
    type: 'custom',
    position: { x: node.x * CANVAS_W, y: node.y * CANVAS_H },
    data: {
      ...node,
      color: (comp as { color?: string } | undefined)?.color,
      border_color: (comp as { border_color?: string } | undefined)?.border_color,
    },
  }
}

function toRFEdge(edge: ArchEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'custom',
    data: edge,
    animated: edge.animated,
  }
}

export default function ArchCanvas() {
  const { activeArchitecture, components, updateNodes, updateEdges } = useAppStore()
  const { saveNodes, saveEdges } = useArchitecture()
  const { screenToFlowPosition } = useReactFlow()

  const rfNodes = useMemo(
    () => (activeArchitecture?.nodes ?? []).map(n => toRFNode(n, components)),
    [activeArchitecture?.nodes, components]
  )
  const rfEdges = useMemo(
    () => (activeArchitecture?.edges ?? []).map(toRFEdge),
    [activeArchitecture?.edges]
  )

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!activeArchitecture) return
      const updated = activeArchitecture.nodes.map(n =>
        n.id === node.id
          ? { ...n, x: node.position.x / CANVAS_W, y: node.position.y / CANVAS_H }
          : n
      )
      saveNodes(updated)
    },
    [activeArchitecture, saveNodes]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!activeArchitecture) return
      const newEdge: ArchEdge = {
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source ?? '',
        target: connection.target ?? '',
        label: '',
        animated: false,
      }
      const updated = [...activeArchitecture.edges, newEdge]
      saveEdges(updated)
    },
    [activeArchitecture, saveEdges]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const componentName = e.dataTransfer.getData('component-name')
      if (!componentName || !activeArchitecture) return

      const allComponents = Object.values(components).flat()
      const comp = allComponents.find(c => c.name === componentName)
      if (!comp) return

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const newNode: ArchNode = {
        id: `${componentName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        label: componentName,
        icon: comp.icon,
        description: '',
        type: comp.category as ArchNode['type'],
        layer: 1,
        x: position.x / CANVAS_W,
        y: position.y / CANVAS_H,
        component_name: componentName,
      }
      saveNodes([...activeArchitecture.nodes, newNode])
    },
    [activeArchitecture, components, screenToFlowPosition, saveNodes]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  if (!activeArchitecture) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#374151',
          fontSize: 14,
        }}
      >
        Select a project to generate an architecture diagram
      </div>
    )
  }

  return (
    <div id="arch-canvas-wrapper" style={{ height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} color="#1e2430" />
        <Controls />
        <MiniMap
          style={{ background: '#0f1117' }}
          nodeColor="#1e2430"
        />
      </ReactFlow>
      <ModeToggle />
    </div>
  )
}

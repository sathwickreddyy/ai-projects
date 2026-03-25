import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AppState } from '../types'

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Session
      currentSession: null,
      currentDiagram: null,
      sessions: [],

      // Canvas
      nodes: [],
      edges: [],
      flows: [],
      selectedNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 },

      // Palette
      paletteItems: [],

      // Review
      isReviewing: false,
      reviewStep: 1,
      reviewChunks: [],
      reviewResult: null,

      // Skills
      skillTree: null,

      // UI
      isGenerating: false,
      rightPanelTab: 'suggestions',

      // Auth
      authMode: null,
      authConfigured: false,

      // Actions
      setCurrentSession: (session) => set({ currentSession: session }),
      setCurrentDiagram: (diagram) => {
        if (diagram) {
          set({
            currentDiagram: diagram,
            nodes: diagram.nodes,
            edges: diagram.edges,
            flows: diagram.flows,
          })
        } else {
          set({ currentDiagram: null, nodes: [], edges: [], flows: [] })
        }
      },
      setSessions: (sessions) => set({ sessions }),
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setFlows: (flows) => set({ flows }),
      updateNodePosition: (id, x, y) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, position: { x, y } } : n
          ),
        })),
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),
      setZoom: (zoom) => set({ zoom }),
      setPan: (pan) => set({ pan }),
      setPaletteItems: (items) => set({ paletteItems: items }),
      setIsReviewing: (val) => set({ isReviewing: val }),
      setReviewStep: (step) => set({ reviewStep: step }),
      appendReviewChunk: (chunk) =>
        set((state) => ({ reviewChunks: [...state.reviewChunks, chunk] })),
      setReviewResult: (result) => set({ reviewResult: result }),
      resetReview: () =>
        set({ reviewChunks: [], reviewResult: null, isReviewing: false, reviewStep: 1 }),
      setSkillTree: (tree) => set({ skillTree: tree }),
      setIsGenerating: (val) => set({ isGenerating: val }),
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
      setAuthMode: (mode) => set({ authMode: mode }),
      setAuthConfigured: (val) => set({ authConfigured: val }),
    }),
    { name: 'arch-viewer' }
  )
)

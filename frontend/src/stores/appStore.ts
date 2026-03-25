import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AppState, ArchEdge, ArchNode, Architecture, ComponentsByCategory, Project, ReviewFeedback, Skill } from '../types'

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      activeProject: null,
      activeArchitecture: null,
      components: {},
      skills: [],
      preferences: {},
      isGenerating: false,
      reviewChunks: [],
      reviewResult: null,
      isReviewing: false,

      setActiveProject: (project: Project | null) => set({ activeProject: project }),
      setActiveArchitecture: (arch: Architecture | null) => set({ activeArchitecture: arch }),

      updateNodes: (nodes: ArchNode[]) =>
        set(state => ({
          activeArchitecture: state.activeArchitecture
            ? { ...state.activeArchitecture, nodes }
            : null,
        })),

      updateEdges: (edges: ArchEdge[]) =>
        set(state => ({
          activeArchitecture: state.activeArchitecture
            ? { ...state.activeArchitecture, edges }
            : null,
        })),

      setComponents: (components: ComponentsByCategory) => set({ components }),
      setSkills: (skills: Skill[]) => set({ skills }),
      setPreferences: (preferences: Record<string, unknown>) => set({ preferences }),

      appendReviewChunk: (chunk: string) =>
        set(state => ({ reviewChunks: [...state.reviewChunks, chunk] })),

      setReviewResult: (reviewResult: ReviewFeedback | null) => set({ reviewResult }),
      setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),
      setIsReviewing: (isReviewing: boolean) => set({ isReviewing }),

      resetReview: () => set({ reviewChunks: [], reviewResult: null, isReviewing: false }),
    }),
    { name: 'arch-platform' }
  )
)

export const CATEGORY_STYLES = {
  messaging: {
    border: '#f87171',
    fill: 'rgba(248,113,113,0.15)',
    headerFill: 'rgba(239,68,68,0.25)',
    text: '#fca5a5',
    accent: '#ef4444',
  },
  database: {
    border: '#60a5fa',
    fill: 'rgba(96,165,250,0.15)',
    headerFill: 'rgba(59,130,246,0.25)',
    text: '#93c5fd',
    accent: '#3b82f6',
  },
  cache: {
    border: '#f87171',
    fill: 'rgba(248,113,113,0.15)',
    headerFill: 'rgba(239,68,68,0.25)',
    text: '#fca5a5',
    accent: '#ef4444',
  },
  api: {
    border: '#34d399',
    fill: 'rgba(52,211,153,0.15)',
    headerFill: 'rgba(5,150,105,0.25)',
    text: '#6ee7b7',
    accent: '#059669',
  },
  infrastructure: {
    border: '#38bdf8',
    fill: 'rgba(56,189,248,0.15)',
    headerFill: 'rgba(14,165,233,0.25)',
    text: '#7dd3fc',
    accent: '#0ea5e9',
  },
  client: {
    border: '#a78bfa',
    fill: 'rgba(167,139,250,0.15)',
    headerFill: 'rgba(139,92,246,0.25)',
    text: '#c4b5fd',
    accent: '#8b5cf6',
  },
  external: {
    border: '#9ca3af',
    fill: 'rgba(156,163,175,0.1)',
    headerFill: 'rgba(107,114,128,0.2)',
    text: '#d1d5db',
    accent: '#6b7280',
  },
} as const

export type Category = keyof typeof CATEGORY_STYLES

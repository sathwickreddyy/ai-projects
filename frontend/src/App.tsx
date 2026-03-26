import { Routes, Route } from 'react-router-dom'
import { Canvas } from './components/Canvas'
import { EmptyState } from './components/EmptyState'

export default function App() {
  return (
    <Routes>
      <Route path="/session/:sessionId" element={<Canvas />} />
      <Route path="*" element={<EmptyState />} />
    </Routes>
  )
}

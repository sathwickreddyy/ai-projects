import { Routes, Route } from 'react-router-dom'
import { useAppStore } from './stores/appStore'
import { AuthGate } from './components/auth/AuthGate'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  const authConfigured = useAppStore((state) => state.authConfigured)

  if (!authConfigured) {
    return <AuthGate />
  }

  return (
    <Routes>
      <Route path="/session/:sessionId" element={<AppShell />} />
      <Route path="*" element={<AppShell />} />
    </Routes>
  )
}

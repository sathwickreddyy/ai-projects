import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/appStore'
import { getAuthStatus } from '../../api/client'

interface AuthStatus {
  mode: string
  cli_available: boolean
  has_api_key: boolean
}

export function AuthGate() {
  const { setAuthMode, setAuthConfigured } = useAppStore()
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check auth status on mount
    getAuthStatus()
      .then((status) => {
        setAuthStatus(status)
        // If already configured (e.g., .env has API key), skip the gate
        if (status.has_api_key || status.mode) {
          setAuthMode(status.mode)
          setAuthConfigured(true)
        }
      })
      .catch((err) => {
        console.error('Failed to get auth status:', err)
        // Show the gate anyway
        setAuthStatus({ mode: '', cli_available: false, has_api_key: false })
      })
  }, [setAuthMode, setAuthConfigured])

  const handleCliAuth = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:18000'
      const response = await fetch(`${baseUrl}/api/auth/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'cli' }),
      })

      if (!response.ok) {
        throw new Error('Failed to configure CLI auth')
      }

      setAuthMode('cli')
      setAuthConfigured(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure CLI auth')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApiKeyAuth = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:18000'
      const response = await fetch(`${baseUrl}/api/auth/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'api', api_key: apiKey }),
      })

      if (!response.ok) {
        throw new Error('Failed to configure API key auth')
      }

      setAuthMode('api')
      setAuthConfigured(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure API key auth')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking auth status
  if (!authStatus) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#7c9adb]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-[#161b27] border border-[#1e2430] rounded-xl p-8 shadow-2xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#7c9adb] mb-2">arch-viewer</h1>
          <p className="text-gray-400">Connect to Claude</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Option 1: Claude CLI (if detected) */}
        {authStatus.cli_available && (
          <div className="mb-6">
            <div className="border border-[#1e2430] rounded-lg p-6 bg-[#1a1f2e]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                <span className="font-semibold text-[#4ade80]">Claude CLI detected</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Your Claude subscription will be used for AI features.
              </p>
              <button
                onClick={handleCliAuth}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Connecting...' : 'Use Claude CLI'}
              </button>
            </div>
          </div>
        )}

        {/* Option 2: API Key (always shown) */}
        <div>
          <div className="border border-[#1e2430] rounded-lg p-6 bg-[#1a1f2e]">
            <h3 className="font-semibold text-white mb-4">Anthropic API Key</h3>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-2 mb-4 bg-[#0a0a0f] border border-[#1e2430] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#2563eb]"
              disabled={isLoading}
            />
            <button
              onClick={handleApiKeyAuth}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#374151] hover:bg-[#4b5563] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Connecting...' : 'Connect with API Key'}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Your API key is stored locally and never shared
        </p>
      </div>
    </div>
  )
}

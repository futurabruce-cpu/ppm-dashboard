'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// Map username → email (Supabase requires email format)
function toEmail(username: string): string {
  const u = username.trim().toLowerCase()
  // If already looks like an email, use as-is
  if (u.includes('@')) return u
  // Map known usernames
  const map: Record<string, string> = {
    'raef': 'raef@ppm.local',
    'helen': 'helen@ppm.local',
    'gareth': 'gareth@ppm.local',
    'dan': 'dan@ppm.local',
    'raefprivate': 'raefprivate@ppm.local',
  }
  return map[u] ?? `${u}@ppm.local`
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    const email = toEmail(username)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-28 h-28 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{background:'#0a0a1a'}}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gow-logo.webp" alt="GOW Systems" width={96} height={96} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Worksheets</h1>
          <p className="text-gray-500 mt-1 text-sm">Fire Alarm Service Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#F5A800' } as React.CSSProperties}
              placeholder="e.g. Raef"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-2.5 rounded-lg transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#F5A800' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

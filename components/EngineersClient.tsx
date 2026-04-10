'use client'

import { useState } from 'react'
import { createEngineer } from '@/app/actions/engineers'

interface Engineer {
  id: string
  full_name: string | null
  created_at: string
  companies?: { name: string } | null
}

interface Props {
  engineers: Engineer[]
  profile: { role: 'superadmin' | 'admin'; company_id?: string | null }
}

export default function EngineersClient({ engineers, profile }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    const result = await createEngineer(data)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setShowModal(false)
      form.reset()
      window.location.reload()
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-bold text-black transition-colors"
          style={{ background: '#F5A800' }}
        >
          + Add Engineer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {engineers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">👷</div>
            <p className="font-semibold">No engineers yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                {profile.role === 'superadmin' && (
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Company</th>
                )}
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Added</th>
              </tr>
            </thead>
            <tbody>
              {engineers.map((eng, i) => (
                <tr key={eng.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="px-5 py-3 font-semibold text-gray-900">{eng.full_name ?? '—'}</td>
                  {profile.role === 'superadmin' && (
                    <td className="px-5 py-3 text-gray-600">{eng.companies?.name ?? '—'}</td>
                  )}
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(eng.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Engineer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Add Engineer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  name="full_name"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g. John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="engineer@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Min 8 characters"
                />
              </div>
              {profile.role === 'superadmin' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Company ID</label>
                  <input
                    name="company_id"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="UUID of company"
                  />
                </div>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-black disabled:opacity-50"
                  style={{ background: '#F5A800' }}
                >
                  {loading ? 'Creating…' : 'Create Engineer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

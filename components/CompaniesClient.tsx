'use client'

import { useState } from 'react'
import { createCompany } from '@/app/actions/companies'

interface Company {
  id: string
  name: string
  created_at: string
}

export default function CompaniesClient({ companies }: { companies: Company[] }) {
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    const result = await createCompany(data)
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
          className="px-4 py-2 rounded-lg text-sm font-bold text-black"
          style={{ background: '#F5A800' }}
        >
          + Add Company
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {companies.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🏢</div>
            <p className="font-semibold">No companies yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Company Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">ID</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c, i) => (
                <tr key={c.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="px-5 py-3 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs hidden md:table-cell">{c.id}</td>
                  <td className="px-5 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Add Company</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                <input
                  name="name"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g. GOW Systems"
                />
              </div>
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
                  {loading ? 'Creating…' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { createEngineer } from '@/app/actions/engineers'

export default function AddEngineerForm() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createEngineer(formData)
      if (result?.error) setError(result.error)
      else { setSuccess(true); setTimeout(() => { setOpen(false); setSuccess(false) }, 1500) }
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-[#F5A800] text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-500 transition">
        + Add Engineer
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Add Engineer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input name="name" required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800]" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800]" placeholder="john@example.com" />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">Engineer created!</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={pending} className="flex-1 bg-[#F5A800] text-black font-bold py-2 rounded-lg text-sm hover:bg-yellow-500 transition disabled:opacity-60">
                  {pending ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ImportWorksheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    const file = data.get('pdf') as File
    if (!file || file.size === 0) { setError('Please select a PDF file'); return }

    setLoading(true)
    try {
      const buf = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: data.get('site_name'),
          site_address: data.get('site_address'),
          service_date: data.get('service_date'),
          sheet_type: data.get('sheet_type'),
          pdf_base64: base64,
        }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Import failed'); return }
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (err) {
      setError('Upload failed — try again')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-gray-700 hover:bg-gray-600"
      >
        ↑ Import Worksheet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Import Worksheet</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Site Name</label>
                <input name="site_name" type="text" required placeholder="e.g. Crown House" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Site Address</label>
                <input name="site_address" type="text" placeholder="Full address" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Service Date</label>
                <input name="service_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                <select name="sheet_type" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="lfl">Ladrillos PPM</option>
                  <option value="voca">GOW PPM</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">PDF File</label>
                <input ref={fileRef} name="pdf" type="file" accept="application/pdf" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>

              {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black" style={{ background: '#F5A800' }}>
                  {loading ? 'Uploading...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

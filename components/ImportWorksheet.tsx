'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ParsedFields {
  site_name: string | null
  site_address: string | null
  service_date: string | null
  engineer_name: string | null
  company_name: string | null
  job_type: string | null
  sheet_type: string | null
}

export default function ImportWorksheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<ParsedFields | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    setFields(null)
    setParsing(true)

    const buf = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
    setPdfBase64(base64)

    // Auto-parse
    try {
      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: base64 }),
      })
      const data = await res.json()
      if (data.fields) {
        setFields(data.fields)
      } else {
        setFields({ site_name: '', site_address: '', service_date: new Date().toISOString().split('T')[0], engineer_name: '', company_name: '', job_type: '', sheet_type: 'voca' })
      }
    } catch {
      setFields({ site_name: '', site_address: '', service_date: new Date().toISOString().split('T')[0], engineer_name: '', company_name: '', job_type: '', sheet_type: 'voca' })
    } finally {
      setParsing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!pdfBase64) { setError('Please select a PDF file'); return }
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: data.get('site_name'),
          site_address: data.get('site_address'),
          service_date: data.get('service_date'),
          sheet_type: data.get('sheet_type'),
          engineer_name: data.get('engineer_name'),
          company_name: data.get('company_name'),
          job_type: data.get('job_type'),
          pdf_base64: pdfBase64,
        }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error || 'Import failed'); return }
      setOpen(false)
      setFields(null)
      setPdfBase64(null)
      setFileName('')
      router.refresh()
    } catch {
      setError('Upload failed — try again')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setFields(null)
    setPdfBase64(null)
    setFileName('')
    setError('')
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Import Worksheet</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* File picker always first */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">Select PDF</label>
              <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-4 hover:border-amber-400 transition-colors">
                <span className="text-2xl">📄</span>
                <div>
                  <div className="text-sm font-bold text-gray-700">{fileName || 'Choose a PDF file'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{fileName ? 'Tap to change' : 'Tap to browse'}</div>
                </div>
                <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {parsing && (
              <div className="text-center py-8">
                <div className="text-3xl mb-3 animate-pulse">🔍</div>
                <p className="text-sm font-bold text-gray-600">Reading PDF...</p>
                <p className="text-xs text-gray-400 mt-1">Extracting site, date and engineer details</p>
              </div>
            )}

            {fields && !parsing && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-semibold mb-1">
                  ✅ Details extracted — check and confirm below
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Site Name</label>
                  <input name="site_name" type="text" required defaultValue={fields.site_name ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Site Address</label>
                  <input name="site_address" type="text" defaultValue={fields.site_address ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Service Date</label>
                  <input name="service_date" type="date" required defaultValue={fields.service_date ?? new Date().toISOString().split('T')[0]} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Engineer</label>
                  <input name="engineer_name" type="text" defaultValue={fields.engineer_name ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Company</label>
                  <select name="company_name" defaultValue={fields.company_name ?? 'Voca'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="GOW Systems">GOW Systems</option>
                    <option value="Ladrillos">Ladrillos</option>
                    <option value="Voca">Voca</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Job Type</label>
                  <input name="job_type" type="text" defaultValue={fields.job_type ?? ''} placeholder="e.g. Return Visit, Service, New Install" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                  <select name="sheet_type" defaultValue={fields.sheet_type ?? 'voca'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option value="lfl">Ladrillos PPM</option>
                    <option value="voca">GOW PPM</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black" style={{ background: '#F5A800' }}>
                    {loading ? 'Importing...' : 'Confirm Import'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

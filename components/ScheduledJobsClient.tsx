'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Job {
  id: string
  engineer_name: string | null
  site_name: string | null
  site_address: string | null
  company_name: string | null
  job_type: string
  app_type: string
  scheduled_date: string
  notes: string | null
  status: string
  submission_id: string | null
  our_job_number: string | null
  customer_job_number: string | null
  created_at: string
}

interface Engineer {
  id: string
  full_name: string | null
}

interface Props {
  jobs: Job[]
  engineers: Engineer[]
}

const COMPANY_TO_APP: Record<string, string> = {
  'GOW Systems': 'gow',
  'Ladrillos': 'lfl',
  'MS Webb': 'mswebb',
}

export default function ScheduledJobsClient({ jobs, engineers }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'pending' | 'completed'>('pending')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [siteQuery, setSiteQuery] = useState('')
  const [siteSuggestions, setSiteSuggestions] = useState<{ name: string; address: string }[]>([])
  const acTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    engineer_id: '',
    engineer_name: '',
    site_name: '',
    site_address: '',
    company_name: 'GOW Systems',
    job_type: 'PPM',
    app_type: 'gow',
    scheduled_date: '',
    customer_job_number: '',
    notes: '',
  })

  const filtered = jobs.filter(j => j.status === tab)

  // Site autocomplete
  useEffect(() => {
    if (acTimer.current) clearTimeout(acTimer.current)
    if (siteQuery.length < 2) { setSiteSuggestions([]); return }
    acTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sites?q=${encodeURIComponent(siteQuery)}`)
        const data = await res.json()
        setSiteSuggestions(data || [])
      } catch { setSiteSuggestions([]) }
    }, 250)
  }, [siteQuery])

  function handleCompanyChange(company: string) {
    setForm(f => ({ ...f, company_name: company, app_type: COMPANY_TO_APP[company] || 'gow' }))
  }

  function handleEngineerChange(id: string) {
    const eng = engineers.find(e => e.id === id)
    setForm(f => ({ ...f, engineer_id: id, engineer_name: eng?.full_name || '' }))
  }

  function selectSite(site: { name: string; address: string }) {
    setForm(f => ({ ...f, site_name: site.name, site_address: site.address }))
    setSiteQuery(site.name)
    setSiteSuggestions([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.scheduled_date || !form.site_name) return
    setSubmitting(true)
    try {
      await fetch('/api/scheduled-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'ppm_live_2026_secure_key' },
        body: JSON.stringify(form),
      })
      setShowModal(false)
      setForm({ engineer_id: '', engineer_name: '', site_name: '', site_address: '', company_name: 'GOW Systems', job_type: 'PPM', app_type: 'gow', scheduled_date: '', customer_job_number: '', notes: '' })
      setSiteQuery('')
      router.refresh()
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Scheduled Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Assign and track upcoming engineer visits</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-xl font-bold text-sm text-black shadow-sm"
          style={{ background: '#F5A800' }}
        >
          + Assign Job
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['pending', 'completed'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab === t ? 'text-black' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
            style={tab === t ? { background: '#F5A800' } : {}}
          >
            {t} ({jobs.filter(j => j.status === t).length})
          </button>
        ))}
      </div>

      {/* Job list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-4xl mb-3">{tab === 'pending' ? '📅' : '✅'}</div>
          <p className="font-semibold">No {tab} jobs</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    {job.our_job_number && (
                      <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{job.our_job_number}</span>
                    )}
                    {job.customer_job_number && (
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Cust: {job.customer_job_number}</span>
                    )}
                  </div>
                  <div className="font-black text-gray-900 text-lg">{job.site_name || '—'}</div>
                  {job.site_address && <div className="text-gray-500 text-sm mt-0.5">{job.site_address}</div>}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ml-3 shrink-0 ${job.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                  {job.status === 'pending' ? 'Pending' : 'Completed'}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
                <span>📅 {new Date(job.scheduled_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {job.engineer_name && <span>👷 {job.engineer_name}</span>}
                {job.company_name && <span>🏢 {job.company_name}</span>}
                <span className="font-semibold text-gray-800">{job.job_type}</span>
              </div>
              {job.notes && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{job.notes}</div>
              )}
              {job.status === 'completed' && job.submission_id && (
                <a href={`/dashboard/submissions/${job.submission_id}`} className="mt-3 inline-block text-xs font-bold text-amber-700 hover:underline">
                  → View Submission
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assign Job Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Assign Job</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              {/* Engineer */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Engineer</label>
                <select
                  value={form.engineer_id}
                  onChange={e => handleEngineerChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                >
                  <option value="">Select engineer...</option>
                  {engineers.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Company</label>
                <select
                  value={form.company_name}
                  onChange={e => handleCompanyChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option>GOW Systems</option>
                  <option>Ladrillos</option>
                  <option>MS Webb</option>
                </select>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Job Type</label>
                <select
                  value={form.job_type}
                  onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option>PPM</option>
                  <option>Callout</option>
                </select>
              </div>

              {/* Site Name with autocomplete */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-1">Site Name</label>
                <input
                  type="text"
                  value={siteQuery || form.site_name}
                  onChange={e => { setSiteQuery(e.target.value); setForm(f => ({ ...f, site_name: e.target.value })) }}
                  placeholder="Start typing site name..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  autoComplete="off"
                  required
                />
                {siteSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full bg-white border-2 border-gray-200 border-t-0 rounded-b-xl z-10 max-h-48 overflow-y-auto shadow-lg">
                    {siteSuggestions.map(s => (
                      <div
                        key={s.name}
                        onMouseDown={() => selectSite(s)}
                        className="px-4 py-3 cursor-pointer hover:bg-amber-50 border-b border-gray-50 last:border-0"
                      >
                        <div className="font-semibold text-sm text-gray-900">{s.name}</div>
                        {s.address && <div className="text-xs text-gray-500 mt-0.5">{s.address}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Site Address */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Site Address</label>
                <textarea
                  value={form.site_address}
                  onChange={e => setForm(f => ({ ...f, site_address: e.target.value }))}
                  rows={2}
                  placeholder="Full address including postcode"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              {/* Customer Job Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Customer Job Number <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={form.customer_job_number}
                  onChange={e => setForm(f => ({ ...f, customer_job_number: e.target.value }))}
                  placeholder="e.g. WO-12345"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any instructions for the engineer..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl font-black text-base text-black disabled:opacity-60"
                style={{ background: '#F5A800' }}
              >
                {submitting ? 'Assigning...' : 'Assign Job'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

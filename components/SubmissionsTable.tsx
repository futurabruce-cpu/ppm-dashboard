'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Submission {
  id: string
  site_name: string | null
  site_address: string | null
  service_date: string | null
  sheet_type: 'lfl' | 'voca'
  status: string | null
  company_name: string | null
  job_type: string | null
  follow_up_required: boolean | null
  created_at: string
  pdf_url: string | null
  job_number: string | null
  profiles?: { full_name: string | null } | null
  companies?: { name: string } | null
}

interface Props {
  submissions: Submission[]
  profile: { role: string; company_id?: string | null }
  engineers: { id: string; full_name: string | null }[]
  filters: { sheet_type?: string; from?: string; to?: string; engineer?: string; search?: string; status?: string; company_name?: string; job_type?: string; follow_up?: string; job_number?: string }
}

const STATUS_LABELS: Record<string, string> = {
  job_complete: 'Job Complete',
  invoiced: 'Invoiced',
  paid: 'Paid',
}

const STATUS_COLOURS: Record<string, string> = {
  job_complete: 'bg-blue-100 text-blue-800',
  invoiced: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
}

function StatusDropdown({ id, status, isAdmin }: { id: string; status: string | null; isAdmin: boolean }) {
  const router = useRouter()
  const current = status || 'job_complete'

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await fetch(`/api/submissions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: e.target.value }),
    })
    router.refresh()
  }

  if (!isAdmin) {
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLOURS[current] ?? 'bg-gray-100 text-gray-700'}`}>
        {STATUS_LABELS[current] ?? current}
      </span>
    )
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className={`text-xs font-bold rounded-lg px-2 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 ${STATUS_COLOURS[current] ?? 'bg-gray-100 text-gray-700'}`}
    >
      <option value="job_complete">Job Complete</option>
      <option value="invoiced">Invoiced</option>
      <option value="paid">Paid</option>
    </select>
  )
}

export default function SubmissionsTable({ submissions, profile, engineers, filters }: Props) {
  const router = useRouter()
  const isAdmin = profile.role !== 'engineer'
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    router.push('/dashboard/submissions?' + params.toString())
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === submissions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(submissions.map(s => s.id)))
    }
  }

  async function handleDelete() {
    if (selected.size === 0) return
    const confirmed = window.confirm(`Delete ${selected.size} worksheet${selected.size > 1 ? 's' : ''}? This cannot be undone.`)
    if (!confirmed) return
    setDeleting(true)
    try {
      const res = await fetch('/api/submissions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (res.ok) {
        setSelected(new Set())
        router.refresh()
      } else {
        alert('Failed to delete. Please try again.')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          defaultValue={filters.search ?? ''}
          onChange={e => applyFilter('search', e.target.value.trim())}
          placeholder="🔍 Search by site name..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          type="text"
          defaultValue={filters.job_number ?? ''}
          onChange={e => applyFilter('job_number', e.target.value.trim())}
          placeholder="🔢 Job No..."
          className="w-36 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          defaultValue={filters.company_name ?? ''}
          onChange={e => applyFilter('company_name', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">All Companies</option>
          <option value="GOW Systems">GOW Systems</option>
          <option value="Ladrillos">Ladrillos</option>
          <option value="Voca">Voca</option>
          <option value="MS Webb">MS Webb</option>
        </select>
        <select
          defaultValue={filters.job_type ?? ''}
          onChange={e => applyFilter('job_type', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">All Job Types</option>
          <option value="PPM">PPM</option>
          <option value="Return Visit">Return Visit</option>
          <option value="Small Works">Small Works</option>
          <option value="Callout">Callout</option>
        </select>

        {profile.role !== 'engineer' && engineers.length > 0 && (
          <select
            defaultValue={filters.engineer ?? ''}
            onChange={e => applyFilter('engineer', e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">All Engineers</option>
            {engineers.map(e => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>
        )}

        <input
          type="date"
          defaultValue={filters.from ?? ''}
          onChange={e => applyFilter('from', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          type="date"
          defaultValue={filters.to ?? ''}
          onChange={e => applyFilter('to', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <label className="flex items-center gap-2 cursor-pointer border border-red-200 rounded-lg px-3 py-2 text-sm bg-white select-none hover:bg-red-50">
          <input
            type="checkbox"
            checked={filters.follow_up === 'true'}
            onChange={e => applyFilter('follow_up', e.target.checked ? 'true' : '')}
            className="accent-red-500 w-4 h-4"
          />
          <span className="font-semibold text-red-700">Follow-ups</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white select-none hover:bg-amber-50">
          <input
            type="checkbox"
            checked={filters.status === 'invoiced'}
            onChange={e => applyFilter('status', e.target.checked ? 'invoiced' : '')}
            className="accent-amber-500 w-4 h-4"
          />
          <span className="font-semibold text-amber-700">Invoiced</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white select-none hover:bg-green-50">
          <input
            type="checkbox"
            checked={filters.status === 'paid'}
            onChange={e => applyFilter('status', e.target.checked ? 'paid' : '')}
            className="accent-green-500 w-4 h-4"
          />
          <span className="font-semibold text-green-700">Paid</span>
        </label>
      </div>

      {/* Bulk delete bar */}
      {isAdmin && selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-sm font-semibold text-red-700">{selected.size} selected</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {deleting ? 'Deleting…' : `🗑 Delete ${selected.size}`}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold">No worksheets yet</p>
          <p className="text-sm mt-1">Completed sheets will appear here</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {submissions.map(s => (
              <div key={s.id} className={`bg-white rounded-xl shadow-sm border p-4 transition-colors ${selected.has(s.id) ? 'border-red-400 bg-red-50/30' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    {isAdmin && (
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="accent-red-500 w-4 h-4 mt-1 shrink-0"
                      />
                    )}
                    <div>
                      {s.job_number && <div className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mb-1 inline-block">{s.job_number}</div>}
                      <div className="font-bold text-gray-900 text-base">{s.site_name ?? '—'}</div>
                      {s.site_address && <div className="text-gray-500 text-xs mt-0.5">{s.site_address}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      s.sheet_type === 'lfl' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {s.sheet_type === 'lfl' ? 'Ladrillos' : 'GOW'}
                    </span>
                    {s.company_name && <span className="text-xs font-semibold text-gray-500">{s.company_name}</span>}
                    {s.job_type && <span className="text-xs text-gray-400">{s.job_type}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2 flex-wrap">
                  <span>📅 {s.service_date ? new Date(s.service_date).toLocaleDateString('en-GB') : '—'}</span>
                  {profile.role !== 'engineer' && s.profiles?.full_name && (
                    <span>👷 {s.profiles.full_name}</span>
                  )}
                  {s.follow_up_required && (
                    <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-lg">🔴 Follow-up Required</span>
                  )}
                </div>
                <div className="mb-3">
                  <StatusDropdown id={s.id} status={s.status} isAdmin={profile.role !== 'engineer'} />
                </div>
                <div className="flex gap-2">
                  {s.pdf_url ? (
                    <a
                      href={s.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-bold text-black"
                      style={{ background: '#F5A800' }}
                    >
                      📄 View PDF
                    </a>
                  ) : (
                    <Link
                      href={`/dashboard/submissions/${s.id}`}
                      className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-500"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {isAdmin && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === submissions.length && submissions.length > 0}
                        onChange={toggleAll}
                        className="accent-red-500 w-4 h-4"
                        title="Select all"
                      />
                    </th>
                  )}
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Job No</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Site</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Address</th>
                  {profile.role !== 'engineer' && (
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Engineer</th>
                  )}
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Company</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Job Type</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Follow-up</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Sheet</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 transition-colors ${selected.has(s.id) ? 'bg-red-50' : i % 2 === 0 ? 'hover:bg-amber-50/40' : 'bg-gray-50/30 hover:bg-amber-50/40'}`}>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggleOne(s.id)}
                          className="accent-red-500 w-4 h-4"
                        />
                      </td>
                    )}
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                      {s.service_date ? new Date(s.service_date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {s.job_number
                        ? <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">{s.job_number}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{s.site_name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate">{s.site_address ?? '—'}</td>
                    {profile.role !== 'engineer' && (
                      <td className="px-5 py-3 text-gray-600">{s.profiles?.full_name ?? '—'}</td>
                    )}
                    <td className="px-5 py-3 text-gray-600 text-sm">{s.company_name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 text-sm">{s.job_type ?? '—'}</td>
                    <td className="px-5 py-3">
                      {s.follow_up_required && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-lg">🔴 Required</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        s.sheet_type === 'lfl' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {s.sheet_type === 'lfl' ? 'Ladrillos' : 'GOW'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusDropdown id={s.id} status={s.status} isAdmin={profile.role !== 'engineer'} />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {s.pdf_url ? (
                        <a
                          href={s.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1 rounded-lg text-xs font-bold text-black"
                          style={{ background: '#F5A800' }}
                        >
                          📄 View PDF
                        </a>
                      ) : (
                        <Link
                          href={`/dashboard/submissions/${s.id}`}
                          className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-500"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

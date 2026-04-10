'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Submission {
  id: string
  site_name: string | null
  site_address: string | null
  service_date: string | null
  sheet_type: 'lfl' | 'voca'
  created_at: string
  pdf_url: string | null
  profiles?: { full_name: string | null } | null
  companies?: { name: string } | null
}

interface Props {
  submissions: Submission[]
  profile: { role: string; company_id?: string | null }
  engineers: { id: string; full_name: string | null }[]
  filters: { sheet_type?: string; from?: string; to?: string; engineer?: string }
}

export default function SubmissionsTable({ submissions, profile, engineers, filters }: Props) {
  const router = useRouter()

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    router.push('/dashboard/submissions?' + params.toString())
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <select
          defaultValue={filters.sheet_type ?? ''}
          onChange={e => applyFilter('sheet_type', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="">All Types</option>
          <option value="lfl">Ladrillos</option>
          <option value="voca">GOW</option>
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
      </div>

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
              <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-gray-900 text-base">{s.site_name ?? '—'}</div>
                    {s.site_address && <div className="text-gray-500 text-xs mt-0.5">{s.site_address}</div>}
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ml-2 shrink-0 ${
                    s.sheet_type === 'lfl' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {s.sheet_type === 'lfl' ? 'Ladrillos' : 'GOW'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>📅 {s.service_date ? new Date(s.service_date).toLocaleDateString('en-GB') : '—'}</span>
                  {profile.role !== 'engineer' && s.profiles?.full_name && (
                    <span>👷 {s.profiles.full_name}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/submissions/${s.id}`}
                    className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-bold text-black"
                    style={{ background: '#F5A800' }}
                  >
                    View
                  </Link>
                  {s.pdf_url && (
                    <a
                      href={s.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-700"
                    >
                      📄 PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Site</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Address</th>
                  {profile.role !== 'engineer' && (
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Engineer</th>
                  )}
                  {profile.role === 'superadmin' && (
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Company</th>
                  )}
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 hover:bg-amber-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                      {s.service_date ? new Date(s.service_date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{s.site_name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate">{s.site_address ?? '—'}</td>
                    {profile.role !== 'engineer' && (
                      <td className="px-5 py-3 text-gray-600">{s.profiles?.full_name ?? '—'}</td>
                    )}
                    {profile.role === 'superadmin' && (
                      <td className="px-5 py-3 text-gray-600">{s.companies?.name ?? '—'}</td>
                    )}
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        s.sheet_type === 'lfl' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {s.sheet_type === 'lfl' ? 'Ladrillos' : 'GOW'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/dashboard/submissions/${s.id}`}
                        className="inline-block px-3 py-1 rounded-lg text-xs font-bold text-black"
                        style={{ background: '#F5A800' }}
                      >
                        View
                      </Link>
                      {s.pdf_url && (
                        <a
                          href={s.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700"
                        >
                          PDF
                        </a>
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

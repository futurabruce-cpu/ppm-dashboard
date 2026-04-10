import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function FollowUpsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('*, companies(name)').eq('id', user.id).single()
  const profile = profileData as { role: string; company_id: string | null } | null
  if (!profile) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from('follow_ups').select('*, profiles(full_name)').order('created_at', { ascending: false })
  if (profile.role === 'admin') query = query.eq('company_id', profile.company_id)
  if (profile.role === 'engineer') query = query.eq('engineer_id', user.id)

  const { data: followUps } = await query

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Follow Ups</h1>
        <p className="text-gray-500 text-sm mt-1">Jobs requiring a return visit</p>
      </div>

      {(!followUps || followUps.length === 0) ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold">No follow-ups outstanding</p>
          <p className="text-sm mt-1">Return visit jobs will appear here</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {followUps.map((f: any) => (
              <div key={f.id} className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-gray-900 text-base">{f.site_name ?? '—'}</div>
                    {f.site_address && <div className="text-gray-500 text-xs mt-0.5">{f.site_address}</div>}
                  </div>
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-lg ml-2 shrink-0">🔴 Pending</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">📅 {f.service_date ? new Date(f.service_date).toLocaleDateString('en-GB') : '—'} {f.profiles?.full_name ? `· 👷 ${f.profiles.full_name}` : ''}</div>
                {f.answers?.cf1 && <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Work needed:</span> {f.answers.cf1}</div>}
                {f.answers?.cf2 && <div className="text-sm text-gray-700 mb-1"><span className="font-semibold">Parts:</span> {f.answers.cf2}</div>}
                {f.answers?.cf3 && <div className="text-sm text-gray-700"><span className="font-semibold">Hours:</span> {f.answers.cf3}</div>}
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
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Engineer</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Work Needed</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Parts</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Hours</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {followUps.map((f: any) => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-red-50/30">
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{f.service_date ? new Date(f.service_date).toLocaleDateString('en-GB') : '—'}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{f.site_name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{f.profiles?.full_name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-700 max-w-[200px] truncate">{f.answers?.cf1 ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-700">{f.answers?.cf2 ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-700">{f.answers?.cf3 ?? '—'}</td>
                    <td className="px-5 py-3"><span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-lg">🔴 Pending</span></td>
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

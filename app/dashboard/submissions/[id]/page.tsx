import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdminClient() as any
  const { data: sub } = await admin
    .from('submissions')
    .select('*, profiles!engineer_id(full_name)')
    .eq('id', id)
    .single()

  if (!sub) notFound()

  const answers = (sub.answers ?? {}) as Record<string, unknown>

  const sections: Record<string, Record<string, unknown>> = {}
  for (const [key, value] of Object.entries(answers)) {
    const parts = key.split(':')
    const section = parts.length > 1 ? parts[0].trim() : 'General'
    const field = parts.length > 1 ? parts.slice(1).join(':').trim() : key
    if (!sections[section]) sections[section] = {}
    sections[section][field] = value
  }

  const engineerName = (sub.profiles as { full_name: string } | null)?.full_name ?? '\u2014'

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link href="/dashboard/submissions" className="text-gray-500 hover:text-gray-700 text-sm">
          \u2190 Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{sub.site_name}</h1>
        <span className={`ml-auto inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${
          sub.sheet_type === 'lfl' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {sub.sheet_type}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {([
          ['Site', sub.site_name],
          ['Address', sub.site_address],
          ['Engineer', engineerName],
          ['Service Date', new Date(sub.service_date).toLocaleDateString('en-GB')],
          ['Submitted', new Date(sub.created_at).toLocaleString('en-GB')],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
            <p className="text-gray-900 font-medium">{value}</p>
          </div>
        ))}
        {sub.pdf_url && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center">
            <a
              href={sub.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="bg-[#F5A800] text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-500 transition"
            >
              \u2b07 Download PDF
            </a>
          </div>
        )}
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-4">Inspection Answers</h2>

      {Object.entries(sections).map(([section, fields]) => (
        <div key={section} className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-3">
            <h3 className="font-semibold text-gray-700 text-sm">{section}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(fields).map(([field, value]) => (
              <div key={field} className="px-6 py-3 flex gap-4">
                <span className="text-sm text-gray-500 w-1/2 shrink-0">{field}</span>
                <span className="text-sm text-gray-900 font-medium">
                  {typeof value === 'boolean'
                    ? value ? '\u2705 Yes' : '\u274c No'
                    : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(sections).length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          No answers recorded.
        </div>
      )}
    </div>
  )
}

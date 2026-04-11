import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import SubmissionEditClient from '@/components/SubmissionEditClient'

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

  const engineerName: string =
    (sub.profiles as { full_name: string } | null)?.full_name ??
    sub.engineer_name ??
    ''

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link href="/dashboard/submissions" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{sub.site_name}</h1>
        <span
          className={`ml-auto inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${
            sub.sheet_type === 'lfl'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {sub.sheet_type}
        </span>
      </div>

      {sub.pdf_url && (
        <div className="mb-4">
          <a
            href={sub.pdf_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex bg-[#F5A800] text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-500 transition"
          >
            ⬇ Download PDF
          </a>
        </div>
      )}

      <SubmissionEditClient
        submission={{
          id: sub.id,
          site_name: sub.site_name ?? null,
          site_address: sub.site_address ?? null,
          service_date: sub.service_date ?? null,
          engineer_name: engineerName,
          company_name: sub.company_name ?? null,
          job_type: sub.job_type ?? null,
          follow_up_required: sub.follow_up_required ?? null,
          answers: (sub.answers ?? {}) as Record<string, unknown>,
          sheet_type: sub.sheet_type ?? null,
          pdf_url: sub.pdf_url ?? null,
        }}
      />
    </div>
  )
}

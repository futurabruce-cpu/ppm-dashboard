import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubmissionsTable from '@/components/SubmissionsTable'
import ImportWorksheet from '@/components/ImportWorksheet'

interface SearchParams {
  sheet_type?: string
  from?: string
  to?: string
  engineer?: string
  search?: string
  status?: string
  company_name?: string
  job_type?: string
  follow_up?: string
  job_number?: string
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, companies(name)')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: 'superadmin' | 'admin' | 'engineer'; company_id: string | null } | null
  if (!profile) redirect('/login')

  let query = supabase
    .from('submissions')
    .select('*, profiles(full_name, role), companies(name)')
    .order('created_at', { ascending: false })

  if (params.sheet_type) query = query.eq('sheet_type', params.sheet_type)
  if (params.from) query = query.gte('service_date', params.from)
  if (params.to) query = query.lte('service_date', params.to)
  if (params.engineer) query = query.eq('engineer_id', params.engineer)
  if (params.search) query = query.ilike('site_name', `%${params.search.trim()}%`)
  if (params.status) query = query.eq('status', params.status)
  if (params.company_name) query = query.ilike('company_name', `%${params.company_name}%`)
  if (params.job_type) query = query.eq('job_type', params.job_type)
  if (params.follow_up === 'true') query = query.eq('follow_up_required', true)
  if (params.job_number) query = query.ilike('job_number', `%${params.job_number.trim()}%`)

  const { data: submissions } = await query

  let engineers: { id: string; full_name: string | null }[] = []
  if (profile.role !== 'engineer') {
    let engQuery = supabase
      .from('profiles')
      .select('id, full_name')
      .neq('role', 'superadmin')
    if (profile.role === 'admin') {
      engQuery = engQuery.eq('company_id', profile.company_id)
    }
    const { data } = await engQuery
    engineers = (data as { id: string; full_name: string | null }[]) || []
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Completed Worksheets</h1>
          <p className="text-gray-500 text-sm mt-1">Fire alarm service sheets</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <a
            href="https://futurabruce-cpu.github.io/lfl-ppm/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-bold text-black"
            style={{ background: '#F5A800' }}
          >
            + New Worksheet
          </a>
          <ImportWorksheet />
        </div>
      </div>
      <SubmissionsTable
        submissions={(submissions as never[]) || []}
        profile={profile as never}
        engineers={engineers}
        filters={params}
      />
    </div>
  )
}

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompaniesClient from '@/components/CompaniesClient'

export default async function CompaniesPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = data as { role: string } | null

  if (!profile || profile.role !== 'superadmin') redirect('/dashboard/submissions')

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <p className="text-gray-500 text-sm mt-1">Manage client companies</p>
      </div>
      <CompaniesClient companies={(companies as { id: string; name: string; created_at: string }[]) || []} />
    </div>
  )
}

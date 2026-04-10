import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EngineersClient from '@/components/EngineersClient'

export default async function EngineersPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const profile = data as { role: string; company_id: string | null } | null

  if (!profile || profile.role === 'engineer') redirect('/dashboard/submissions')

  let query = supabase
    .from('profiles')
    .select('*, companies(name)')
    .eq('role', 'engineer')
    .order('created_at', { ascending: false })

  if (profile.role === 'admin') {
    query = query.eq('company_id', profile.company_id)
  }

  const { data: engineers } = await query

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Engineers</h1>
        <p className="text-gray-500 text-sm mt-1">Manage field engineers</p>
      </div>
      <EngineersClient engineers={(engineers as { id: string; full_name: string | null; created_at: string; companies?: { name: string } | null }[]) || []} profile={profile as { role: 'superadmin' | 'admin'; company_id?: string | null }} />
    </div>
  )
}

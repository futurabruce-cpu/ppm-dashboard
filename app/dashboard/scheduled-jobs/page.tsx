import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import ScheduledJobsClient from '@/components/ScheduledJobsClient'

export default async function ScheduledJobsPage() {
  const supabase = getSupabaseAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobsRes, engineersRes] = await Promise.all([
    (supabase as any).from('scheduled_jobs').select('*').order('scheduled_date', { ascending: true }),
    supabase.from('profiles').select('id, full_name, role').order('full_name'),
  ])

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <ScheduledJobsClient
        jobs={jobsRes.data || []}
        engineers={engineersRes.data || []}
      />
    </div>
  )
}

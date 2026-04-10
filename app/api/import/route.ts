import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('id, company_id, role').eq('id', user.id).single()
  if (!profile || profile.role === 'engineer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { site_name, site_address, service_date, sheet_type, engineer_name, company_name, job_type, follow_up_required, pdf_base64 } = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdminClient() as any

  let pdf_url: string | null = null
  if (pdf_base64) {
    const buf = Buffer.from(pdf_base64, 'base64')
    const filename = `import-${Date.now()}-${user.id}.pdf`
    const { error: uploadErr } = await admin.storage.from('pdfs').upload(filename, buf, { contentType: 'application/pdf', upsert: false })
    if (!uploadErr) {
      const { data: publicData } = admin.storage.from('pdfs').getPublicUrl(filename)
      pdf_url = publicData.publicUrl
    }
  }

  const { data: submission, error } = await admin.from('submissions').insert({
    company_id: profile.company_id,
    engineer_id: profile.id,
    sheet_type: sheet_type || 'other',
    site_name,
    site_address,
    service_date,
    answers: engineer_name ? { engineer_name } : {},
    company_name: company_name || null,
    job_type: job_type || null,
    follow_up_required: follow_up_required || false,
    pdf_url,
    status: 'job_complete',
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: submission.id, success: true })
}

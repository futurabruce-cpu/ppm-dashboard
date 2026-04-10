import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateFollowUpPDF } from '@/lib/generate-pdf'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const validKey = process.env.SUBMISSIONS_API_KEY || 'ppm_live_2026_secure_key'
  if (apiKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const { engineer_email, site_name, site_address, service_date, job_type, company_name, answers, job_number } = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdminClient() as any

  const { data: { users } } = await admin.auth.admin.listUsers()
  const authUser = (users as Array<{ id: string; email?: string }>).find((u: { id: string; email?: string }) => u.email === engineer_email)
  if (!authUser) return NextResponse.json({ error: 'Engineer not found' }, { status: 404, headers: corsHeaders })

  const { data: profile } = await admin.from('profiles').select('id, company_id, full_name').eq('id', authUser.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders })

  // Generate follow-up PDF server-side
  let pdf_url: string | null = null
  try {
    const pdfBuf = await generateFollowUpPDF({
      site_name,
      site_address,
      service_date,
      answers,
      engineer_name: profile.full_name || authUser.email?.split('@')[0] || null,
      company_name: company_name || null,
    })
    const filename = `followup-${Date.now()}-${authUser.id}.pdf`
    const { error: uploadErr } = await admin.storage
      .from('pdfs')
      .upload(filename, pdfBuf, { contentType: 'application/pdf', upsert: false })
    if (!uploadErr) {
      const { data: publicData } = admin.storage.from('pdfs').getPublicUrl(filename)
      pdf_url = publicData.publicUrl
    }
  } catch(e) {
    console.error('Follow-up PDF generation failed:', e)
  }

  const { data: followUp, error } = await admin.from('follow_ups').insert({
    company_id: profile.company_id,
    engineer_id: profile.id,
    site_name,
    site_address,
    service_date,
    job_type,
    company_name,
    answers,
    pdf_url,
    job_number: job_number || null,
    status: 'pending',
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ id: followUp.id, success: true, pdf_url }, { headers: corsHeaders })
}

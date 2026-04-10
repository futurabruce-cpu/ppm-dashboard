import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

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
    return NextResponse.json({ error: 'Unauthorized', received: apiKey, expected_length: validKey.length }, { status: 401, headers: corsHeaders })
  }

  const body = await req.json()
  const { sheet_type, engineer_email, site_name, site_address, service_date, answers, pdf_base64, job_type, company_name } = body

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdminClient() as any

  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500, headers: corsHeaders })

  const authUser = (users as Array<{ id: string; email?: string }>).find(u => u.email === engineer_email)
  if (!authUser) return NextResponse.json({ error: 'Engineer not found' }, { status: 404, headers: corsHeaders })

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id, company_id')
    .eq('id', authUser.id)
    .single()
  if (profileErr || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders })

  let pdf_url: string | null = null

  if (pdf_base64) {
    const buf = Buffer.from(pdf_base64 as string, 'base64')
    const filename = `${Date.now()}-${authUser.id}.pdf`
    const { error: uploadErr } = await admin.storage
      .from('pdfs')
      .upload(filename, buf, { contentType: 'application/pdf', upsert: false })
    if (!uploadErr) {
      const { data: publicData } = admin.storage.from('pdfs').getPublicUrl(filename)
      pdf_url = publicData.publicUrl
    }
  }

  const { data: submission, error: insertErr } = await admin
    .from('submissions')
    .insert({
      company_id: profile.company_id,
      engineer_id: profile.id,
      sheet_type,
      site_name,
      site_address,
      service_date,
      answers,
      pdf_url,
      job_type: job_type || null,
      company_name: company_name || null,
    })
    .select('id')
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500, headers: corsHeaders })

  return NextResponse.json({ id: submission.id, success: true }, { headers: corsHeaders })
}

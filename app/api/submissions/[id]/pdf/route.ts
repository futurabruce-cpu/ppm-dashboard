import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = req.headers.get('x-api-key')
  const validKey = process.env.SUBMISSIONS_API_KEY || 'ppm_live_2026_secure_key'
  if (apiKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const { id } = await params
  const { pdf_base64 } = await req.json()
  if (!pdf_base64) {
    return NextResponse.json({ error: 'No PDF provided' }, { status: 400, headers: corsHeaders })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdminClient() as any
  const buf = Buffer.from(pdf_base64, 'base64')
  const filename = `${Date.now()}-${id}.pdf`

  const { error: uploadErr } = await admin.storage
    .from('pdfs')
    .upload(filename, buf, { contentType: 'application/pdf', upsert: false })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500, headers: corsHeaders })
  }

  const { data: publicData } = admin.storage.from('pdfs').getPublicUrl(filename)
  const pdf_url = publicData.publicUrl

  const { error: updateErr } = await admin
    .from('submissions')
    .update({ pdf_url })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500, headers: corsHeaders })
  }

  return NextResponse.json({ success: true, pdf_url }, { headers: corsHeaders })
}

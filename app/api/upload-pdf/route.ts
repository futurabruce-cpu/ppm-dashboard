import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('key')
  const validKey = process.env.SUBMISSIONS_API_KEY || 'ppm_live_2026_secure_key'
  if (apiKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const contentType = req.headers.get('content-type') || ''
  let id: string
  let buf: Buffer

  if (contentType.includes('application/json')) {
    const body = await req.json()
    id = body.id
    buf = Buffer.from(body.pdf_base64 as string, 'base64')
  } else {
    const formData = await req.formData()
    id = formData.get('id') as string
    const pdfFile = formData.get('pdf') as File
    buf = Buffer.from(await pdfFile.arrayBuffer())
  }

  if (!id || !buf) {
    return NextResponse.json({ error: 'Missing id or pdf' }, { status: 400, headers: corsHeaders })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdminClient() as any

  const filename = `${Date.now()}-${id}.pdf`

  const { error: uploadErr } = await admin.storage
    .from('pdfs')
    .upload(filename, buf, { contentType: 'application/pdf', upsert: false })

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500, headers: corsHeaders })
  }

  const { data: publicData } = admin.storage.from('pdfs').getPublicUrl(filename)
  const pdf_url = publicData.publicUrl

  // Support both submissions and follow_ups tables
  const table = req.nextUrl.searchParams.get('table') || 'submissions'
  const validTables = ['submissions', 'follow_ups']
  const targetTable = validTables.includes(table) ? table : 'submissions'

  const { error: updateErr } = await admin
    .from(targetTable)
    .update({ pdf_url })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500, headers: corsHeaders })
  }

  return NextResponse.json({ success: true, pdf_url }, { headers: corsHeaders })
}

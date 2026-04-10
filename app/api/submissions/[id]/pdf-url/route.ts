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
  const { pdf_url } = await req.json()
  if (!pdf_url) return NextResponse.json({ error: 'No URL' }, { status: 400, headers: corsHeaders })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdminClient() as any
  const { error } = await admin.from('submissions').update({ pdf_url }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ success: true }, { headers: corsHeaders })
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}
const API_KEY = process.env.PPM_API_KEY || 'ppm_live_2026_secure_key'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (req.headers.get('x-api-key') !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }
  const { id } = await params
  const body = await req.json()
  const supabase = getSupabaseAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('scheduled_jobs').update({ status: 'completed', submission_id: body.submission_id || null }).eq('id', id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ ok: true }, { headers: corsHeaders })
}
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}
const API_KEY = process.env.PPM_API_KEY || 'ppm_live_2026_secure_key'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  const supabase = getSupabaseAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any).from('scheduled_jobs').select('*').order('scheduled_date', { ascending: true })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json([], { headers: corsHeaders })
  return NextResponse.json(data || [], { headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-api-key') !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }
  const body = await req.json()
  const supabase = getSupabaseAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('scheduled_jobs').insert(body).select().single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ ok: true, job: data }, { headers: corsHeaders })
}
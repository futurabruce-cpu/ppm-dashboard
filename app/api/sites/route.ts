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

// GET /api/sites?q=Albany — search sites
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  if (!q || q.length < 2) {
    return NextResponse.json([], { headers: corsHeaders })
  }

  const supabase = getSupabaseAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('sites')
    .select('name, address')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(8)

  if (error) {
    // Table may not exist yet — return empty
    return NextResponse.json([], { headers: corsHeaders })
  }

  return NextResponse.json(data || [], { headers: corsHeaders })
}

// POST /api/sites — upsert a site (called on worksheet submit)
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const body = await req.json()
  const { name, address } = body

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ ok: false }, { headers: corsHeaders })
  }

  const supabase = getSupabaseAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('sites')
    .upsert({ name: name.trim(), address: (address || '').trim() }, { onConflict: 'name' })

  if (error) {
    console.error('Site upsert error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { headers: corsHeaders })
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders })
}

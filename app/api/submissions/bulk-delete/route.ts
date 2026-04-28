import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body as { ids?: string[] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdminClient() as any
    const { error } = await admin
      .from('submissions')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('bulk-delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, deleted: ids.length })
  } catch (err: any) {
    console.error('bulk-delete unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

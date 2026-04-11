import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

// One-shot migration endpoint — creates the sites table
// Call once: GET /api/setup-sites?key=ppm_live_2026_secure_key
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (key !== (process.env.PPM_API_KEY || 'ppm_live_2026_secure_key')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdminClient()

  // Try inserting a dummy row to see if table exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: checkError } = await (supabase as any).from('sites').select('id').limit(1)

  if (!checkError) {
    return NextResponse.json({ ok: true, message: 'sites table already exists' })
  }

  // Table doesn't exist — create it via pg function
  // We'll use a workaround: create via supabase-js schema management isn't possible,
  // so we return instructions
  return NextResponse.json({
    ok: false,
    message: 'sites table does not exist. Please run the following SQL in your Supabase dashboard SQL editor:',
    sql: `
CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sites_name_unique UNIQUE (name)
);
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read" ON public.sites FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.sites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service upsert" ON public.sites FOR UPDATE USING (true);
    `.trim()
  })
}

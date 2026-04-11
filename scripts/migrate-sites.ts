// Run with: npx tsx scripts/migrate-sites.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrate() {
  // Create sites table via raw SQL using service role
  const { error } = await supabase.rpc('run_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.sites (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        address text,
        created_at timestamptz DEFAULT now(),
        CONSTRAINT sites_name_unique UNIQUE (name)
      );
      ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
      CREATE POLICY IF NOT EXISTS "Allow anon read" ON public.sites FOR SELECT USING (true);
      CREATE POLICY IF NOT EXISTS "Allow anon insert" ON public.sites FOR INSERT WITH CHECK (true);
      CREATE POLICY IF NOT EXISTS "Allow anon upsert" ON public.sites FOR UPDATE USING (true);
    `
  })
  if (error) console.error('Error:', error)
  else console.log('✅ sites table ready')
}

migrate()

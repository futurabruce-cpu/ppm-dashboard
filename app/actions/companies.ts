'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export async function createCompany(formData: FormData) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = getSupabaseAdminClient() as AnyClient
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'superadmin') {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const { error } = await admin.from('companies').insert({ name })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/companies')
  return { success: true }
}

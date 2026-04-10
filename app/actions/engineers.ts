'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function createEngineer(formData: FormData) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const profile = data as { role: string; company_id: string | null } | null
  if (!profile || profile.role === 'engineer') return { error: 'Unauthorized' }

  const full_name = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const company_id_override = formData.get('company_id') as string | null
  const company_id = (profile.role === 'superadmin' && company_id_override) ? company_id_override : profile.company_id

  if (!full_name || !email || !password || !company_id) return { error: 'Missing required fields' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdminClient() as any
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (createError) return { error: createError.message }

  const { error: profileError } = await admin.from('profiles').insert({
    id: newUser.user.id,
    company_id,
    full_name,
    role: 'engineer',
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(newUser.user.id)
    return { error: profileError.message }
  }

  revalidatePath('/dashboard/engineers')
  return { success: true }
}

export async function addEngineer(formData: FormData) {
  return createEngineer(formData)
}

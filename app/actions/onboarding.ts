'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createOrganization(
  prevState: { error: string } | null,
  formData: FormData
) {
  // Verify the user is authenticated via the server client (respects RLS/cookies)
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  const name = (formData.get('name') as string).trim()
  const tin = (formData.get('tin') as string | null)?.trim() || null
  const rdoCode = (formData.get('rdo_code') as string | null)?.trim() || null
  const address = (formData.get('address') as string | null)?.trim() || null
  const industry = (formData.get('industry') as string | null) || null
  const vatRegistered = formData.get('vat_registered') === 'true'

  if (!name) {
    return { error: 'Business name is required.' }
  }

  // Use admin client for bootstrapping — user has no org membership yet so RLS blocks both inserts
  const admin = createAdminClient()

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name, tin, rdo_code: rdoCode, address, industry, vat_registered: vatRegistered })
    .select('id')
    .single()

  if (orgError || !org) {
    return { error: orgError?.message ?? 'Failed to create organization.' }
  }

  const { error: memberError } = await admin
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    })

  if (memberError) {
    return { error: memberError.message }
  }

  redirect('/dashboard')
}

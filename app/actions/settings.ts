'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'

export async function updateOrganization(
  prevState: { error: string; success?: boolean } | null,
  formData: FormData
) {
  const { supabase, orgId } = await requireOrg()

  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Business name is required.' }

  const { error } = await supabase
    .from('organizations')
    .update({
      name,
      tin: (formData.get('tin') as string) || null,
      rdo_code: (formData.get('rdo_code') as string) || null,
      address: (formData.get('address') as string) || null,
      industry: (formData.get('industry') as string) || null,
      vat_registered: formData.get('vat_registered') === 'true',
    })
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { error: '', success: true }
}

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
      bir_cas_accredited: formData.get('bir_cas_accredited') === 'true',
      or_number_prefix: (formData.get('or_number_prefix') as string) || null,
      bir_atp_number: (formData.get('bir_atp_number') as string) || null,
      bir_accreditation_no: (formData.get('bir_accreditation_no') as string) || null,
      or_series_from: (formData.get('or_series_from') as string) || null,
      or_series_to: (formData.get('or_series_to') as string) || null,
    })
    .eq('id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { error: '', success: true }
}

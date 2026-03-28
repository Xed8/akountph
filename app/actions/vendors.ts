'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'

export async function createVendor(prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase.from('vendors').insert({
    organization_id: orgId,
    name: formData.get('name') as string,
    tin: (formData.get('tin') as string) || null,
    address: (formData.get('address') as string) || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    contact_person: (formData.get('contact_person') as string) || null,
    is_vat_registered: formData.get('is_vat_registered') === 'true',
    default_ewt_rate: parseFloat((formData.get('default_ewt_rate') as string) || '0') || 0,
    notes: (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/vendors')
  redirect('/vendors')
}

export async function updateVendor(id: string, prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase
    .from('vendors')
    .update({
      name: formData.get('name') as string,
      tin: (formData.get('tin') as string) || null,
      address: (formData.get('address') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      contact_person: (formData.get('contact_person') as string) || null,
      is_vat_registered: formData.get('is_vat_registered') === 'true',
      default_ewt_rate: parseFloat((formData.get('default_ewt_rate') as string) || '0') || 0,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/vendors')
  revalidatePath(`/vendors/${id}`)
  redirect('/vendors')
}

export async function archiveVendor(id: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('vendors')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/vendors')
  redirect('/vendors')
}

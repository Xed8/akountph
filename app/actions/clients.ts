'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'

export async function createClient(prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase.from('clients').insert({
    organization_id: orgId,
    name: formData.get('name') as string,
    tin: (formData.get('tin') as string) || null,
    address: (formData.get('address') as string) || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    contact_person: (formData.get('contact_person') as string) || null,
    is_vat_registered: formData.get('is_vat_registered') === 'true',
    notes: (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/clients')
  redirect('/clients')
}

export async function updateClient(id: string, prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase
    .from('clients')
    .update({
      name: formData.get('name') as string,
      tin: (formData.get('tin') as string) || null,
      address: (formData.get('address') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      contact_person: (formData.get('contact_person') as string) || null,
      is_vat_registered: formData.get('is_vat_registered') === 'true',
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect('/clients')
}

export async function archiveClient(id: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/clients')
  redirect('/clients')
}

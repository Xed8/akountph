'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'
import { pesosToCentavos } from '@/lib/formatting/currency'

export async function createItem(prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase.from('items').insert({
    organization_id: orgId,
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    unit: (formData.get('unit') as string) || 'pc',
    sale_price: pesosToCentavos(formData.get('sale_price') as string),
    is_vat_exempt: formData.get('is_vat_exempt') === 'true',
    category: (formData.get('category') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/items')
  redirect('/items')
}

export async function updateItem(id: string, prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase
    .from('items')
    .update({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      unit: (formData.get('unit') as string) || 'pc',
      sale_price: pesosToCentavos(formData.get('sale_price') as string),
      is_vat_exempt: formData.get('is_vat_exempt') === 'true',
      category: (formData.get('category') as string) || null,
    })
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/items')
  redirect('/items')
}

export async function archiveItem(id: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/items')
  redirect('/items')
}

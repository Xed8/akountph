'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'

export async function createCategory(prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase.from('expense_categories').insert({
    organization_id: orgId,
    name: formData.get('name') as string,
    type: (formData.get('type') as string) || 'expense',
    color: (formData.get('color') as string) || '#6B7280',
    gl_account_code: (formData.get('gl_account_code') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/settings/categories')
}

export async function updateCategory(id: string, prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase
    .from('expense_categories')
    .update({
      name: formData.get('name') as string,
      type: (formData.get('type') as string) || 'expense',
      color: (formData.get('color') as string) || '#6B7280',
      gl_account_code: (formData.get('gl_account_code') as string) || null,
    })
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/settings/categories')
}

export async function deleteCategory(id: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/settings/categories')
}

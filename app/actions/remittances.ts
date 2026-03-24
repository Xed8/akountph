'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'

export async function markRemittancePaid(id: string, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const referenceNumber = (formData.get('reference_number') as string)?.trim() || null
  const paidDate = (formData.get('paid_date') as string) || new Date().toISOString().split('T')[0]

  await supabase
    .from('remittances')
    .update({ status: 'paid', paid_date: paidDate, reference_number: referenceNumber })
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/remittances')
  revalidatePath('/dashboard')
}

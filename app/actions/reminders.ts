'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'

export async function logReminderSent(invoiceId: string, message: string, daysOverdue: number) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('payment_reminders')
    .insert({
      organization_id: orgId,
      invoice_id: invoiceId,
      channel: 'manual',
      message,
      days_overdue: daysOverdue,
    })

  revalidatePath('/reminders')
}

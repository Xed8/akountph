'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { pesosToCentavos } from '@/lib/formatting/currency'

export async function createRecurringTemplate(
  prevState: { error: string } | null | void,
  formData: FormData
) {
  const { supabase, orgId } = await requireOrg()

  const type = (formData.get('type') as string) || 'invoice'
  const amount = pesosToCentavos(formData.get('amount') as string)
  if (amount <= 0) return { error: 'Amount must be greater than zero.' }

  const { error } = await supabase.from('recurring_templates').insert({
    organization_id: orgId,
    type,
    name: formData.get('name') as string,
    client_id:   type === 'invoice' ? ((formData.get('client_id') as string) || null) : null,
    vendor_id:   type === 'bill'    ? ((formData.get('vendor_id') as string) || null) : null,
    category_id: (formData.get('category_id') as string) || null,
    description: formData.get('description') as string,
    amount,
    has_vat:   formData.get('has_vat') === 'true',
    ewt_rate:  parseFloat((formData.get('ewt_rate') as string) || '0') || 0,
    frequency: (formData.get('frequency') as string) || 'monthly',
    next_due:  formData.get('next_due') as string,
    is_active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/recurring')
  redirect('/recurring')
}

export async function updateRecurringTemplate(
  id: string,
  prevState: { error: string } | null | void,
  formData: FormData
) {
  const { supabase, orgId } = await requireOrg()

  const type = (formData.get('type') as string) || 'invoice'
  const amount = pesosToCentavos(formData.get('amount') as string)
  if (amount <= 0) return { error: 'Amount must be greater than zero.' }

  const { error } = await supabase
    .from('recurring_templates')
    .update({
      type,
      name: formData.get('name') as string,
      client_id:   type === 'invoice' ? ((formData.get('client_id') as string) || null) : null,
      vendor_id:   type === 'bill'    ? ((formData.get('vendor_id') as string) || null) : null,
      category_id: (formData.get('category_id') as string) || null,
      description: formData.get('description') as string,
      amount,
      has_vat:   formData.get('has_vat') === 'true',
      ewt_rate:  parseFloat((formData.get('ewt_rate') as string) || '0') || 0,
      frequency: (formData.get('frequency') as string) || 'monthly',
      next_due:  formData.get('next_due') as string,
    })
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/recurring')
  redirect('/recurring')
}

export async function toggleRecurring(id: string, isActive: boolean) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('recurring_templates')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/recurring')
}

export async function deleteRecurringTemplate(id: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('recurring_templates')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/recurring')
  redirect('/recurring')
}

export async function generateFromTemplate(id: string): Promise<void> {
  const { supabase, orgId } = await requireOrg()

  const { data: tmpl } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (!tmpl) return

  const today = new Date().toISOString().split('T')[0]

  if (tmpl.type === 'invoice') {
    const { data: org } = await supabase
      .from('organizations')
      .select('vat_registered, or_number_prefix, or_number_last')
      .eq('id', orgId)
      .single()

    const vatAmount = tmpl.has_vat ? Math.round(tmpl.amount * 0.12) : 0
    const totalAmount = tmpl.amount + vatAmount
    const ewtAmount = Math.round(tmpl.amount * (Number(tmpl.ewt_rate) / 100))

    const newLast = (org?.or_number_last ?? 0) + 1
    const orNumber = `${org?.or_number_prefix ?? 'OR-'}${new Date().getFullYear()}-${String(newLast).padStart(4, '0')}`

    await supabase.from('organizations').update({ or_number_last: newLast }).eq('id', orgId)

    await supabase.from('invoices').insert({
      organization_id: orgId,
      client_id: tmpl.client_id,
      invoice_number: orNumber,
      or_number: orNumber,
      invoice_date: today,
      type: 'invoice',
      subtotal: tmpl.amount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      ewt_rate: tmpl.ewt_rate,
      ewt_amount: ewtAmount,
      status: 'unpaid',
      paid_amount: 0,
      notes: `Generated from recurring: ${tmpl.name}`,
    })
  } else {
    const vatAmount = tmpl.has_vat ? Math.round(tmpl.amount * (12 / 112)) : 0
    const amountExVat = tmpl.amount - vatAmount
    const ewtAmount = Math.round(amountExVat * (Number(tmpl.ewt_rate) / 100))
    const totalAmount = tmpl.amount - ewtAmount

    await supabase.from('expenses').insert({
      organization_id: orgId,
      vendor_id: tmpl.vendor_id,
      category_id: tmpl.category_id,
      expense_date: today,
      description: tmpl.description,
      amount: tmpl.amount,
      vat_amount: vatAmount,
      ewt_rate: tmpl.ewt_rate,
      ewt_amount: ewtAmount,
      total_amount: totalAmount,
      status: 'received',
      paid_amount: 0,
      notes: `Generated from recurring: ${tmpl.name}`,
    })
  }

  // Advance next_due date
  const nextDue = new Date(tmpl.next_due)
  if (tmpl.frequency === 'weekly')      nextDue.setDate(nextDue.getDate() + 7)
  else if (tmpl.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1)
  else if (tmpl.frequency === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3)

  await supabase
    .from('recurring_templates')
    .update({ last_generated: today, next_due: nextDue.toISOString().split('T')[0] })
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/recurring')
  revalidatePath('/invoices')
  revalidatePath('/bills')
}

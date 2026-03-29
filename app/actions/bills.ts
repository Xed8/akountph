'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'
import { pesosToCentavos } from '@/lib/formatting/currency'

export async function createBill(prevState: { error: string } | null | void, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const vendorId = (formData.get('vendor_id') as string) || null
  const categoryId = (formData.get('category_id') as string) || null
  const expenseDate = formData.get('expense_date') as string
  const dueDate = (formData.get('due_date') as string) || null
  const description = formData.get('description') as string
  const billNumber = (formData.get('bill_number') as string) || null
  const notes = (formData.get('notes') as string) || null

  const amount = pesosToCentavos(formData.get('amount') as string)
  if (amount <= 0) return { error: 'Amount must be greater than zero.' }

  const hasVat = formData.get('has_vat') === 'true'
  const vatAmount = hasVat ? Math.round(amount * (12 / 112)) : 0  // extract VAT from inclusive amount

  const ewtRate = parseFloat((formData.get('ewt_rate') as string) || '0') || 0
  const atcCode = (formData.get('atc_code') as string) || null
  // EWT is computed on the amount exclusive of VAT
  const amountExVat = amount - vatAmount
  const ewtAmount = Math.round(amountExVat * (ewtRate / 100))

  const totalAmount = amount - ewtAmount  // net payable to vendor

  const { data: bill, error } = await supabase
    .from('expenses')
    .insert({
      organization_id: orgId,
      vendor_id: vendorId,
      category_id: categoryId,
      expense_date: expenseDate,
      due_date: dueDate,
      description,
      bill_number: billNumber,
      amount,
      vat_amount: vatAmount,
      ewt_rate: ewtRate,
      ewt_amount: ewtAmount,
      atc_code: atcCode,
      total_amount: totalAmount,
      status: 'received',
      paid_amount: 0,
      notes,
    })
    .select('id')
    .single()

  if (error || !bill) return { error: error?.message ?? 'Failed to create bill.' }

  revalidatePath('/bills')
  redirect(`/bills/${bill.id}`)
}

export async function cancelBill(id: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('expenses')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/bills')
  revalidatePath(`/bills/${id}`)
}

export async function recordBillPayment(
  billId: string,
  prevState: { error: string } | null,
  formData: FormData
) {
  const { supabase, orgId } = await requireOrg()

  const amount = pesosToCentavos(formData.get('amount') as string)
  const paymentDate = formData.get('payment_date') as string
  const paymentMethod = (formData.get('payment_method') as string) || 'cash'
  const reference = (formData.get('reference') as string) || null

  if (amount <= 0) return { error: 'Amount must be greater than zero.' }

  const { data: bill } = await supabase
    .from('expenses')
    .select('total_amount, paid_amount, status')
    .eq('id', billId)
    .eq('organization_id', orgId)
    .single()

  if (!bill) return { error: 'Bill not found.' }
  if (bill.status === 'cancelled') return { error: 'Cannot record payment on a cancelled bill.' }
  if (bill.status === 'paid') return { error: 'Bill is already fully paid.' }

  const newPaidAmount = (bill.paid_amount ?? 0) + amount
  if (newPaidAmount > bill.total_amount) {
    return { error: 'Payment amount exceeds the bill total.' }
  }

  const newStatus = newPaidAmount >= bill.total_amount ? 'paid' : 'partial'

  await supabase
    .from('expenses')
    .update({
      paid_amount: newPaidAmount,
      status: newStatus,
    })
    .eq('id', billId)
    .eq('organization_id', orgId)

  revalidatePath('/bills')
  revalidatePath(`/bills/${billId}`)
  redirect(`/bills/${billId}`)
}

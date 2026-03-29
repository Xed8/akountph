'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'
import { pesosToCentavos } from '@/lib/formatting/currency'
import { computeVAT } from '@/lib/invoices/vat'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number   // centavos
  total: number        // centavos
  is_vat_exempt: boolean
}

export async function createInvoice(prevState: { error: string } | null, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const clientId = formData.get('client_id') as string
  const invoiceDate = formData.get('invoice_date') as string
  const dueDate = (formData.get('due_date') as string) || null
  const notes = (formData.get('notes') as string) || null
  const ewtRate = parseFloat((formData.get('ewt_rate') as string) || '0')
  const atcCode = (formData.get('atc_code') as string) || null

  // Parse line items from formData (JSON-encoded array from client)
  let lineItems: InvoiceLineItem[] = []
  try {
    lineItems = JSON.parse(formData.get('line_items') as string)
  } catch {
    return { error: 'Invalid line items data.' }
  }

  if (!lineItems.length) return { error: 'Add at least one line item.' }

  // Get org VAT registration status
  const { data: org } = await supabase
    .from('organizations')
    .select('vat_registered')
    .eq('id', orgId)
    .single()

  const isVatRegistered = org?.vat_registered ?? false

  // Compute totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const vatableAmount = lineItems
    .filter(item => !item.is_vat_exempt)
    .reduce((sum, item) => sum + item.total, 0)
  const { vatAmount } = computeVAT(vatableAmount, isVatRegistered)
  const totalAmount = subtotal + vatAmount
  const ewtAmount = Math.round(totalAmount * (ewtRate / 100))

  // Get next OR number atomically via DB function
  const admin = getAdminClient()
  const { data: orNumberData, error: orErr } = await admin.rpc('get_next_or_number', {
    p_org_id: orgId,
  })
  if (orErr) return { error: 'Could not generate OR number.' }

  const orNumber = orNumberData as string

  // Insert invoice
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      organization_id: orgId,
      client_id: clientId || null,
      invoice_number: orNumber,
      or_number: orNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      type: 'invoice',
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      ewt_rate: ewtRate,
      ewt_amount: ewtAmount,
      atc_code: atcCode,
      status: 'unpaid',
      paid_amount: 0,
      notes,
    })
    .select('id')
    .single()

  if (invErr || !invoice) return { error: invErr?.message ?? 'Failed to create invoice.' }

  // Insert line items
  const items = lineItems.map(item => ({
    invoice_id: invoice.id,
    organization_id: orgId,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
  }))

  await supabase.from('invoice_items').insert(items)

  revalidatePath('/invoices')
  redirect(`/invoices/${invoice.id}`)
}

export async function voidInvoice(id: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('invoices')
    .update({ status: 'void' })
    .eq('id', id)
    .eq('organization_id', orgId)

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
}

export async function recordPayment(
  invoiceId: string,
  prevState: { error: string } | null,
  formData: FormData
) {
  const { supabase, orgId } = await requireOrg()

  const amount = pesosToCentavos(formData.get('amount') as string)
  const paymentDate = formData.get('payment_date') as string
  const paymentMethod = (formData.get('payment_method') as string) || 'cash'
  const reference = (formData.get('reference') as string) || null

  if (amount <= 0) return { error: 'Amount must be greater than zero.' }

  // Get current invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total_amount, paid_amount, status')
    .eq('id', invoiceId)
    .eq('organization_id', orgId)
    .single()

  if (!invoice) return { error: 'Invoice not found.' }
  if (invoice.status === 'void') return { error: 'Cannot record payment on a void invoice.' }
  if (invoice.status === 'paid') return { error: 'Invoice is already fully paid.' }

  const newPaidAmount = invoice.paid_amount + amount
  if (newPaidAmount > invoice.total_amount) {
    return { error: 'Payment amount exceeds the invoice total.' }
  }

  const newStatus = newPaidAmount >= invoice.total_amount ? 'paid' : 'partial'

  // Insert payment record
  const { error: payErr } = await supabase.from('invoice_payments').insert({
    organization_id: orgId,
    invoice_id: invoiceId,
    payment_date: paymentDate,
    amount,
    payment_method: paymentMethod,
    reference,
  })
  if (payErr) return { error: payErr.message }

  // Update invoice paid_amount and status
  await supabase
    .from('invoices')
    .update({
      paid_amount: newPaidAmount,
      status: newStatus,
      paid_date: newStatus === 'paid' ? paymentDate : null,
    })
    .eq('id', invoiceId)
    .eq('organization_id', orgId)

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  redirect(`/invoices/${invoiceId}`)
}

'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'
import { pesosToCentavos } from '@/lib/formatting/currency'

export async function createBankAccount(
  prevState: { error: string } | null,
  formData: FormData
) {
  const { supabase, orgId } = await requireOrg()

  const accountName = (formData.get('account_name') as string).trim()
  const bankName    = (formData.get('bank_name') as string).trim()
  if (!accountName || !bankName) return { error: 'Account name and bank name are required.' }

  const openingBalance = pesosToCentavos(formData.get('opening_balance') as string)

  const { data, error } = await supabase
    .from('bank_accounts')
    .insert({
      organization_id: orgId,
      account_name: accountName,
      bank_name: bankName,
      account_number: (formData.get('account_number') as string) || null,
      opening_balance: openingBalance,
      current_balance: openingBalance,
    })
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Failed to create account.' }

  revalidatePath('/bank')
  redirect(`/bank/${data.id}`)
}

export async function addBankTransaction(
  prevState: { error: string } | null,
  formData: FormData
) {
  const { supabase, orgId } = await requireOrg()

  const bankAccountId = formData.get('bank_account_id') as string
  const type          = formData.get('type') as 'credit' | 'debit'
  const amountPesos   = parseFloat(formData.get('amount') as string) || 0
  if (amountPesos <= 0) return { error: 'Amount must be greater than zero.' }

  const amountCentavos = Math.round(amountPesos * 100)
  // Store credits as positive, debits as negative
  const signedAmount = type === 'debit' ? -amountCentavos : amountCentavos

  const { error: txErr } = await supabase
    .from('bank_transactions')
    .insert({
      organization_id: orgId,
      bank_account_id: bankAccountId,
      transaction_date: formData.get('transaction_date') as string,
      description: (formData.get('description') as string).trim(),
      reference: (formData.get('reference') as string) || null,
      amount: signedAmount,
      type,
      notes: (formData.get('notes') as string) || null,
    })

  if (txErr) return { error: txErr.message }

  // Update running balance on bank account
  const delta = signedAmount
  await supabase.rpc('increment_bank_balance', {
    p_account_id: bankAccountId,
    p_delta: delta,
  }).maybeSingle()

  revalidatePath(`/bank/${bankAccountId}`)
  return null
}

export async function reconcileTransaction(txId: string, bankAccountId: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('bank_transactions')
    .update({ is_reconciled: true, reconciled_at: new Date().toISOString() })
    .eq('id', txId)
    .eq('organization_id', orgId)

  revalidatePath(`/bank/${bankAccountId}`)
}

export async function unreconcileTransaction(txId: string, bankAccountId: string) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('bank_transactions')
    .update({ is_reconciled: false, reconciled_at: null })
    .eq('id', txId)
    .eq('organization_id', orgId)

  revalidatePath(`/bank/${bankAccountId}`)
}

export async function deleteBankTransaction(txId: string, bankAccountId: string, amount: number) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('bank_transactions')
    .delete()
    .eq('id', txId)
    .eq('organization_id', orgId)

  // Reverse balance effect
  await supabase.rpc('increment_bank_balance', {
    p_account_id: bankAccountId,
    p_delta: -amount,
  }).maybeSingle()

  revalidatePath(`/bank/${bankAccountId}`)
}

'use client'

import { useActionState } from 'react'
import { addBankTransaction } from '@/app/actions/bank'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type State = { error: string } | null

export function AddTransactionForm({ bankAccountId }: { bankAccountId: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(addBankTransaction, null)

  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {state?.error && (
        <p className="md:col-span-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
      )}
      <input type="hidden" name="bank_account_id" value={bankAccountId} />

      <div className="space-y-1.5">
        <Label htmlFor="transaction_date">Date *</Label>
        <Input id="transaction_date" name="transaction_date" type="date" required
          defaultValue={new Date().toISOString().split('T')[0]} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Type *</Label>
        <select id="type" name="type" required
          className="w-full border border-[#D8E2EE] rounded-lg px-3 py-2 text-sm text-[#1A2B3C] bg-white focus:outline-none focus:border-[#00C48C]">
          <option value="credit">Credit (money in)</option>
          <option value="debit">Debit (money out)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (₱) *</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" />
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="description">Description *</Label>
        <Input id="description" name="description" required placeholder="e.g. Client payment — ABC Corp" maxLength={255} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reference">Reference / Check No.</Label>
        <Input id="reference" name="reference" placeholder="e.g. CHK-001" maxLength={100} />
      </div>

      <div className="md:col-span-3">
        <Button type="submit" disabled={pending} className="bg-[#00C48C] hover:bg-[#009E72] text-white">
          {pending ? 'Adding…' : 'Add Entry'}
        </Button>
      </div>
    </form>
  )
}

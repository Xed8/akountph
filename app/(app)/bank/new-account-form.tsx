'use client'

import { useActionState } from 'react'
import { createBankAccount } from '@/app/actions/bank'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type State = { error: string } | null

export function NewBankAccountForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(createBankAccount, null)

  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {state?.error && (
        <p className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="account_name">Account Name *</Label>
        <Input id="account_name" name="account_name" required placeholder="e.g. BDO Checking" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bank_name">Bank *</Label>
        <Input id="bank_name" name="bank_name" required placeholder="e.g. BDO Unibank" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="account_number">Account Number</Label>
        <Input id="account_number" name="account_number" placeholder="e.g. 0012345678" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="opening_balance">Opening Balance (₱)</Label>
        <Input id="opening_balance" name="opening_balance" type="number" step="0.01" min="0" defaultValue="0" placeholder="0.00" />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending} className="bg-[#00C48C] hover:bg-[#009E72] text-white">
          {pending ? 'Adding…' : 'Add Account'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface Client { id: string; name: string }
interface Vendor { id: string; name: string; default_ewt_rate: number }
interface Category { id: string; name: string; type: string }

type ActionState = { error: string } | null | void

interface DefaultValues {
  type: 'invoice' | 'bill'
  name: string
  client_id: string | null
  vendor_id: string | null
  category_id: string | null
  description: string
  amount: string
  has_vat: boolean
  ewt_rate: string
  frequency: string
  next_due: string
}

interface RecurringFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  clients: Client[]
  vendors: Vendor[]
  categories: Category[]
  defaultValues?: DefaultValues
  submitLabel?: string
}

const EWT_RATES = [
  { label: 'None (0%)', value: '0' },
  { label: 'Goods / Services — 1%', value: '1' },
  { label: 'Services — 2%', value: '2' },
  { label: 'Professional Fees — 10%', value: '10' },
  { label: 'Professional Fees (Juridical) — 15%', value: '15' },
  { label: 'Rentals — 5%', value: '5' },
]

export function RecurringForm({ action, clients, vendors, categories, defaultValues, submitLabel }: RecurringFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const [type, setType] = useState<'invoice' | 'bill'>(defaultValues?.type ?? 'invoice')

  const expenseCategories = categories.filter(c => c.type === 'expense')

  // Default next_due to 1st of next month (used only when no defaultValues)
  const nextMonth = new Date()
  nextMonth.setDate(1)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const defaultNextDue = defaultValues?.next_due ?? nextMonth.toISOString().split('T')[0]

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="space-y-4 pt-4">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          {/* Type toggle */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(['invoice', 'bill'] as const).map(t => (
                <label key={t} className="flex-1 cursor-pointer">
                  <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
                  <span className={`block text-center py-2 rounded-lg border text-sm font-medium transition-colors ${type === t ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}>
                    {t === 'invoice' ? 'Recurring Invoice' : 'Recurring Bill'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Template Name *</Label>
            <Input id="name" name="name" required minLength={2} maxLength={200} placeholder="e.g. Monthly Retainer — Client A" defaultValue={defaultValues?.name} />
          </div>

          {type === 'invoice' ? (
            <div className="space-y-1.5">
              <Label htmlFor="client_id">Client</Label>
              <select id="client_id" name="client_id" defaultValue={defaultValues?.client_id ?? ''} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">— No client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="vendor_id">Vendor</Label>
                <select id="vendor_id" name="vendor_id" defaultValue={defaultValues?.vendor_id ?? ''} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— No vendor —</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category_id">Category</Label>
                <select id="category_id" name="category_id" defaultValue={defaultValues?.category_id ?? ''} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— Uncategorized —</option>
                  {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Input id="description" name="description" required minLength={2} maxLength={500} placeholder="e.g. Web maintenance services" defaultValue={defaultValues?.description} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₱) *</Label>
            <Input
              id="amount" name="amount"
              type="number" step="0.01" min="0.01" max="99999999.99"
              required placeholder="0.00"
              title="Enter a valid amount greater than 0 (e.g. 1500.00)"
              defaultValue={defaultValues?.amount}
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="has_vat" name="has_vat" value="true" defaultChecked={defaultValues?.has_vat} className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="has_vat" className="font-normal cursor-pointer">
              {type === 'invoice' ? 'Add 12% VAT to invoice' : 'Amount includes 12% VAT'}
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ewt_rate">EWT Rate</Label>
            <select id="ewt_rate" name="ewt_rate" defaultValue={defaultValues?.ewt_rate ?? '0'} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {EWT_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="frequency">Frequency</Label>
              <select id="frequency" name="frequency" defaultValue={defaultValues?.frequency ?? 'monthly'} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_due">Next Due *</Label>
              <Input id="next_due" name="next_due" type="date" required defaultValue={defaultNextDue} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Saving…' : (submitLabel ?? 'Create Template')}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

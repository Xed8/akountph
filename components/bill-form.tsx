'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface Vendor {
  id: string
  name: string
  default_ewt_rate: number
}

interface Category {
  id: string
  name: string
  type: string
}

type ActionState = { error: string } | null | void

interface BillFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  vendors: Vendor[]
  categories: Category[]
}

const EWT_RATES = [
  { label: 'None (0%)', value: '0' },
  { label: 'Goods / Services — 1%', value: '1' },
  { label: 'Services — 2%', value: '2' },
  { label: 'Professional Fees — 10%', value: '10' },
  { label: 'Professional Fees (Juridical) — 15%', value: '15' },
  { label: 'Rentals — 5%', value: '5' },
]

// ATC codes for creditable withholding on purchases (WC = Withholding on Compensation/Costs)
const ATC_EXPENSE = [
  { code: '',       label: '— None / Not applicable —' },
  { code: 'WC010',  label: 'WC010 — Professional fees (individuals) 10%' },
  { code: 'WC011',  label: 'WC011 — Professional fees (juridical) 15%' },
  { code: 'WC020',  label: 'WC020 — Rental (real property) 5%' },
  { code: 'WC030',  label: 'WC030 — Contractor / subcontractor 2%' },
  { code: 'WC040',  label: 'WC040 — Commission (individual) 10%' },
  { code: 'WC157',  label: 'WC157 — Purchases of goods (domestic) 1%' },
  { code: 'WC158',  label: 'WC158 — Purchases of services (domestic) 2%' },
  { code: 'WC160',  label: 'WC160 — Income payments to medical practitioners 15%' },
  { code: 'WC120',  label: 'WC120 — Royalties (literary / musical) 10%' },
]

const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Check', value: 'check' },
  { label: 'GCash', value: 'gcash' },
  { label: 'Maya', value: 'maya' },
]

export function BillForm({ action, vendors, categories }: BillFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const [amountStr, setAmountStr] = useState('')
  const [hasVat, setHasVat] = useState(false)
  const [ewtRate, setEwtRate] = useState(0)
  const [atcCode, setAtcCode] = useState('')

  const expenseCategories = categories.filter(c => c.type === 'expense')

  // Live computation for preview
  const amount = parseFloat(amountStr) || 0
  const vatAmount = hasVat ? amount * (12 / 112) : 0
  const amountExVat = amount - vatAmount
  const ewtAmount = amountExVat * (ewtRate / 100)
  const netPayable = amount - ewtAmount

  function handleVendorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const vendorId = e.target.value
    const vendor = vendors.find(v => v.id === vendorId)
    if (vendor) {
      setEwtRate(Number(vendor.default_ewt_rate ?? 0))
    }
  }

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="space-y-4 pt-4">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor_id">Vendor</Label>
              <select
                id="vendor_id"
                name="vendor_id"
                onChange={handleVendorChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">— No vendor —</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bill_number">Bill / OR Number</Label>
              <Input id="bill_number" name="bill_number" placeholder="e.g. SI-2025-001" maxLength={50} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Input id="description" name="description" required minLength={2} maxLength={500} placeholder="e.g. Office supplies purchase" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category_id">Category</Label>
            <select
              id="category_id"
              name="category_id"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="">— Uncategorized —</option>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="expense_date">Bill Date *</Label>
              <Input
                id="expense_date"
                name="expense_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₱) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max="99999999.99"
              required
              placeholder="0.00"
              title="Enter a valid amount greater than 0 (e.g. 1500.00)"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
            />
          </div>

          <div className="space-y-3 rounded-lg border bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_vat"
                name="has_vat"
                value="true"
                checked={hasVat}
                onChange={e => setHasVat(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="has_vat" className="font-normal cursor-pointer">
                Amount includes 12% VAT (input VAT)
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ewt_rate">EWT Rate (Creditable Withholding Tax)</Label>
              <select
                id="ewt_rate"
                name="ewt_rate"
                value={String(ewtRate)}
                onChange={e => setEwtRate(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {EWT_RATES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="atc_code">ATC (Alphanumeric Tax Code)</Label>
              <select
                id="atc_code"
                name="atc_code"
                value={atcCode}
                onChange={e => setAtcCode(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {ATC_EXPENSE.map(a => (
                  <option key={a.code} value={a.code}>{a.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Required for 1601-EQ / EWT filings</p>
            </div>

            {/* Live tax preview */}
            {amount > 0 && (
              <div className="text-xs space-y-1 pt-1 border-t text-gray-600">
                <div className="flex justify-between">
                  <span>Gross Amount</span>
                  <span className="font-mono">₱{amount.toFixed(2)}</span>
                </div>
                {hasVat && (
                  <div className="flex justify-between text-gray-400">
                    <span>Input VAT (12%)</span>
                    <span className="font-mono">₱{vatAmount.toFixed(2)}</span>
                  </div>
                )}
                {ewtRate > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>EWT ({ewtRate}%) deducted</span>
                    <span className="font-mono">−₱{ewtAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Net Payable to Vendor</span>
                  <span className="font-mono">₱{netPayable.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Saving…' : 'Create Bill'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

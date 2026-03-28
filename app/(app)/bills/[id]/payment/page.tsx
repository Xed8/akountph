'use client'

import { use } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { recordBillPayment } from '@/app/actions/bills'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

type ActionState = { error: string } | null

const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Check', value: 'check' },
  { label: 'GCash', value: 'gcash' },
  { label: 'Maya', value: 'maya' },
]

export default function BillPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const action = recordBillPayment.bind(null, id)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

  return (
    <div className="p-8 max-w-md">
      <Link href={`/bills/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Bill
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Record Payment</h1>

      <Card>
        <CardContent className="space-y-4 pt-4">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount Paid (₱) *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max="99999999.99"
              required
              placeholder="0.00"
              title="Enter the amount paid (e.g. 5000.00)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment_date">Payment Date *</Label>
            <Input
              id="payment_date"
              name="payment_date"
              type="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment_method">Payment Method</Label>
            <select
              id="payment_method"
              name="payment_method"
              defaultValue="cash"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference">Reference / Check No.</Label>
            <Input id="reference" name="reference" placeholder="Optional" />
          </div>

          <Button type="submit" className="w-full" formAction={formAction} disabled={pending}>
            {pending ? 'Saving…' : 'Record Payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

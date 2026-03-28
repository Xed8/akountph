'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { recordPayment } from '@/app/actions/invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'credit_card', label: 'Credit Card' },
]

export default function RecordPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const recordWithId = recordPayment.bind(null, id)
  const [state, formAction, pending] = useActionState(recordWithId, null)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-8">
      <Link href={`/invoices/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Invoice
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Record Payment</h1>

      <Card className="max-w-md">
        <CardHeader><CardTitle className="text-base">Payment Details</CardTitle></CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {state.error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount Received (₱) *</Label>
              <Input id="amount" name="amount" type="number" min="0.01" max="99999999.99" step="0.01" required placeholder="0.00" title="Enter the amount received (e.g. 5000.00)" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input id="payment_date" name="payment_date" type="date" required defaultValue={today} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select name="payment_method" defaultValue="cash">
                <SelectTrigger id="payment_method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reference">Reference / Check # / Transaction ID</Label>
              <Input id="reference" name="reference" placeholder="Optional" />
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Saving…' : 'Save Payment'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

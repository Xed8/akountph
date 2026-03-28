import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { cancelBill } from '@/app/actions/bills'
import { ChevronLeft } from 'lucide-react'
import { ConfirmButton } from '@/components/confirm-button'

const STATUS_COLORS: Record<string, string> = {
  received:  'bg-amber-50 text-amber-700 border-amber-200',
  partial:   'bg-blue-50 text-blue-700 border-blue-200',
  paid:      'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-400 border-gray-200',
  draft:     'bg-gray-50 text-gray-500 border-gray-200',
}

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Cash', bank_transfer: 'Bank Transfer', check: 'Check',
  gcash: 'GCash', maya: 'Maya', credit_card: 'Credit Card',
}

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const { data: bill } = await supabase
    .from('expenses')
    .select(`
      *,
      vendors(name, tin, address),
      expense_categories(name)
    `)
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (!bill) notFound()

  const vendor = (bill.vendors as unknown) as { name: string; tin: string | null; address: string | null } | null
  const category = (bill.expense_categories as unknown) as { name: string } | null
  const balance = bill.total_amount - (bill.paid_amount ?? 0)
  const canPay = bill.status !== 'paid' && bill.status !== 'cancelled'

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/bills" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4 mr-1" />Back to Bills
        </Link>
        <div className="flex items-center gap-3">
          {canPay && (
            <>
              <Link
                href={`/bills/${id}/payment`}
                className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Record Payment
              </Link>
              <form action={cancelBill.bind(null, id)}>
                <ConfirmButton message="Cancel this bill? This cannot be undone." className="text-sm text-red-600 hover:underline">
                  Cancel
                </ConfirmButton>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Bill card */}
      <div className="border rounded-xl bg-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Bill</p>
            <p className="text-xl font-bold text-gray-900 font-mono truncate max-w-[320px]">{bill.bill_number ?? '—'}</p>
            <div className="mt-2 space-y-0.5 text-sm text-gray-500">
              <p>Date: {bill.expense_date}</p>
              {bill.due_date && <p>Due: {bill.due_date}</p>}
              {category && <p>Category: {category.name}</p>}
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded border text-sm font-medium ${STATUS_COLORS[bill.status] ?? ''}`}>
            {bill.status}
          </span>
        </div>

        {/* Vendor */}
        {vendor && (
          <div className="px-6 py-4 border-b bg-gray-50">
            <p className="text-xs text-gray-400 mb-1">Vendor</p>
            <p className="font-semibold text-gray-900">{vendor.name}</p>
            {vendor.tin && <p className="text-sm text-gray-500">TIN: {vendor.tin}</p>}
            {vendor.address && <p className="text-sm text-gray-500">{vendor.address}</p>}
          </div>
        )}

        {/* Description */}
        <div className="px-6 py-4 border-b">
          <p className="text-xs text-gray-400 mb-1">Description</p>
          <p className="text-sm text-gray-900">{bill.description}</p>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Gross Amount</span>
            <span className="font-mono">{centavosToDisplay(bill.amount)}</span>
          </div>
          {bill.vat_amount > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Input VAT (12%)</span>
              <span className="font-mono">{centavosToDisplay(bill.vat_amount)}</span>
            </div>
          )}
          {bill.ewt_amount > 0 && (
            <div className="flex justify-between text-sm text-amber-600">
              <span>EWT ({bill.ewt_rate}%) deducted</span>
              <span className="font-mono">−{centavosToDisplay(bill.ewt_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2">
            <span>Net Payable</span>
            <span className="font-mono">{centavosToDisplay(bill.total_amount)}</span>
          </div>
          {(bill.paid_amount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Paid</span>
              <span className="font-mono">{centavosToDisplay(bill.paid_amount ?? 0)}</span>
            </div>
          )}
          {canPay && balance > 0 && (
            <div className="flex justify-between font-semibold text-amber-700">
              <span>Balance Due</span>
              <span className="font-mono">{centavosToDisplay(balance)}</span>
            </div>
          )}
        </div>

        {bill.notes && (
          <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-500">
            {bill.notes}
          </div>
        )}
      </div>

      {/* Payment history — stored inline on expenses, show paid_amount summary */}
      {(bill.paid_amount ?? 0) > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Payments</h2>
          <div className="border rounded-xl bg-white px-6 py-4 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Total Paid</span>
              <span className="font-mono text-green-700 font-semibold">{centavosToDisplay(bill.paid_amount ?? 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

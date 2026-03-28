import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { voidInvoice } from '@/app/actions/invoices'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Printer } from 'lucide-react'
import { ConfirmButton } from '@/components/confirm-button'

const STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  void: 'bg-gray-100 text-gray-400 border-gray-200',
  draft: 'bg-gray-50 text-gray-500 border-gray-200',
}

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Cash', bank_transfer: 'Bank Transfer', check: 'Check',
  gcash: 'GCash', maya: 'Maya', credit_card: 'Credit Card',
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const [{ data: invoice }, { data: org }] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        *,
        clients(name, tin, address, email),
        invoice_items(description, quantity, unit_price, total),
        invoice_payments(id, payment_date, amount, payment_method, reference)
      `)
      .eq('id', id)
      .eq('organization_id', orgId)
      .single(),
    supabase
      .from('organizations')
      .select('name, tin, address, vat_registered')
      .eq('id', orgId)
      .single(),
  ])

  if (!invoice) notFound()

  const client = invoice.clients as { name: string; tin: string | null; address: string | null; email: string | null } | null
  const lineItems = (invoice.invoice_items as { description: string; quantity: number; unit_price: number; total: number }[]) ?? []
  const payments = (invoice.invoice_payments as { id: string; payment_date: string; amount: number; payment_method: string; reference: string | null }[]) ?? []
  const balance = invoice.total_amount - invoice.paid_amount

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/invoices" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4 mr-1" />Back to Invoices
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/invoices/${id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Printer className="h-4 w-4" /> Print
          </Link>
          {invoice.status !== 'paid' && invoice.status !== 'void' && (
            <>
              <Link
                href={`/invoices/${id}/payment`}
                className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Record Payment
              </Link>
              <form action={voidInvoice.bind(null, id)}>
                <ConfirmButton message="Void this invoice? This cannot be undone." className="text-sm text-red-600 hover:underline">
                  Void
                </ConfirmButton>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Invoice card */}
      <div className="border rounded-xl bg-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Invoice</p>
            <p className="text-xl font-bold text-gray-900 font-mono truncate max-w-[320px]">{invoice.invoice_number}</p>
            <div className="mt-2 space-y-0.5 text-sm text-gray-500">
              <p>Date: {invoice.invoice_date}</p>
              {invoice.due_date && <p>Due: {invoice.due_date}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-2.5 py-1 rounded border text-sm font-medium ${STATUS_COLORS[invoice.status] ?? ''}`}>
              {invoice.status}
            </span>
            <div className="mt-3 text-sm text-gray-500">
              <p className="font-semibold text-gray-900">{org?.name}</p>
              {org?.tin && <p>TIN: {org.tin}</p>}
              {org?.address && <p className="max-w-[180px] text-right">{org.address}</p>}
            </div>
          </div>
        </div>

        {/* Client */}
        {client && (
          <div className="px-6 py-4 border-b bg-gray-50">
            <p className="text-xs text-gray-400 mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">{client.name}</p>
            {client.tin && <p className="text-sm text-gray-500">TIN: {client.tin}</p>}
            {client.address && <p className="text-sm text-gray-500">{client.address}</p>}
            {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
          </div>
        )}

        {/* Line items */}
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="text-left px-6 py-2.5 font-medium text-gray-500">Description</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-500">Qty</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-500">Unit Price</th>
              <th className="text-right px-6 py-2.5 font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lineItems.map((item, i) => (
              <tr key={i}>
                <td className="px-6 py-2.5">{item.description}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{item.quantity}</td>
                <td className="px-4 py-2.5 text-right font-mono">{centavosToDisplay(item.unit_price)}</td>
                <td className="px-6 py-2.5 text-right font-mono">{centavosToDisplay(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="px-6 py-4 border-t space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span className="font-mono">{centavosToDisplay(invoice.subtotal)}</span>
          </div>
          {invoice.vat_amount > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>VAT (12%)</span><span className="font-mono">{centavosToDisplay(invoice.vat_amount)}</span>
            </div>
          )}
          {invoice.ewt_amount > 0 && (
            <div className="flex justify-between text-sm text-amber-600">
              <span>EWT ({invoice.ewt_rate}%) deducted</span>
              <span className="font-mono">−{centavosToDisplay(invoice.ewt_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2">
            <span>Total</span><span className="font-mono">{centavosToDisplay(invoice.total_amount)}</span>
          </div>
          {invoice.paid_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Paid</span><span className="font-mono">{centavosToDisplay(invoice.paid_amount)}</span>
            </div>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'void' && balance > 0 && (
            <div className="flex justify-between font-semibold text-amber-700">
              <span>Balance Due</span><span className="font-mono">{centavosToDisplay(balance)}</span>
            </div>
          )}
        </div>

        {invoice.notes && (
          <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-500">
            {invoice.notes}
          </div>
        )}
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Payment History</h2>
          <div className="border rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Method</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">Reference</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5">{p.payment_date}</td>
                    <td className="px-4 py-2.5 text-gray-500">{PAYMENT_METHODS[p.payment_method] ?? p.payment_method}</td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{p.reference ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-green-700">{centavosToDisplay(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

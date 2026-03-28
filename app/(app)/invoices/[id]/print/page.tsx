import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { PrintButton } from '@/components/print-button'

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const [{ data: invoice }, { data: org }] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        *,
        clients(name, tin, address, email),
        invoice_items(description, quantity, unit_price, total)
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

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
        body { background: #f4f4f5; font-family: system-ui, sans-serif; }
      `}</style>

      {/* Print button */}
      <div className="no-print flex justify-center pt-6 pb-4">
        <PrintButton />
      </div>

      <div className="print-page max-w-2xl mx-auto bg-white shadow-sm rounded-lg p-10 mb-10">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{org?.name}</h1>
            {org?.tin && <p className="text-xs text-zinc-500 mt-0.5">TIN: {org.tin}</p>}
            {org?.address && <p className="text-xs text-zinc-500">{org.address}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-zinc-900">
              {invoice.type === 'official_receipt' ? 'Official Receipt' : 'Invoice'}
            </p>
            <p className="text-sm font-mono text-zinc-700 mt-1">{invoice.or_number ?? invoice.invoice_number}</p>
            <p className="text-xs text-zinc-500 mt-1">{invoice.invoice_date}</p>
            {invoice.due_date && <p className="text-xs text-zinc-400">Due: {invoice.due_date}</p>}
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8 bg-zinc-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Bill To</p>
          <p className="font-semibold text-zinc-900">{client?.name ?? '—'}</p>
          {client?.tin && <p className="text-xs text-zinc-500">TIN: {client.tin}</p>}
          {client?.address && <p className="text-xs text-zinc-500">{client.address}</p>}
          {client?.email && <p className="text-xs text-zinc-500">{client.email}</p>}
        </div>

        {/* Line Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-zinc-200">
              <th className="text-left py-2 font-semibold text-zinc-600">Description</th>
              <th className="text-right py-2 font-semibold text-zinc-600">Qty</th>
              <th className="text-right py-2 font-semibold text-zinc-600">Unit Price</th>
              <th className="text-right py-2 font-semibold text-zinc-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length ? lineItems.map((item, i) => (
              <tr key={i} className="border-b border-zinc-100">
                <td className="py-2 text-zinc-800">{item.description}</td>
                <td className="py-2 text-right text-zinc-600">{item.quantity}</td>
                <td className="py-2 text-right font-mono">{centavosToDisplay(item.unit_price)}</td>
                <td className="py-2 text-right font-mono">{centavosToDisplay(item.total)}</td>
              </tr>
            )) : (
              <tr className="border-b border-zinc-100">
                <td className="py-2 text-zinc-800">{invoice.notes ?? 'Services rendered'}</td>
                <td className="py-2 text-right text-zinc-600">1</td>
                <td className="py-2 text-right font-mono">{centavosToDisplay(invoice.subtotal)}</td>
                <td className="py-2 text-right font-mono">{centavosToDisplay(invoice.subtotal)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Subtotal</span>
              <span className="font-mono">{centavosToDisplay(invoice.subtotal)}</span>
            </div>
            {(invoice.vat_amount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">VAT (12%)</span>
                <span className="font-mono">{centavosToDisplay(invoice.vat_amount)}</span>
              </div>
            )}
            {(invoice.ewt_amount ?? 0) > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>EWT ({invoice.ewt_rate}%) withheld</span>
                <span className="font-mono">({centavosToDisplay(invoice.ewt_amount)})</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-2 border-zinc-200 text-base">
              <span>Total</span>
              <span className="font-mono">{centavosToDisplay(invoice.total_amount)}</span>
            </div>
            {(invoice.ewt_amount ?? 0) > 0 && (
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Net payable after EWT</span>
                <span className="font-mono">{centavosToDisplay(invoice.total_amount - (invoice.ewt_amount ?? 0))}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-zinc-600">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-zinc-100 text-center text-xs text-zinc-400">
          {org?.vat_registered && <p>VAT-Registered Business · TIN: {org.tin}</p>}
          <p className="mt-0.5">This serves as your official receipt.</p>
        </div>
      </div>

    </>
  )
}

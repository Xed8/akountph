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
      .select('name, trade_name, tin, address, rdo_code, vat_registered, bir_cas_accredited, bir_atp_number, bir_accreditation_no, or_series_from, or_series_to')
      .eq('id', orgId)
      .single(),
  ])

  if (!invoice) notFound()

  const client = invoice.clients as { name: string; tin: string | null; address: string | null; email: string | null } | null
  const lineItems = (invoice.invoice_items as { description: string; quantity: number; unit_price: number; total: number }[]) ?? []
  const isOfficialReceipt = invoice.type === 'official_receipt' || org?.vat_registered

  const orgData = org as {
    name: string
    trade_name: string | null
    tin: string | null
    address: string | null
    rdo_code: string | null
    vat_registered: boolean
    bir_cas_accredited: boolean
    bir_atp_number: string | null
    bir_accreditation_no: string | null
    or_series_from: string | null
    or_series_to: string | null
  } | null

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
        body { background: #f4f4f5; font-family: 'Arial', sans-serif; }
      `}</style>

      {/* Print button */}
      <div className="no-print flex justify-center pt-6 pb-4">
        <PrintButton />
      </div>

      <div className="print-page max-w-2xl mx-auto bg-white shadow-sm rounded-lg p-10 mb-10">

        {/* BIR-Required Header */}
        <div className="text-center mb-6 border-b-2 border-zinc-800 pb-4">
          {/* Business name */}
          <h1 className="text-xl font-bold text-zinc-900 uppercase tracking-wide">
            {orgData?.name}
          </h1>
          {orgData?.trade_name && orgData.trade_name !== orgData.name && (
            <p className="text-sm text-zinc-600">{orgData.trade_name}</p>
          )}
          {/* Address */}
          {orgData?.address && (
            <p className="text-xs text-zinc-600 mt-0.5">{orgData.address}</p>
          )}
          {/* TIN and RDO */}
          <div className="flex justify-center gap-6 mt-1 text-xs text-zinc-500">
            {orgData?.tin && <span>TIN: <span className="font-mono font-semibold text-zinc-700">{orgData.tin}</span></span>}
            {orgData?.rdo_code && <span>RDO: <span className="font-semibold text-zinc-700">{orgData.rdo_code}</span></span>}
          </div>
          {/* VAT registration status */}
          {orgData?.vat_registered ? (
            <p className="text-xs text-zinc-500 mt-0.5">VAT-Registered Taxpayer</p>
          ) : (
            <p className="text-xs text-zinc-500 mt-0.5">Non-VAT Registered</p>
          )}
        </div>

        {/* Document Type + OR Number */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xl font-bold text-zinc-900 uppercase">
              {isOfficialReceipt ? 'Official Receipt' : 'Invoice'}
            </p>
            {orgData?.bir_cas_accredited && (
              <p className="text-[10px] text-zinc-400 mt-0.5">BIR CAS Accredited</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-zinc-900">
              No. {invoice.or_number ?? invoice.invoice_number}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Date: {invoice.invoice_date}</p>
            {invoice.due_date && (
              <p className="text-xs text-zinc-400">Due: {invoice.due_date}</p>
            )}
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6 border border-zinc-200 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Sold To / Bill To</p>
          <p className="font-semibold text-zinc-900">{client?.name ?? '—'}</p>
          {client?.tin && <p className="text-xs text-zinc-500">TIN: {client.tin}</p>}
          {client?.address && <p className="text-xs text-zinc-500">{client.address}</p>}
          {client?.email && <p className="text-xs text-zinc-400">{client.email}</p>}
        </div>

        {/* Line Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-zinc-800">
              <th className="text-left py-2 font-bold text-zinc-700 text-xs uppercase">Description</th>
              <th className="text-right py-2 font-bold text-zinc-700 text-xs uppercase">Qty</th>
              <th className="text-right py-2 font-bold text-zinc-700 text-xs uppercase">Unit Price</th>
              <th className="text-right py-2 font-bold text-zinc-700 text-xs uppercase">Amount</th>
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
        <div className="flex justify-end mb-6">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Subtotal (ex-VAT)</span>
              <span className="font-mono">{centavosToDisplay(invoice.subtotal)}</span>
            </div>
            {(invoice.vat_amount ?? 0) > 0 ? (
              <div className="flex justify-between">
                <span className="text-zinc-500">VAT (12%)</span>
                <span className="font-mono">{centavosToDisplay(invoice.vat_amount)}</span>
              </div>
            ) : orgData?.vat_registered ? (
              <div className="flex justify-between text-zinc-400 text-xs">
                <span>VAT-Exempt</span>
                <span className="font-mono">₱0.00</span>
              </div>
            ) : null}
            {(invoice.ewt_amount ?? 0) > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>EWT ({invoice.ewt_rate}%) withheld</span>
                <span className="font-mono">({centavosToDisplay(invoice.ewt_amount)})</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t-2 pt-2 border-zinc-800 text-base">
              <span>TOTAL AMOUNT DUE</span>
              <span className="font-mono">{centavosToDisplay(invoice.total_amount)}</span>
            </div>
            {(invoice.ewt_amount ?? 0) > 0 && (
              <div className="flex justify-between text-xs text-zinc-400 border-t pt-1">
                <span>Net payable after EWT deduction</span>
                <span className="font-mono">{centavosToDisplay(invoice.total_amount - (invoice.ewt_amount ?? 0))}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6 pt-4 border-t border-zinc-100">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">Remarks / Terms</p>
            <p className="text-sm text-zinc-600">{invoice.notes}</p>
          </div>
        )}

        {/* Signature line */}
        <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-zinc-200 text-xs text-zinc-500">
          <div>
            <div className="border-b border-zinc-400 mb-1 h-8" />
            <p className="text-center">Authorized Signatory</p>
          </div>
          <div>
            <div className="border-b border-zinc-400 mb-1 h-8" />
            <p className="text-center">Received by / Date</p>
          </div>
        </div>

        {/* BIR Footer — Required fields */}
        <div className="mt-6 pt-4 border-t-2 border-zinc-800 text-[10px] text-zinc-400 space-y-0.5">
          {orgData?.bir_atp_number && (
            <p>Authority to Print No.: <span className="font-mono text-zinc-600">{orgData.bir_atp_number}</span></p>
          )}
          {orgData?.bir_accreditation_no && (
            <p>BIR Accreditation No.: <span className="font-mono text-zinc-600">{orgData.bir_accreditation_no}</span></p>
          )}
          {orgData?.or_series_from && orgData.or_series_to && (
            <p>Series: <span className="font-mono text-zinc-600">{orgData.or_series_from} – {orgData.or_series_to}</span></p>
          )}
          <p className="text-center mt-1">
            This document is computer-generated and valid without a signature unless otherwise stated.
          </p>
          {orgData?.bir_cas_accredited && (
            <p className="text-center">BIR-Accredited Computerized Accounting System (CAS)</p>
          )}
        </div>
      </div>
    </>
  )
}

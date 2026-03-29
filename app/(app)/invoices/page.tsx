import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { computeAgingBuckets } from '@/lib/invoices/aging'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  void: 'bg-gray-100 text-gray-400 border-gray-200',
  draft: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default async function InvoicesPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, invoice_date, due_date, total_amount, paid_amount, status, clients(name)')
    .eq('organization_id', orgId)
    .order('invoice_date', { ascending: false })

  const allInvoices = invoices ?? []
  const unpaid = allInvoices.filter(i => i.status !== 'paid' && i.status !== 'void')
  const aging = computeAgingBuckets(unpaid)

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Track money owed to you.</p>
        </div>
        <Link href="/invoices/new">
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Invoice</Button>
        </Link>
      </div>

      {/* AR Aging Summary */}
      {aging.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Outstanding', value: aging.total, color: 'text-gray-900' },
            { label: 'Current (0–30)', value: aging.current, color: 'text-green-600' },
            { label: '31–60 days', value: aging.days31to60, color: 'text-amber-600' },
            { label: '61–90 days', value: aging.days61to90, color: 'text-orange-600' },
            { label: 'Over 90 days', value: aging.over90, color: 'text-red-600' },
          ].map(bucket => (
            <div key={bucket.label} className="border rounded-lg bg-white px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{bucket.label}</p>
              <p className={`font-mono font-semibold text-sm ${bucket.color}`}>
                {centavosToDisplay(bucket.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {!allInvoices.length ? (
        <div className="border rounded-xl border-dashed bg-gray-50/50 p-12 text-center">
          <FileText className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700 mb-1">No invoices yet</p>
          <p className="text-sm text-gray-400 mb-4">Create your first invoice to start tracking revenue.</p>
          <Link href="/invoices/new"><Button size="sm">Create invoice</Button></Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Due</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Balance</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {allInvoices.map(inv => {
                const client = (inv.clients as unknown) as { name: string } | null
                const balance = inv.total_amount - inv.paid_amount
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-900">{client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.invoice_date}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.due_date ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{centavosToDisplay(inv.total_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {inv.status !== 'paid' && inv.status !== 'void'
                        ? <span className="text-amber-600">{centavosToDisplay(balance)}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[inv.status] ?? ''}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline text-xs">View</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

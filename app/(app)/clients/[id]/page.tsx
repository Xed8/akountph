import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { updateClient, archiveClient } from '@/app/actions/clients'
import { ClientForm } from '@/components/client-form'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft } from 'lucide-react'
import { ConfirmButton } from '@/components/confirm-button'

const STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  void: 'bg-gray-50 text-gray-500 border-gray-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
}

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const [{ data: client }, { data: invoices }] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, total_amount, paid_amount, status, due_date')
      .eq('client_id', id)
      .eq('organization_id', orgId)
      .order('invoice_date', { ascending: false })
      .limit(20),
  ])

  if (!client) notFound()

  const updateWithId = updateClient.bind(null, id)

  return (
    <div className="p-8">
      <Link href="/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Clients
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
        <form action={archiveClient.bind(null, id)}>
          <ConfirmButton message="Archive this client?" className="text-sm text-red-600 hover:underline">
            Archive
          </ConfirmButton>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ClientForm action={updateWithId} client={client} submitLabel="Save Changes" />
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Invoice History</h2>
            <Link href={`/invoices/new?client_id=${id}`} className="text-sm text-blue-600 hover:underline">
              + New Invoice
            </Link>
          </div>

          {!invoices?.length ? (
            <div className="border rounded-lg border-dashed p-8 text-center text-sm text-gray-400">
              No invoices yet for this client.
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Invoice #</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Date</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">Amount</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">Balance</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{inv.invoice_number}</td>
                      <td className="px-4 py-2.5 text-gray-500">{inv.invoice_date}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{centavosToDisplay(inv.total_amount)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-amber-600">
                        {inv.status !== 'paid' && inv.status !== 'void'
                          ? centavosToDisplay(inv.total_amount - inv.paid_amount)
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[inv.status] ?? ''}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline text-xs">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

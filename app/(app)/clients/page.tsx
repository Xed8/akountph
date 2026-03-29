import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'

export default async function ClientsPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id, name, tin, email, phone,
      invoices(total_amount, paid_amount, status)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('name')

  // Compute outstanding balance per client
  const clientsWithBalance = (clients ?? []).map(client => {
    const invoices = (client.invoices as { total_amount: number; paid_amount: number; status: string }[]) ?? []
    const outstanding = invoices
      .filter(inv => inv.status !== 'void' && inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.total_amount - inv.paid_amount), 0)
    return { ...client, outstanding, invoiceCount: invoices.length }
  })

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage your customers and track what they owe.</p>
        </div>
        <Link href="/clients/new">
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Client</Button>
        </Link>
      </div>

      {!clientsWithBalance.length ? (
        <div className="border rounded-xl border-dashed bg-gray-50/50 p-12 text-center">
          <Users className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700 mb-1">No clients yet</p>
          <p className="text-sm text-gray-400 mb-4">Add a client to start creating invoices.</p>
          <Link href="/clients/new">
            <Button size="sm">Add your first client</Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">TIN</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Outstanding</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Invoices</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {clientsWithBalance.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{client.tin ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{client.email ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {client.outstanding > 0 ? (
                      <span className="font-mono text-amber-600 font-medium">
                        {centavosToDisplay(client.outstanding)}
                      </span>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Clear</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{client.invoiceCount}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/clients/${client.id}`} className="text-blue-600 hover:underline text-xs">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

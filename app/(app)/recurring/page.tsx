import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw } from 'lucide-react'
import { generateFromTemplate, deleteRecurringTemplate, toggleRecurring } from '@/app/actions/recurring'
import { ConfirmButton } from '@/components/confirm-button'
import { SubmitOnceButton } from '@/components/submit-once-button'

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly',
}

export default async function RecurringPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: templates } = await supabase
    .from('recurring_templates')
    .select(`
      id, type, name, description, amount, has_vat, ewt_rate,
      frequency, next_due, last_generated, is_active,
      clients(name), vendors(name)
    `)
    .eq('organization_id', orgId)
    .order('next_due', { ascending: true })

  const list = templates ?? []
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring</h1>
          <p className="text-gray-500 mt-1">Templates for invoices and bills that repeat on a schedule.</p>
        </div>
        <Link href="/recurring/new">
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Template</Button>
        </Link>
      </div>

      {!list.length ? (
        <div className="border rounded-xl border-dashed bg-gray-50/50 p-12 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700 mb-1">No recurring templates</p>
          <p className="text-sm text-gray-400 mb-4">Set up repeating invoices or bills to generate them with one click.</p>
          <Link href="/recurring/new"><Button size="sm">Create first template</Button></Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Party</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Frequency</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Next Due</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map(tmpl => {
                const client = (tmpl.clients as unknown) as { name: string } | null
                const vendor = (tmpl.vendors as unknown) as { name: string } | null
                const isDue = tmpl.next_due <= today
                return (
                  <tr key={tmpl.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{tmpl.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={`text-xs ${tmpl.type === 'invoice' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                        {tmpl.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{client?.name ?? vendor?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{centavosToDisplay(tmpl.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{FREQ_LABELS[tmpl.frequency] ?? tmpl.frequency}</td>
                    <td className={`px-4 py-3 font-mono text-xs ${isDue && tmpl.is_active ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {tmpl.next_due}
                    </td>
                    <td className="px-4 py-3">
                      {tmpl.is_active
                        ? <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">Active</Badge>
                        : <Badge variant="secondary" className="text-xs">Paused</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        {tmpl.is_active && isDue && (
                          <form action={generateFromTemplate.bind(null, tmpl.id)}>
                            <SubmitOnceButton className="text-xs text-green-700 hover:underline font-medium">
                              Generate
                            </SubmitOnceButton>
                          </form>
                        )}
                        <Link href={`/recurring/${tmpl.id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                        <form action={deleteRecurringTemplate.bind(null, tmpl.id)}>
                          <ConfirmButton message="Delete this template?" className="text-xs text-red-400 hover:text-red-600">
                            Delete
                          </ConfirmButton>
                        </form>
                      </div>
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

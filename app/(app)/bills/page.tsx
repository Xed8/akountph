import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Button } from '@/components/ui/button'
import { Plus, Receipt } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-amber-50 text-amber-700 border-amber-200',
  partial:  'bg-blue-50 text-blue-700 border-blue-200',
  paid:     'bg-green-50 text-green-700 border-green-200',
  cancelled:'bg-gray-100 text-gray-400 border-gray-200',
  draft:    'bg-gray-50 text-gray-500 border-gray-200',
}

function apAgingBuckets(bills: { total_amount: number; paid_amount: number | null; due_date: string | null; status: string }[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let current = 0, days31to60 = 0, days61to90 = 0, over90 = 0

  for (const bill of bills) {
    if (bill.status === 'paid' || bill.status === 'cancelled') continue
    const balance = bill.total_amount - (bill.paid_amount ?? 0)
    if (balance <= 0) continue

    if (!bill.due_date) { current += balance; continue }

    const due = new Date(bill.due_date)
    due.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 30)      current += balance
    else if (diffDays <= 60) days31to60 += balance
    else if (diffDays <= 90) days61to90 += balance
    else                     over90 += balance
  }

  return {
    total: current + days31to60 + days61to90 + over90,
    current, days31to60, days61to90, over90,
  }
}

export default async function BillsPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: bills } = await supabase
    .from('expenses')
    .select(`
      id, bill_number, expense_date, due_date,
      total_amount, paid_amount, status, description,
      vendors(name)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('expense_date', { ascending: false })

  const allBills = bills ?? []
  const aging = apAgingBuckets(allBills)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-500 mt-1">Track money you owe to vendors.</p>
        </div>
        <Link href="/bills/new">
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Bill</Button>
        </Link>
      </div>

      {/* AP Aging Summary */}
      {aging.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Payable', value: aging.total, color: 'text-gray-900' },
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

      {!allBills.length ? (
        <div className="border rounded-xl border-dashed bg-gray-50/50 p-12 text-center">
          <Receipt className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700 mb-1">No bills yet</p>
          <p className="text-sm text-gray-400 mb-4">Record a vendor bill to track your payables.</p>
          <Link href="/bills/new"><Button size="sm">Add first bill</Button></Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Bill #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Due</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Balance</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {allBills.map(bill => {
                const vendor = (bill.vendors as unknown) as { name: string } | null
                const balance = bill.total_amount - (bill.paid_amount ?? 0)
                return (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{bill.bill_number ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-900">{vendor?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{bill.description}</td>
                    <td className="px-4 py-3 text-gray-500">{bill.expense_date}</td>
                    <td className="px-4 py-3 text-gray-500">{bill.due_date ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{centavosToDisplay(bill.total_amount)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {bill.status !== 'paid' && bill.status !== 'cancelled'
                        ? <span className="text-amber-600">{centavosToDisplay(balance)}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[bill.status] ?? ''}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/bills/${bill.id}`} className="text-blue-600 hover:underline text-xs">View</Link>
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

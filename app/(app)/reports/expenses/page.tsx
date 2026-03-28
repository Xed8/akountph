import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { ChevronLeft } from 'lucide-react'

interface SearchParams { year?: string; month?: string }

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export default async function ExpenseSummaryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const now = new Date()
  const year  = parseInt(sp.year  ?? String(now.getFullYear()))
  const month = parseInt(sp.month ?? String(now.getMonth() + 1))

  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${year}-${pad(month)}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${pad(month)}-${lastDay}`

  const { supabase, orgId } = await requireOrg()

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, vat_amount, ewt_amount, category_id, expense_categories(name, type), description, vendor_id, vendors(name)')
    .eq('organization_id', orgId)
    .gte('expense_date', start)
    .lte('expense_date', end)
    .neq('status', 'cancelled')
    .order('expense_date')

  type ExpRow = {
    amount: number
    vat_amount: number | null
    ewt_amount: number | null
    category_id: string | null
    expense_categories: { name: string; type: string } | null
    description: string
    vendor_id: string | null
    vendors: { name: string } | null
  }

  const rows = (expenses ?? []) as unknown as ExpRow[]

  // Group by category
  const categoryMap = new Map<string, { name: string; total: number; count: number }>()
  let grandTotal = 0
  let totalVat = 0
  let totalEwt = 0

  for (const exp of rows) {
    const catName = exp.expense_categories?.name ?? 'Uncategorized'
    const catKey  = exp.category_id ?? 'uncategorized'
    const exVat   = exp.amount - (exp.vat_amount ?? 0)
    grandTotal += exVat
    totalVat   += (exp.vat_amount ?? 0)
    totalEwt   += (exp.ewt_amount ?? 0)
    const existing = categoryMap.get(catKey)
    if (existing) {
      existing.total += exVat
      existing.count += 1
    } else {
      categoryMap.set(catKey, { name: catName, total: exVat, count: 1 })
    }
  }

  const categories = [...categoryMap.values()].sort((a, b) => b.total - a.total)
  const currentYear = now.getFullYear()
  const years = [currentYear - 1, currentYear]

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" /> Reports
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Summary</h1>
          <p className="text-gray-500 mt-1">{MONTHS[month - 1]} {year}</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <select name="year" defaultValue={year} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select name="month" defaultValue={month} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <button type="submit" className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700">View</button>
        </form>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-xl bg-white px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Total Expenses (ex-VAT)</p>
          <p className="text-xl font-bold font-mono text-red-700">{centavosToDisplay(grandTotal)}</p>
        </div>
        <div className="border rounded-xl bg-white px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Input VAT</p>
          <p className="text-xl font-bold font-mono text-zinc-700">{centavosToDisplay(totalVat)}</p>
        </div>
        <div className="border rounded-xl bg-white px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">EWT Withheld</p>
          <p className="text-xl font-bold font-mono text-amber-700">{centavosToDisplay(totalEwt)}</p>
        </div>
      </div>

      {/* By category */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700 text-sm">By Category</h2>
        </div>
        {!categories.length ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">No expenses recorded this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b text-xs bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Category</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Bills</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Amount (ex-VAT)</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(cat => (
                <tr key={cat.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{cat.count}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-700">{centavosToDisplay(cat.total)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">
                    {grandTotal > 0 ? `${((cat.total / grandTotal) * 100).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 bg-gray-50">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 font-semibold text-right text-gray-700">Total</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-red-700">{centavosToDisplay(grandTotal)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-700">100%</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}

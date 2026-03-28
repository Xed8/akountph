import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { ChevronLeft } from 'lucide-react'

// Quarter helpers
function getQuarterRange(year: number, quarter: number): { start: string; end: string; label: string } {
  const quarters = [
    { start: `${year}-01-01`, end: `${year}-03-31`, label: `Q1 ${year} (Jan–Mar)` },
    { start: `${year}-04-01`, end: `${year}-06-30`, label: `Q2 ${year} (Apr–Jun)` },
    { start: `${year}-07-01`, end: `${year}-09-30`, label: `Q3 ${year} (Jul–Sep)` },
    { start: `${year}-10-01`, end: `${year}-12-31`, label: `Q4 ${year} (Oct–Dec)` },
  ]
  return quarters[quarter - 1]
}

function getCurrentQuarter(): { year: number; quarter: number } {
  const now = new Date()
  return {
    year: now.getFullYear(),
    quarter: Math.ceil((now.getMonth() + 1) / 3),
  }
}

function getMonthsInQuarter(year: number, quarter: number): { month: number; label: string; start: string; end: string }[] {
  const monthGroups = [
    [
      { month: 1, label: 'January', start: `${year}-01-01`, end: `${year}-01-31` },
      { month: 2, label: 'February', start: `${year}-02-01`, end: `${year}-02-28` },
      { month: 3, label: 'March', start: `${year}-03-01`, end: `${year}-03-31` },
    ],
    [
      { month: 4, label: 'April', start: `${year}-04-01`, end: `${year}-04-30` },
      { month: 5, label: 'May', start: `${year}-05-01`, end: `${year}-05-31` },
      { month: 6, label: 'June', start: `${year}-06-01`, end: `${year}-06-30` },
    ],
    [
      { month: 7, label: 'July', start: `${year}-07-01`, end: `${year}-07-31` },
      { month: 8, label: 'August', start: `${year}-08-01`, end: `${year}-08-31` },
      { month: 9, label: 'September', start: `${year}-09-01`, end: `${year}-09-30` },
    ],
    [
      { month: 10, label: 'October', start: `${year}-10-01`, end: `${year}-10-31` },
      { month: 11, label: 'November', start: `${year}-11-01`, end: `${year}-11-30` },
      { month: 12, label: 'December', start: `${year}-12-01`, end: `${year}-12-31` },
    ],
  ]
  return monthGroups[quarter - 1]
}

// 2550Q filing deadline: 25th day after quarter end
function getFilingDeadline(year: number, quarter: number): string {
  const deadlines = [
    `April 25, ${year}`,
    `July 25, ${year}`,
    `October 25, ${year}`,
    `January 25, ${year + 1}`,
  ]
  return deadlines[quarter - 1]
}

interface SearchParams {
  year?: string
  quarter?: string
}

export default async function VATReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const { year: defaultYear, quarter: defaultQuarter } = getCurrentQuarter()
  const year = parseInt(sp.year ?? String(defaultYear))
  const quarter = parseInt(sp.quarter ?? String(defaultQuarter))

  const { supabase, orgId } = await requireOrg()

  // Check org VAT registration
  const { data: org } = await supabase
    .from('organizations')
    .select('name, tin, vat_registered')
    .eq('id', orgId)
    .single()

  const quarterRange = getQuarterRange(year, quarter)
  const months = getMonthsInQuarter(year, quarter)
  const filingDeadline = getFilingDeadline(year, quarter)

  // Fetch invoices for the quarter (output VAT — only VAT-registered orgs)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_date, subtotal, vat_amount, total_amount, status')
    .eq('organization_id', orgId)
    .gte('invoice_date', quarterRange.start)
    .lte('invoice_date', quarterRange.end)
    .neq('status', 'void')

  // Fetch expenses/bills for the quarter (input VAT)
  const { data: expenses } = await supabase
    .from('expenses')
    .select('expense_date, amount, vat_amount, total_amount, status')
    .eq('organization_id', orgId)
    .gte('expense_date', quarterRange.start)
    .lte('expense_date', quarterRange.end)
    .neq('status', 'cancelled')

  const allInvoices = invoices ?? []
  const allExpenses = expenses ?? []

  // Quarter totals
  const totalSales = allInvoices.reduce((s, i) => s + i.subtotal, 0)
  const totalOutputVat = allInvoices.reduce((s, i) => s + (i.vat_amount ?? 0), 0)
  const totalPurchases = allExpenses.reduce((s, e) => s + (e.amount - (e.vat_amount ?? 0)), 0)
  const totalInputVat = allExpenses.reduce((s, e) => s + (e.vat_amount ?? 0), 0)
  const vatPayable = totalOutputVat - totalInputVat

  // Monthly breakdown
  const monthlyData = months.map(m => {
    const mInvoices = allInvoices.filter(i => i.invoice_date >= m.start && i.invoice_date <= m.end)
    const mExpenses = allExpenses.filter(e => e.expense_date >= m.start && e.expense_date <= m.end)
    const outputVat = mInvoices.reduce((s, i) => s + (i.vat_amount ?? 0), 0)
    const inputVat = mExpenses.reduce((s, e) => s + (e.vat_amount ?? 0), 0)
    const sales = mInvoices.reduce((s, i) => s + i.subtotal, 0)
    const purchases = mExpenses.reduce((s, e) => s + (e.amount - (e.vat_amount ?? 0)), 0)
    return { ...m, sales, outputVat, purchases, inputVat, net: outputVat - inputVat }
  })

  // Available years/quarters for navigation
  const currentY = new Date().getFullYear()
  const years = [currentY - 1, currentY, currentY + 1]
  const quarters = [1, 2, 3, 4]

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Reports
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VAT Summary</h1>
          <p className="text-gray-500 mt-1">
            Output VAT, Input VAT, and net VAT payable — BIR Form 2550Q reference
          </p>
        </div>

        {/* Period selector */}
        <form method="GET" className="flex items-center gap-2">
          <select
            name="year"
            defaultValue={year}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            name="quarter"
            defaultValue={quarter}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {quarters.map(q => <option key={q} value={q}>Q{q}</option>)}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700"
          >
            View
          </button>
        </form>
      </div>

      {/* Period header */}
      <div className="rounded-xl border bg-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Period</p>
          <p className="font-semibold text-gray-900">{quarterRange.label}</p>
          {org && <p className="text-sm text-gray-500 mt-0.5">{org.name}{org.tin ? ` · TIN ${org.tin}` : ''}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">2550Q Filing Deadline</p>
          <p className="font-semibold text-amber-700">{filingDeadline}</p>
          {!org?.vat_registered && (
            <p className="text-xs text-red-500 mt-1">Organization is not marked as VAT-registered</p>
          )}
        </div>
      </div>

      {/* Quarter summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Gross Sales (ex-VAT)', value: totalSales, color: 'text-gray-900' },
          { label: 'Output VAT Collected', value: totalOutputVat, color: 'text-blue-700' },
          { label: 'Input VAT Paid', value: totalInputVat, color: 'text-purple-700' },
          {
            label: vatPayable >= 0 ? 'VAT Payable to BIR' : 'Excess Input VAT',
            value: Math.abs(vatPayable),
            color: vatPayable >= 0 ? 'text-red-700' : 'text-green-700',
          },
        ].map(card => (
          <div key={card.label} className="border rounded-xl bg-white px-4 py-4">
            <p className="text-xs text-gray-400 mb-1">{card.label}</p>
            <p className={`font-mono font-bold text-lg ${card.color}`}>{centavosToDisplay(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700 text-sm">Monthly Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-xs">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-gray-500">Month</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-500">Sales (ex-VAT)</th>
              <th className="text-right px-4 py-2.5 font-medium text-blue-500">Output VAT</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-500">Purchases (ex-VAT)</th>
              <th className="text-right px-4 py-2.5 font-medium text-purple-500">Input VAT</th>
              <th className="text-right px-4 py-2.5 font-medium text-gray-500">Net VAT</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {monthlyData.map(m => (
              <tr key={m.month} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{m.label}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{centavosToDisplay(m.sales)}</td>
                <td className="px-4 py-3 text-right font-mono text-blue-700">{centavosToDisplay(m.outputVat)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{centavosToDisplay(m.purchases)}</td>
                <td className="px-4 py-3 text-right font-mono text-purple-700">{centavosToDisplay(m.inputVat)}</td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${m.net >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {m.net >= 0 ? centavosToDisplay(m.net) : `(${centavosToDisplay(Math.abs(m.net))})`}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 bg-gray-50">
            <tr>
              <td className="px-4 py-3 font-semibold text-gray-900">Total</td>
              <td className="px-4 py-3 text-right font-mono font-semibold">{centavosToDisplay(totalSales)}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-blue-700">{centavosToDisplay(totalOutputVat)}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold">{centavosToDisplay(totalPurchases)}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-purple-700">{centavosToDisplay(totalInputVat)}</td>
              <td className={`px-4 py-3 text-right font-mono font-bold text-base ${vatPayable >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                {vatPayable >= 0
                  ? centavosToDisplay(vatPayable)
                  : `(${centavosToDisplay(Math.abs(vatPayable))})`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Formula reference */}
      <div className="rounded-xl border bg-blue-50 border-blue-100 px-5 py-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold mb-2">VAT Computation (BIR 2550Q)</p>
        <div className="space-y-0.5 font-mono text-xs">
          <p>Output VAT = Gross Sales (ex-VAT) × 12%</p>
          <p>Input VAT = Purchases (ex-VAT) × 12% <span className="text-blue-500">(from vendor bills with VAT)</span></p>
          <p>VAT Payable = Output VAT − Input VAT</p>
          <p className="text-blue-500">If negative → excess input VAT (carry forward or claim refund)</p>
        </div>
      </div>
    </div>
  )
}

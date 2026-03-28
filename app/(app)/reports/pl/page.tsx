import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { ChevronLeft } from 'lucide-react'

interface SearchParams {
  year?: string
  month?: string
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export default async function ProfitLossPage({
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
  // Last day of month
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${pad(month)}-${lastDay}`

  const { supabase, orgId } = await requireOrg()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, tin, vat_registered')
    .eq('id', orgId)
    .single()

  const [invoicesRes, expensesRes, payrollRes] = await Promise.all([
    // Revenue: paid + partial invoices (use paid_amount for actual revenue recognized)
    supabase
      .from('invoices')
      .select('subtotal, vat_amount, total_amount, paid_amount, status, expense_categories:invoice_items(total)')
      .eq('organization_id', orgId)
      .gte('invoice_date', start)
      .lte('invoice_date', end)
      .neq('status', 'void'),

    // Expenses: bills in the period grouped by category
    supabase
      .from('expenses')
      .select('amount, vat_amount, total_amount, category_id, expense_categories(name), description')
      .eq('organization_id', orgId)
      .gte('expense_date', start)
      .lte('expense_date', end)
      .neq('status', 'cancelled'),

    // Payroll: finalized runs in this period
    supabase
      .from('payroll_runs')
      .select('total_gross, total_sss_er, total_ph_er, total_pi_er')
      .eq('organization_id', orgId)
      .eq('period_month', month)
      .eq('period_year', year)
      .in('status', ['finalized', 'paid']),
  ])

  const allInvoices = invoicesRes.data ?? []
  const allExpenses = expensesRes.data ?? []
  const allPayroll  = payrollRes.data ?? []

  // Revenue: use subtotal (ex-VAT) as recognized revenue
  const grossRevenue = allInvoices.reduce((s, i) => s + i.subtotal, 0)
  const outputVat    = allInvoices.reduce((s, i) => s + (i.vat_amount ?? 0), 0)

  // Expenses grouped by category
  type ExpRow = { amount: number; vat_amount: number | null; total_amount: number; category_id: string | null; expense_categories: { name: string } | null; description: string }
  const expRows = allExpenses as unknown as ExpRow[]

  const categoryMap = new Map<string, { name: string; total: number }>()
  let totalInputVat = 0
  for (const exp of expRows) {
    const catName = exp.expense_categories?.name ?? 'Uncategorized'
    const catKey  = exp.category_id ?? 'uncategorized'
    const exVat   = exp.amount - (exp.vat_amount ?? 0)
    const existing = categoryMap.get(catKey)
    if (existing) {
      existing.total += exVat
    } else {
      categoryMap.set(catKey, { name: catName, total: exVat })
    }
    totalInputVat += (exp.vat_amount ?? 0)
  }

  // Payroll expenses
  const payrollGross  = allPayroll.reduce((s, r) => s + r.total_gross, 0)
  const payrollEr     = allPayroll.reduce((s, r) => s + (r.total_sss_er ?? 0) + (r.total_ph_er ?? 0) + (r.total_pi_er ?? 0), 0)
  const totalPayroll  = payrollGross + payrollEr

  // Total operating expenses (ex-VAT) + payroll
  const totalOpEx = [...categoryMap.values()].reduce((s, c) => s + c.total, 0) + totalPayroll
  const vatPayable = outputVat - totalInputVat

  const grossProfit   = grossRevenue
  const operatingIncome = grossRevenue - totalOpEx
  const netIncome     = operatingIncome  // simplified — no interest/other income yet

  const currentYear = now.getFullYear()
  const years = [currentYear - 1, currentYear]

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-4 w-4" /> Reports
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profit & Loss</h1>
          <p className="text-gray-500 mt-1">Income Statement — {MONTHS[month - 1]} {year}</p>
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

      {/* P&L Statement */}
      <div className="border rounded-xl bg-white overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <p className="font-semibold text-gray-800">{org?.name}</p>
          <p className="text-sm text-gray-500">{MONTHS[month - 1]} {year}</p>
        </div>

        <div className="divide-y text-sm">
          {/* Revenue */}
          <div className="px-6 py-4">
            <p className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-3">Revenue</p>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600 pl-4">Gross Sales (ex-VAT)</span>
              <span className="font-mono">{centavosToDisplay(grossRevenue)}</span>
            </div>
            {org?.vat_registered && (
              <div className="flex justify-between text-gray-400 text-xs pl-4 mb-2">
                <span>Output VAT collected</span>
                <span className="font-mono">{centavosToDisplay(outputVat)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-2 mt-2">
              <span>Total Revenue</span>
              <span className="font-mono">{centavosToDisplay(grossRevenue)}</span>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="px-6 py-4">
            <p className="font-semibold text-gray-700 uppercase text-xs tracking-wide mb-3">Operating Expenses</p>

            {[...categoryMap.values()].sort((a, b) => b.total - a.total).map(cat => (
              <div key={cat.name} className="flex justify-between mb-1 pl-4">
                <span className="text-gray-600">{cat.name}</span>
                <span className="font-mono">{centavosToDisplay(cat.total)}</span>
              </div>
            ))}

            {totalPayroll > 0 && (
              <div className="flex justify-between mb-1 pl-4">
                <span className="text-gray-600">Salaries &amp; Benefits</span>
                <span className="font-mono">{centavosToDisplay(totalPayroll)}</span>
              </div>
            )}

            {totalOpEx === 0 && (
              <p className="text-gray-400 text-xs pl-4">No expenses recorded this period.</p>
            )}

            <div className="flex justify-between font-semibold border-t pt-2 mt-2">
              <span>Total Expenses</span>
              <span className="font-mono text-red-700">{centavosToDisplay(totalOpEx)}</span>
            </div>
          </div>

          {/* Operating Income */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex justify-between font-bold text-base">
              <span>Operating Income</span>
              <span className={`font-mono ${operatingIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {operatingIncome < 0 && '('}
                {centavosToDisplay(Math.abs(operatingIncome))}
                {operatingIncome < 0 && ')'}
              </span>
            </div>
          </div>

          {/* VAT note */}
          {org?.vat_registered && (
            <div className="px-6 py-3 text-xs text-gray-500 flex justify-between">
              <span>VAT Payable to BIR (Q{Math.ceil(month / 3)} {year})</span>
              <span className={`font-mono ${vatPayable >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {vatPayable >= 0 ? centavosToDisplay(vatPayable) : `(${centavosToDisplay(Math.abs(vatPayable))})`}
              </span>
            </div>
          )}

          {/* Net Income */}
          <div className="px-6 py-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Net Income</span>
              <span className={`font-mono ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {netIncome < 0 && '('}
                {centavosToDisplay(Math.abs(netIncome))}
                {netIncome < 0 && ')'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Revenue is recognized on invoice date (accrual basis). Expenses are recognized on bill date. Payroll is included for finalized runs in this period.
      </p>
    </div>
  )
}

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

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const now = new Date()
  const year  = parseInt(sp.year  ?? String(now.getFullYear()))
  const month = parseInt(sp.month ?? String(now.getMonth() + 1))

  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  // As-of date: end of selected month
  const asOf = `${year}-${pad(month)}-${lastDay}`

  const { supabase, orgId } = await requireOrg()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, tin')
    .eq('id', orgId)
    .single()

  const [
    invoicesRes,
    expensesRes,
    payrollRes,
    remittancesRes,
  ] = await Promise.all([
    // All non-void invoices up to as-of date
    supabase
      .from('invoices')
      .select('subtotal, vat_amount, total_amount, paid_amount, status')
      .eq('organization_id', orgId)
      .lte('invoice_date', asOf)
      .neq('status', 'void'),

    // All non-cancelled expenses up to as-of date
    supabase
      .from('expenses')
      .select('amount, vat_amount, total_amount, paid_amount, status')
      .eq('organization_id', orgId)
      .lte('expense_date', asOf)
      .neq('status', 'cancelled'),

    // All finalized/paid payroll runs up to as-of month
    supabase
      .from('payroll_runs')
      .select('total_gross, total_net, total_sss_er, total_ph_er, total_pi_er, period_year, period_month')
      .eq('organization_id', orgId)
      .in('status', ['finalized', 'paid'])
      .or(`period_year.lt.${year},and(period_year.eq.${year},period_month.lte.${month})`),

    // Pending remittances (unpaid gov't liabilities)
    supabase
      .from('remittances')
      .select('total_amount, agency, status')
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .lte('due_date', asOf),
  ])

  const allInvoices  = invoicesRes.data  ?? []
  const allExpenses  = expensesRes.data  ?? []
  const allPayroll   = payrollRes.data   ?? []
  const pendingRemit = remittancesRes.data ?? []

  // ── ASSETS ──────────────────────────────────────────────
  // Accounts Receivable: unpaid/partial invoice balances
  const ar = allInvoices
    .filter(i => i.status === 'unpaid' || i.status === 'partial')
    .reduce((s, i) => s + (i.total_amount - i.paid_amount), 0)

  // Cash collected: all paid amounts on invoices
  const cashFromSales = allInvoices.reduce((s, i) => s + i.paid_amount, 0)

  // Cash paid out: all paid amounts on expenses
  const cashPaidExpenses = allExpenses.reduce((s, e) => s + (e.paid_amount ?? 0), 0)

  // Cash paid out: net payroll (approximate cash outflow)
  const cashPaidPayroll = allPayroll.reduce((s, p) => s + p.total_net, 0)

  // Cash on hand (approximate: collections minus payments)
  const cashAndEquivalents = Math.max(0, cashFromSales - cashPaidExpenses - cashPaidPayroll)

  const totalCurrentAssets = cashAndEquivalents + ar
  const totalAssets = totalCurrentAssets

  // ── LIABILITIES ─────────────────────────────────────────
  // Accounts Payable: unpaid/partial bill balances
  const ap = allExpenses
    .filter(e => e.status === 'received' || e.status === 'partial')
    .reduce((s, e) => s + (e.total_amount - (e.paid_amount ?? 0)), 0)

  // Government contributions payable (employer share from finalized payroll)
  const govtPayable = allPayroll.reduce((s, p) => {
    return s + (p.total_sss_er ?? 0) + (p.total_ph_er ?? 0) + (p.total_pi_er ?? 0)
  }, 0)

  // Tax payable: pending remittances overdue
  const taxPayable = pendingRemit.reduce((s, r) => s + r.total_amount, 0)

  const totalCurrentLiabilities = ap + govtPayable + taxPayable
  const totalLiabilities = totalCurrentLiabilities

  // ── EQUITY ──────────────────────────────────────────────
  // Retained Earnings = Total Revenue - Total Expenses (cumulative)
  const totalRevenue  = allInvoices.reduce((s, i) => s + i.subtotal, 0)
  const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0)
  const totalPayrollCost = allPayroll.reduce((s, p) => s + p.total_gross, 0)
  const retainedEarnings = totalRevenue - totalExpenses - totalPayrollCost

  const totalEquity = retainedEarnings
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

  // Build year/month selectors
  const years  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const Row = ({ label, amount, indent = false, bold = false, border = false }: {
    label: string; amount: number; indent?: boolean; bold?: boolean; border?: boolean
  }) => (
    <div className={`flex justify-between py-1.5 text-sm ${border ? 'border-t border-[#D8E2EE] mt-1 pt-2' : ''}`}>
      <span className={`${indent ? 'pl-6' : ''} ${bold ? 'font-semibold text-[#0B1F3A]' : 'text-[#3D5166]'}`}>{label}</span>
      <span className={`font-mono ${bold ? 'font-semibold text-[#0B1F3A]' : 'text-[#3D5166]'} ${amount < 0 ? 'text-red-600' : ''}`}>
        {centavosToDisplay(Math.abs(amount))}{amount < 0 ? ' (deficit)' : ''}
      </span>
    </div>
  )

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mt-6 mb-2">
      <p className="text-xs font-bold uppercase tracking-[1px] text-[#00C48C]">{title}</p>
    </div>
  )

  return (
    <div className="p-8 space-y-6 pb-24 max-w-3xl">
      {/* Back */}
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-[#6B84A0] hover:text-[#0B1F3A] transition-colors">
        <ChevronLeft className="w-4 h-4" /> Reports
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Balance Sheet</h1>
        <p className="text-[#6B84A0] text-sm mt-1">
          {org?.name ?? 'Your Organization'}{org?.tin ? ` · TIN: ${org.tin}` : ''}
        </p>
        <p className="text-[#6B84A0] text-sm">As of {MONTHS[month - 1]} {lastDay}, {year}</p>
      </div>

      {/* Period selector */}
      <form method="GET" className="flex items-center gap-3 flex-wrap">
        <select name="month" defaultValue={month}
          className="border border-[#D8E2EE] rounded-lg px-3 py-2 text-sm text-[#1A2B3C] bg-white focus:outline-none focus:border-[#00C48C]">
          {months.map(m => <option key={m} value={m}>{MONTHS[m - 1]}</option>)}
        </select>
        <select name="year" defaultValue={year}
          className="border border-[#D8E2EE] rounded-lg px-3 py-2 text-sm text-[#1A2B3C] bg-white focus:outline-none focus:border-[#00C48C]">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-[#00C48C] text-white text-sm font-semibold hover:bg-[#009E72] transition-colors">
          Update
        </button>
      </form>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
        <strong>Note:</strong> This balance sheet is derived from your invoices, bills, and payroll records.
        Cash balance is estimated from collections minus payments. For audited financials, consult your accountant.
      </div>

      {/* Balance Sheet */}
      <div className="bg-white border border-[#D8E2EE] rounded-xl p-6 space-y-1">

        {/* ASSETS */}
        <p className="text-base font-bold text-[#0B1F3A] border-b border-[#D8E2EE] pb-2">ASSETS</p>

        <SectionHeader title="Current Assets" />
        <Row label="Cash and Cash Equivalents" amount={cashAndEquivalents} indent />
        <Row label="Accounts Receivable" amount={ar} indent />
        <Row label="Total Current Assets" amount={totalCurrentAssets} bold border />
        <Row label="TOTAL ASSETS" amount={totalAssets} bold border />

        {/* LIABILITIES */}
        <p className="text-base font-bold text-[#0B1F3A] border-b border-[#D8E2EE] pb-2 mt-8">LIABILITIES</p>

        <SectionHeader title="Current Liabilities" />
        <Row label="Accounts Payable" amount={ap} indent />
        <Row label="Government Contributions Payable (Employer)" amount={govtPayable} indent />
        <Row label="Tax Payable (Pending Remittances)" amount={taxPayable} indent />
        <Row label="Total Current Liabilities" amount={totalCurrentLiabilities} bold border />
        <Row label="TOTAL LIABILITIES" amount={totalLiabilities} bold border />

        {/* EQUITY */}
        <p className="text-base font-bold text-[#0B1F3A] border-b border-[#D8E2EE] pb-2 mt-8">EQUITY</p>

        <SectionHeader title="Owner's Equity" />
        <Row label="Retained Earnings" amount={retainedEarnings} indent />
        <Row label="TOTAL EQUITY" amount={totalEquity} bold border />

        {/* CHECK */}
        <div className="mt-6 pt-4 border-t-2 border-[#0B1F3A] space-y-1">
          <Row label="TOTAL LIABILITIES AND EQUITY" amount={totalLiabilitiesAndEquity} bold />
          {Math.abs(totalAssets - totalLiabilitiesAndEquity) > 1 && (
            <p className="text-xs text-red-500 mt-1">
              ⚠ Balance sheet does not balance — difference of {centavosToDisplay(Math.abs(totalAssets - totalLiabilitiesAndEquity))}.
              This may be due to equity contributions not tracked in this system.
            </p>
          )}
          {Math.abs(totalAssets - totalLiabilitiesAndEquity) <= 1 && (
            <p className="text-xs text-[#00C48C] mt-1">✓ Balance sheet balances.</p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-[#F4F7FB] border border-[#D8E2EE] rounded-xl p-4 text-xs text-[#6B84A0] space-y-1">
        <p className="font-semibold text-[#0B1F3A] mb-2">How figures are calculated</p>
        <p><strong>Cash:</strong> Total collected from invoices minus payments made on bills and net payroll.</p>
        <p><strong>Accounts Receivable:</strong> Outstanding balances on unpaid/partial invoices.</p>
        <p><strong>Accounts Payable:</strong> Outstanding balances on unpaid/partial bills.</p>
        <p><strong>Gov't Contributions Payable:</strong> Employer share (SSS/PhilHealth/Pag-IBIG) from finalized payroll runs.</p>
        <p><strong>Retained Earnings:</strong> Cumulative revenue (invoice subtotals) minus expenses and gross payroll costs.</p>
      </div>
    </div>
  )
}

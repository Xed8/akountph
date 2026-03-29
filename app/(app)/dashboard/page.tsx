import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { formatDate, isOverdue, isDueSoon } from '@/lib/formatting/dates'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users, Calculator, CheckCircle2, AlertCircle, Clock,
  Banknote, FileText, Activity, ArrowRight, Plus,
  TrendingUp, TrendingDown, Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CashFlowChart } from '@/components/cash-flow-chart'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!membership) redirect('/onboarding')
  const orgId = membership.organization_id

  const { data: orgData } = await supabase
    .from('organizations')
    .select('name, vat_registered')
    .eq('id', orgId)
    .single()
  const orgName = orgData?.name ?? 'Your Organization'

  // Current quarter for VAT
  const now = new Date()
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3)
  const currentYear = now.getFullYear()
  const quarterStarts = ['01-01', '04-01', '07-01', '10-01']
  const quarterEnds   = ['03-31', '06-30', '09-30', '12-31']
  const qStart = `${currentYear}-${quarterStarts[currentQuarter - 1]}`
  const qEnd   = `${currentYear}-${quarterEnds[currentQuarter - 1]}`

  // Last 6 months range for cash flow chart
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const cfStart = sixMonthsAgo.toISOString().split('T')[0]

  const [
    employeesRes,
    latestRunRes,
    remittancesRes,
    invoicesRes,
    billsRes,
    outputVatRes,
    inputVatRes,
    cfIncomeRes,
    cfExpenseRes,
  ] = await Promise.all([
    // Employees
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .is('deleted_at', null),

    // Latest payroll run
    supabase
      .from('payroll_runs')
      .select('id, total_gross, total_net, period_label, status')
      .eq('organization_id', orgId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Pending remittances
    supabase
      .from('remittances')
      .select('id, agency, form_number, period_label, due_date, total_amount, status')
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true }),

    // AR — unpaid/partial invoices
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, due_date, total_amount, paid_amount, status, clients(name)')
      .eq('organization_id', orgId)
      .in('status', ['unpaid', 'partial'])
      .order('due_date', { ascending: true })
      .limit(5),

    // AP — unpaid/partial bills
    supabase
      .from('expenses')
      .select('id, bill_number, expense_date, due_date, total_amount, paid_amount, status, vendors(name)')
      .eq('organization_id', orgId)
      .in('status', ['received', 'partial'])
      .order('due_date', { ascending: true })
      .limit(5),

    // Output VAT this quarter
    supabase
      .from('invoices')
      .select('vat_amount')
      .eq('organization_id', orgId)
      .gte('invoice_date', qStart)
      .lte('invoice_date', qEnd)
      .neq('status', 'void'),

    // Input VAT this quarter
    supabase
      .from('expenses')
      .select('vat_amount')
      .eq('organization_id', orgId)
      .gte('expense_date', qStart)
      .lte('expense_date', qEnd)
      .neq('status', 'cancelled'),

    // Cash flow: invoice subtotals last 6 months
    supabase
      .from('invoices')
      .select('invoice_date, subtotal')
      .eq('organization_id', orgId)
      .gte('invoice_date', cfStart)
      .neq('status', 'void'),

    // Cash flow: expense amounts last 6 months
    supabase
      .from('expenses')
      .select('expense_date, amount')
      .eq('organization_id', orgId)
      .gte('expense_date', cfStart)
      .neq('status', 'cancelled'),
  ])

  const activeEmployees = employeesRes.count ?? 0
  const latestRun = latestRunRes.data
  const pendingRemittances = remittancesRes.data ?? []
  const arInvoices = invoicesRes.data ?? []
  const apBills = billsRes.data ?? []

  const totalAR = arInvoices.reduce((s, i) => s + (i.total_amount - i.paid_amount), 0)
  const totalAP = apBills.reduce((s, b) => s + (b.total_amount - (b.paid_amount ?? 0)), 0)
  const totalOutputVat = (outputVatRes.data ?? []).reduce((s, i) => s + (i.vat_amount ?? 0), 0)
  const totalInputVat  = (inputVatRes.data ?? []).reduce((s, e) => s + (e.vat_amount ?? 0), 0)
  const vatPayable = totalOutputVat - totalInputVat

  // AR open vs overdue breakdown
  const today = new Date().toISOString().split('T')[0]
  let arOpen = 0, arOverdue = 0
  for (const inv of arInvoices) {
    const bal = inv.total_amount - inv.paid_amount
    if (bal <= 0) continue
    if (inv.due_date && inv.due_date < today) arOverdue += bal
    else arOpen += bal
  }

  // Build 6-month cash flow data
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const cfMonths: { label: string; income: number; expenses: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yr = d.getFullYear()
    const mo = d.getMonth() + 1
    const key = `${yr}-${String(mo).padStart(2, '0')}`
    const income = (cfIncomeRes.data ?? [])
      .filter(r => r.invoice_date?.startsWith(key))
      .reduce((s, r) => s + (r.subtotal ?? 0), 0)
    const expenses = (cfExpenseRes.data ?? [])
      .filter(r => r.expense_date?.startsWith(key))
      .reduce((s, r) => s + (r.amount ?? 0), 0)
    cfMonths.push({ label: MONTH_LABELS[mo - 1], income, expenses })
  }

  const overdueCount = pendingRemittances.filter(r => isOverdue(r.due_date)).length
  const dueSoonCount = pendingRemittances.filter(r => !isOverdue(r.due_date) && isDueSoon(r.due_date)).length
  const firstName = user.user_metadata?.first_name ?? 'Team'

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
            Good morning, {firstName}
          </h1>
          <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening at {orgName} today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/invoices/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 h-9 px-4 py-2 gap-2">
            <Plus className="h-4 w-4" /> New Invoice
          </Link>
          <Link href="/payroll/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-9 px-4 py-2 gap-2">
            <Calculator className="h-4 w-4" /> Run Payroll
          </Link>
        </div>
      </div>

      {/* KPI Ribbon — 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex flex-col gap-3">
            <Users className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xl font-bold text-slate-900">{activeEmployees}</p>
              <p className="text-xs text-slate-500">Employees</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex flex-col gap-3">
            <Banknote className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xl font-bold text-slate-900 truncate">
                {latestRun ? centavosToDisplay(latestRun.total_gross) : '₱0.00'}
              </p>
              <p className="text-xs text-slate-500">Gross Payroll</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex flex-col gap-3">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <div>
              <p className="text-xl font-bold text-indigo-700 truncate">{centavosToDisplay(totalAR)}</p>
              <p className="text-xs text-slate-500">AR (Receivables)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex flex-col gap-3">
            <TrendingDown className="h-4 w-4 text-amber-400" />
            <div>
              <p className="text-xl font-bold text-amber-700 truncate">{centavosToDisplay(totalAP)}</p>
              <p className="text-xs text-slate-500">AP (Payables)</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-sm border-slate-200", vatPayable > 0 ? "border-red-200" : "")}>
          <CardContent className="p-4 flex flex-col gap-3">
            <Receipt className="h-4 w-4 text-red-400" />
            <div>
              <p className={cn("text-xl font-bold truncate", vatPayable >= 0 ? "text-red-700" : "text-emerald-700")}>
                {centavosToDisplay(Math.abs(vatPayable))}
              </p>
              <p className="text-xs text-slate-500">
                {vatPayable >= 0 ? `VAT Payable Q${currentQuarter}` : `Excess Input VAT`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-sm border-slate-200", overdueCount > 0 ? "border-red-200" : dueSoonCount > 0 ? "border-amber-200" : "")}>
          <CardContent className="p-4 flex flex-col gap-3">
            {overdueCount > 0
              ? <AlertCircle className="h-4 w-4 text-red-500" />
              : dueSoonCount > 0
              ? <Clock className="h-4 w-4 text-amber-500" />
              : <FileText className="h-4 w-4 text-slate-400" />}
            <div>
              <p className="text-xl font-bold text-slate-900">{pendingRemittances.length}</p>
              <p className="text-xs text-slate-500">
                {overdueCount > 0 ? `${overdueCount} overdue` : dueSoonCount > 0 ? `${dueSoonCount} due soon` : 'Remittances'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Cash Flow — Last 6 Months</h2>
            <Link href="/reports/pl" className="text-xs text-indigo-600 hover:underline">View P&amp;L</Link>
          </div>
          <CashFlowChart data={cfMonths} />
        </CardContent>
      </Card>

      {/* Main 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AR — Outstanding Invoices */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">AR — Accounts Receivable</h2>
            <Link href="/invoices" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {totalAR > 0 && (
            <div className="border border-slate-200 rounded-xl bg-white px-4 py-3 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="text-emerald-600 font-medium">Open · {centavosToDisplay(arOpen)}</span>
                <span className="text-red-500 font-medium">Overdue · {centavosToDisplay(arOverdue)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${totalAR > 0 ? (arOpen / totalAR) * 100 : 0}%` }}
                />
                <div className="h-full bg-red-400 flex-1" />
              </div>
              <p className="text-xs text-slate-400 text-right">{centavosToDisplay(totalAR)} total outstanding</p>
            </div>
          )}

          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            {!arInvoices.length ? (
              <div className="px-5 py-8 text-center">
                <TrendingUp className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No outstanding invoices</p>
              </div>
            ) : (
              <div className="divide-y text-sm">
                {arInvoices.map(inv => {
                  const client = (inv.clients as unknown) as { name: string } | null
                  const balance = inv.total_amount - inv.paid_amount
                  const overdue = inv.due_date ? isOverdue(inv.due_date) : false
                  return (
                    <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{client?.name ?? '—'}</p>
                        <p className={cn("text-xs", overdue ? "text-red-500" : "text-slate-400")}>
                          {inv.due_date ? (overdue ? `Overdue · ${inv.due_date}` : `Due ${inv.due_date}`) : inv.invoice_date}
                        </p>
                      </div>
                      <span className={cn("font-mono text-xs font-semibold ml-3", overdue ? "text-red-600" : "text-indigo-700")}>
                        {centavosToDisplay(balance)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* AP — Outstanding Bills */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">AP — Accounts Payable</h2>
            <Link href="/bills" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            {!apBills.length ? (
              <div className="px-5 py-8 text-center">
                <TrendingDown className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No outstanding bills</p>
              </div>
            ) : (
              <div className="divide-y text-sm">
                {apBills.map(bill => {
                  const vendor = (bill.vendors as unknown) as { name: string } | null
                  const balance = bill.total_amount - (bill.paid_amount ?? 0)
                  const overdue = bill.due_date ? isOverdue(bill.due_date) : false
                  return (
                    <Link key={bill.id} href={`/bills/${bill.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{vendor?.name ?? bill.bill_number ?? '—'}</p>
                        <p className={cn("text-xs", overdue ? "text-red-500" : "text-slate-400")}>
                          {bill.due_date ? (overdue ? `Overdue · ${bill.due_date}` : `Due ${bill.due_date}`) : bill.expense_date}
                        </p>
                      </div>
                      <span className={cn("font-mono text-xs font-semibold ml-3", overdue ? "text-red-600" : "text-amber-700")}>
                        {centavosToDisplay(balance)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Payroll + Remittances */}
        <div className="space-y-6">
          {/* Payroll summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Latest Payroll</h2>
              {latestRun && (
                <Link href={`/payroll/${latestRun.id}`} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  View <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="border border-slate-200 rounded-xl bg-white p-4">
              {latestRun ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">{latestRun.period_label}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Gross</span>
                    <span className="font-mono font-semibold">{centavosToDisplay(latestRun.total_gross)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Net Pay</span>
                    <span className="font-mono font-semibold text-emerald-700">{centavosToDisplay(latestRun.total_net)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Deductions</span>
                    <span className="font-mono text-slate-500">{centavosToDisplay(latestRun.total_gross - latestRun.total_net)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded h-1.5 overflow-hidden flex mt-1">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(latestRun.total_net / latestRun.total_gross) * 100}%` }} />
                    <div className="bg-slate-300 h-full flex-1" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calculator className="h-5 w-5 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-3">No payroll runs yet</p>
                  <Link href="/payroll/new" className="text-xs text-indigo-600 hover:underline">Run payroll →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming remittance deadlines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Upcoming Deadlines</h2>
              <Link href="/remittances" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
              {!pendingRemittances.length ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle2 className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y text-sm">
                  {pendingRemittances.slice(0, 4).map(r => {
                    const overdue = isOverdue(r.due_date)
                    const soon = !overdue && isDueSoon(r.due_date)
                    return (
                      <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate text-xs">{r.agency} · {r.form_number}</p>
                          <p className={cn("text-xs mt-0.5", overdue ? "text-red-500" : soon ? "text-amber-600" : "text-slate-400")}>
                            {overdue ? 'Overdue' : soon ? 'Due soon'  : 'Pending'} · {formatDate(r.due_date)}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-700 shrink-0">{centavosToDisplay(r.total_amount)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

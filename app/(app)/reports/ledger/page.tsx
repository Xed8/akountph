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

type LedgerEntry = {
  date: string
  reference: string
  description: string
  account: string
  debit: number
  credit: number
  source: 'invoice' | 'bill' | 'payment_received' | 'payment_made' | 'payroll'
}

export default async function GeneralLedgerPage({
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

  const { data: org } = await supabase
    .from('organizations')
    .select('name, tin')
    .eq('id', orgId)
    .single()

  const [invoicesRes, paymentsInRes, expensesRes, paymentsOutRes, payrollRes] = await Promise.all([
    // Invoices issued (Revenue + AR)
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, subtotal, vat_amount, total_amount, clients(name)')
      .eq('organization_id', orgId)
      .gte('invoice_date', start)
      .lte('invoice_date', end)
      .neq('status', 'void')
      .order('invoice_date', { ascending: true }),

    // Payments received on invoices
    supabase
      .from('invoice_payments')
      .select('id, payment_date, amount, payment_method, invoices(invoice_number, clients(name))')
      .eq('organization_id', orgId)
      .gte('payment_date', start)
      .lte('payment_date', end)
      .order('payment_date', { ascending: true }),

    // Bills received (Expense + AP)
    supabase
      .from('expenses')
      .select('id, bill_number, expense_date, amount, vat_amount, total_amount, vendors(name), expense_categories(name)')
      .eq('organization_id', orgId)
      .gte('expense_date', start)
      .lte('expense_date', end)
      .neq('status', 'cancelled')
      .order('expense_date', { ascending: true }),

    // Payments made on bills
    supabase
      .from('expense_payments')
      .select('id, payment_date, amount, payment_method, expenses(bill_number, vendors(name))')
      .eq('organization_id', orgId)
      .gte('payment_date', start)
      .lte('payment_date', end)
      .order('payment_date', { ascending: true }),

    // Payroll runs finalized this month
    supabase
      .from('payroll_runs')
      .select('id, period_label, total_gross, total_net, total_sss_er, total_ph_er, total_pi_er')
      .eq('organization_id', orgId)
      .eq('period_month', month)
      .eq('period_year', year)
      .in('status', ['finalized', 'paid'])
      .order('created_at', { ascending: true }),
  ])

  const entries: LedgerEntry[] = []

  // Invoices → DR Accounts Receivable / CR Revenue + VAT Payable
  for (const inv of invoicesRes.data ?? []) {
    const client = (inv.clients as unknown as { name: string } | null)?.name ?? 'Client'
    const ref = inv.invoice_number ?? `INV-${inv.id.slice(0, 6)}`
    entries.push({
      date: inv.invoice_date,
      reference: ref,
      description: `Invoice to ${client}`,
      account: 'Accounts Receivable',
      debit: inv.total_amount,
      credit: 0,
      source: 'invoice',
    })
    entries.push({
      date: inv.invoice_date,
      reference: ref,
      description: `Invoice to ${client}`,
      account: 'Revenue (Sales)',
      debit: 0,
      credit: inv.subtotal,
      source: 'invoice',
    })
    if ((inv.vat_amount ?? 0) > 0) {
      entries.push({
        date: inv.invoice_date,
        reference: ref,
        description: `VAT on invoice to ${client}`,
        account: 'Output VAT Payable',
        debit: 0,
        credit: inv.vat_amount ?? 0,
        source: 'invoice',
      })
    }
  }

  // Payments received → DR Cash / CR Accounts Receivable
  for (const pmt of paymentsInRes.data ?? []) {
    const inv = pmt.invoices as unknown as { invoice_number: string; clients: { name: string } | null } | null
    const ref = inv?.invoice_number ?? 'PMT'
    const client = inv?.clients?.name ?? 'Client'
    entries.push({
      date: pmt.payment_date,
      reference: ref,
      description: `Payment from ${client}`,
      account: 'Cash',
      debit: pmt.amount,
      credit: 0,
      source: 'payment_received',
    })
    entries.push({
      date: pmt.payment_date,
      reference: ref,
      description: `Payment from ${client}`,
      account: 'Accounts Receivable',
      debit: 0,
      credit: pmt.amount,
      source: 'payment_received',
    })
  }

  // Bills → DR Expense + Input VAT / CR Accounts Payable
  for (const bill of expensesRes.data ?? []) {
    const vendor = (bill.vendors as unknown as { name: string } | null)?.name ?? 'Vendor'
    const category = (bill.expense_categories as unknown as { name: string } | null)?.name ?? 'Expense'
    const ref = bill.bill_number ?? `BILL-${bill.id.slice(0, 6)}`
    entries.push({
      date: bill.expense_date,
      reference: ref,
      description: `Bill from ${vendor} (${category})`,
      account: `Expense — ${category}`,
      debit: bill.amount,
      credit: 0,
      source: 'bill',
    })
    if ((bill.vat_amount ?? 0) > 0) {
      entries.push({
        date: bill.expense_date,
        reference: ref,
        description: `Input VAT — ${vendor}`,
        account: 'Input VAT',
        debit: bill.vat_amount ?? 0,
        credit: 0,
        source: 'bill',
      })
    }
    entries.push({
      date: bill.expense_date,
      reference: ref,
      description: `Bill from ${vendor}`,
      account: 'Accounts Payable',
      debit: 0,
      credit: bill.total_amount,
      source: 'bill',
    })
  }

  // Payments made → DR Accounts Payable / CR Cash
  for (const pmt of paymentsOutRes.data ?? []) {
    const bill = pmt.expenses as unknown as { bill_number: string | null; vendors: { name: string } | null } | null
    const ref = bill?.bill_number ?? 'PMT'
    const vendor = bill?.vendors?.name ?? 'Vendor'
    entries.push({
      date: pmt.payment_date,
      reference: ref,
      description: `Payment to ${vendor}`,
      account: 'Accounts Payable',
      debit: pmt.amount,
      credit: 0,
      source: 'payment_made',
    })
    entries.push({
      date: pmt.payment_date,
      reference: ref,
      description: `Payment to ${vendor}`,
      account: 'Cash',
      debit: 0,
      credit: pmt.amount,
      source: 'payment_made',
    })
  }

  // Payroll → DR Salaries Expense / CR Cash (net) + Liabilities (deductions)
  for (const run of payrollRes.data ?? []) {
    const ref = `PR-${run.period_label}`
    const employerContribs = (run.total_sss_er ?? 0) + (run.total_ph_er ?? 0) + (run.total_pi_er ?? 0)
    entries.push({
      date: `${year}-${pad(month)}-${lastDay}`,
      reference: ref,
      description: `Payroll — ${run.period_label}`,
      account: 'Salaries Expense',
      debit: run.total_gross,
      credit: 0,
      source: 'payroll',
    })
    entries.push({
      date: `${year}-${pad(month)}-${lastDay}`,
      reference: ref,
      description: `Net pay — ${run.period_label}`,
      account: 'Cash',
      debit: 0,
      credit: run.total_net,
      source: 'payroll',
    })
    if (employerContribs > 0) {
      entries.push({
        date: `${year}-${pad(month)}-${lastDay}`,
        reference: ref,
        description: `Gov't contributions payable — ${run.period_label}`,
        account: "Gov't Contributions Payable",
        debit: 0,
        credit: employerContribs,
        source: 'payroll',
      })
    }
  }

  // Sort by date
  entries.sort((a, b) => a.date.localeCompare(b.date))

  const totalDebits  = entries.reduce((s, e) => s + e.debit, 0)
  const totalCredits = entries.reduce((s, e) => s + e.credit, 0)

  const years  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const sourceColor = (s: LedgerEntry['source']) => {
    switch (s) {
      case 'invoice': return 'bg-blue-50 text-blue-700'
      case 'payment_received': return 'bg-green-50 text-green-700'
      case 'bill': return 'bg-amber-50 text-amber-700'
      case 'payment_made': return 'bg-red-50 text-red-700'
      case 'payroll': return 'bg-purple-50 text-purple-700'
    }
  }

  const sourceLabel = (s: LedgerEntry['source']) => {
    switch (s) {
      case 'invoice': return 'Invoice'
      case 'payment_received': return 'Receipt'
      case 'bill': return 'Bill'
      case 'payment_made': return 'Payment'
      case 'payroll': return 'Payroll'
    }
  }

  return (
    <div className="p-8 space-y-6 pb-24">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-[#6B84A0] hover:text-[#0B1F3A] transition-colors">
        <ChevronLeft className="w-4 h-4" /> Reports
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3A]">General Ledger</h1>
        <p className="text-[#6B84A0] text-sm mt-1">
          {org?.name ?? 'Your Organization'}{org?.tin ? ` · TIN: ${org.tin}` : ''}
        </p>
        <p className="text-[#6B84A0] text-sm">
          {MONTHS[month - 1]} {year} · {entries.length} entries
        </p>
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

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#D8E2EE] rounded-xl p-4">
          <p className="text-xs text-[#6B84A0] mb-1">Total Debits</p>
          <p className="text-lg font-bold text-[#0B1F3A] font-mono">{centavosToDisplay(totalDebits)}</p>
        </div>
        <div className="bg-white border border-[#D8E2EE] rounded-xl p-4">
          <p className="text-xs text-[#6B84A0] mb-1">Total Credits</p>
          <p className="text-lg font-bold text-[#0B1F3A] font-mono">{centavosToDisplay(totalCredits)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${Math.abs(totalDebits - totalCredits) <= 1 ? 'bg-[#E6FBF5] border-[#00C48C]' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-[#6B84A0] mb-1">Balance Check</p>
          <p className={`text-lg font-bold font-mono ${Math.abs(totalDebits - totalCredits) <= 1 ? 'text-[#00C48C]' : 'text-red-600'}`}>
            {Math.abs(totalDebits - totalCredits) <= 1 ? '✓ Balanced' : `Diff: ${centavosToDisplay(Math.abs(totalDebits - totalCredits))}`}
          </p>
        </div>
      </div>

      {/* Ledger table */}
      {entries.length === 0 ? (
        <div className="bg-white border border-[#D8E2EE] rounded-xl p-12 text-center">
          <p className="text-[#6B84A0]">No transactions found for {MONTHS[month - 1]} {year}.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F4F7FB] border-b border-[#D8E2EE]">
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Account</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Debit</th>
                  <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Credit</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-b border-[#EEF2F8] hover:bg-[#F4F7FB] transition-colors">
                    <td className="px-4 py-2.5 text-[#3D5166] whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[#3D5166]">{e.reference}</td>
                    <td className="px-4 py-2.5 font-medium text-[#0B1F3A]">{e.account}</td>
                    <td className="px-4 py-2.5 text-[#6B84A0] max-w-[200px] truncate">{e.description}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${sourceColor(e.source)}`}>
                        {sourceLabel(e.source)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#0B1F3A]">
                      {e.debit > 0 ? centavosToDisplay(e.debit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#0B1F3A]">
                      {e.credit > 0 ? centavosToDisplay(e.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F4F7FB] border-t-2 border-[#D8E2EE] font-semibold">
                  <td colSpan={5} className="px-4 py-3 text-[#0B1F3A]">TOTALS</td>
                  <td className="px-4 py-3 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(totalDebits)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(totalCredits)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

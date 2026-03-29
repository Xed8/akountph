import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { ChevronLeft } from 'lucide-react'

interface SearchParams {
  year?: string
  month?: string
  book?: string
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const BOOKS = [
  { id: 'general', label: 'General Journal' },
  { id: 'sales', label: 'Sales Journal' },
  { id: 'purchases', label: 'Purchase Journal' },
]

export default async function BooksOfAccountsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const now = new Date()
  const year  = parseInt(sp.year  ?? String(now.getFullYear()))
  const month = parseInt(sp.month ?? String(now.getMonth() + 1))
  const book  = sp.book ?? 'general'

  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${year}-${pad(month)}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${pad(month)}-${lastDay}`

  const { supabase, orgId } = await requireOrg()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, tin, address')
    .eq('id', orgId)
    .single()

  const years  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  // ── SALES JOURNAL ──────────────────────────────────────
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, invoice_date, subtotal, vat_amount, total_amount, clients(name, tin)')
    .eq('organization_id', orgId)
    .gte('invoice_date', start)
    .lte('invoice_date', end)
    .neq('status', 'void')
    .order('invoice_date', { ascending: true })

  // ── PURCHASE JOURNAL ────────────────────────────────────
  const { data: bills } = await supabase
    .from('expenses')
    .select('id, bill_number, expense_date, amount, vat_amount, total_amount, vendors(name, tin), expense_categories(name)')
    .eq('organization_id', orgId)
    .gte('expense_date', start)
    .lte('expense_date', end)
    .neq('status', 'cancelled')
    .order('expense_date', { ascending: true })

  // ── GENERAL JOURNAL ─────────────────────────────────────
  const { data: payrollRuns } = await supabase
    .from('payroll_runs')
    .select('id, period_label, total_gross, total_net, total_sss_er, total_ph_er, total_pi_er, total_sss_ee, total_ph_ee, total_pi_ee, total_wtax')
    .eq('organization_id', orgId)
    .eq('period_month', month)
    .eq('period_year', year)
    .in('status', ['finalized', 'paid'])

  const { data: invoicePayments } = await supabase
    .from('invoice_payments')
    .select('id, payment_date, amount, invoices(invoice_number, clients(name))')
    .eq('organization_id', orgId)
    .gte('payment_date', start)
    .lte('payment_date', end)
    .order('payment_date', { ascending: true })

  const { data: expensePayments } = await supabase
    .from('expense_payments')
    .select('id, payment_date, amount, expenses(bill_number, vendors(name))')
    .eq('organization_id', orgId)
    .gte('payment_date', start)
    .lte('payment_date', end)
    .order('payment_date', { ascending: true })

  // Totals
  const salesTotal    = (invoices ?? []).reduce((s, i) => s + i.total_amount, 0)
  const salesVat      = (invoices ?? []).reduce((s, i) => s + (i.vat_amount ?? 0), 0)
  const salesSubtotal = (invoices ?? []).reduce((s, i) => s + i.subtotal, 0)

  const purchasesTotal    = (bills ?? []).reduce((s, b) => s + b.total_amount, 0)
  const purchasesVat      = (bills ?? []).reduce((s, b) => s + (b.vat_amount ?? 0), 0)
  const purchasesSubtotal = (bills ?? []).reduce((s, b) => s + b.amount, 0)

  return (
    <div className="p-8 space-y-6 pb-24">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-[#6B84A0] hover:text-[#0B1F3A] transition-colors">
        <ChevronLeft className="w-4 h-4" /> Reports
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Books of Accounts (CBA)</h1>
        <p className="text-[#6B84A0] text-sm mt-1">
          {org?.name ?? 'Your Organization'}{org?.tin ? ` · TIN: ${org.tin}` : ''}
        </p>
        <p className="text-[#6B84A0] text-sm">{MONTHS[month - 1]} {year}</p>
      </div>

      {/* Controls */}
      <form method="GET" className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-[#D8E2EE] overflow-hidden">
          {BOOKS.map(b => (
            <button key={b.id} type="submit" name="book" value={b.id}
              className={`px-4 py-2 text-sm font-medium transition-colors ${book === b.id ? 'bg-[#00C48C] text-white' : 'bg-white text-[#3D5166] hover:bg-[#F4F7FB]'}`}>
              {b.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year" value={year} />
        <select name="month" defaultValue={month}
          className="border border-[#D8E2EE] rounded-lg px-3 py-2 text-sm text-[#1A2B3C] bg-white focus:outline-none focus:border-[#00C48C]">
          {months.map(m => <option key={m} value={m}>{MONTHS[m - 1]}</option>)}
        </select>
        <select name="year" defaultValue={year}
          className="border border-[#D8E2EE] rounded-lg px-3 py-2 text-sm text-[#1A2B3C] bg-white focus:outline-none focus:border-[#00C48C]">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </form>

      {/* SALES JOURNAL */}
      {book === 'sales' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Sales Journal</h2>
            <p className="text-sm text-[#6B84A0]">{(invoices ?? []).length} invoices</p>
          </div>
          <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F4F7FB] border-b border-[#D8E2EE]">
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Invoice #</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">TIN</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Sales (ex-VAT)</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Output VAT</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoices ?? []).map(inv => {
                    const client = inv.clients as unknown as { name: string; tin?: string } | null
                    return (
                      <tr key={inv.id} className="border-b border-[#EEF2F8] hover:bg-[#F4F7FB]">
                        <td className="px-4 py-2.5 text-[#3D5166]">{inv.invoice_date}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-[#3D5166]">{inv.invoice_number}</td>
                        <td className="px-4 py-2.5 font-medium text-[#0B1F3A]">{client?.name ?? '—'}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-[#6B84A0]">{client?.tin ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(inv.subtotal)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(inv.vat_amount ?? 0)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#0B1F3A]">{centavosToDisplay(inv.total_amount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F4F7FB] border-t-2 border-[#D8E2EE] font-bold">
                    <td colSpan={4} className="px-4 py-3 text-[#0B1F3A]">TOTAL</td>
                    <td className="px-4 py-3 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(salesSubtotal)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(salesVat)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(salesTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE JOURNAL */}
      {book === 'purchases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B1F3A]">Purchase Journal</h2>
            <p className="text-sm text-[#6B84A0]">{(bills ?? []).length} bills</p>
          </div>
          <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F4F7FB] border-b border-[#D8E2EE]">
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Bill #</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Vendor</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Amount (ex-VAT)</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Input VAT</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(bills ?? []).map(bill => {
                    const vendor = bill.vendors as unknown as { name: string; tin?: string } | null
                    const category = bill.expense_categories as unknown as { name: string } | null
                    return (
                      <tr key={bill.id} className="border-b border-[#EEF2F8] hover:bg-[#F4F7FB]">
                        <td className="px-4 py-2.5 text-[#3D5166]">{bill.expense_date}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-[#3D5166]">{bill.bill_number ?? '—'}</td>
                        <td className="px-4 py-2.5 font-medium text-[#0B1F3A]">{vendor?.name ?? '—'}</td>
                        <td className="px-4 py-2.5 text-[#6B84A0]">{category?.name ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(bill.amount)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(bill.vat_amount ?? 0)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#0B1F3A]">{centavosToDisplay(bill.total_amount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F4F7FB] border-t-2 border-[#D8E2EE] font-bold">
                    <td colSpan={4} className="px-4 py-3 text-[#0B1F3A]">TOTAL</td>
                    <td className="px-4 py-3 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(purchasesSubtotal)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(purchasesVat)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(purchasesTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GENERAL JOURNAL */}
      {book === 'general' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#0B1F3A]">General Journal</h2>

          {/* Payroll entries */}
          {(payrollRuns ?? []).length > 0 && (
            <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#D8E2EE] bg-[#F4F7FB]">
                <p className="text-sm font-bold text-[#0B1F3A]">Payroll Entries</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#D8E2EE]">
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Account</th>
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Description</th>
                      <th className="text-right px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Debit</th>
                      <th className="text-right px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payrollRuns ?? []).map(run => {
                      const employerContribs = (run.total_sss_er ?? 0) + (run.total_ph_er ?? 0) + (run.total_pi_er ?? 0)
                      const employeeDeductions = (run.total_sss_ee ?? 0) + (run.total_ph_ee ?? 0) + (run.total_pi_ee ?? 0) + (run.total_wtax ?? 0)
                      return [
                        <tr key={`${run.id}-sal`} className="border-b border-[#EEF2F8]">
                          <td className="px-4 py-2 font-medium text-[#0B1F3A]">Salaries Expense</td>
                          <td className="px-4 py-2 text-[#6B84A0]">Gross pay — {run.period_label}</td>
                          <td className="px-4 py-2 text-right font-mono">{centavosToDisplay(run.total_gross)}</td>
                          <td className="px-4 py-2 text-right font-mono">—</td>
                        </tr>,
                        employerContribs > 0 && (
                          <tr key={`${run.id}-er`} className="border-b border-[#EEF2F8]">
                            <td className="px-4 py-2 font-medium text-[#0B1F3A]">Benefits Expense (Employer)</td>
                            <td className="px-4 py-2 text-[#6B84A0]">SSS/PhilHealth/Pag-IBIG ER share</td>
                            <td className="px-4 py-2 text-right font-mono">{centavosToDisplay(employerContribs)}</td>
                            <td className="px-4 py-2 text-right font-mono">—</td>
                          </tr>
                        ),
                        <tr key={`${run.id}-cash`} className="border-b border-[#EEF2F8]">
                          <td className="px-4 py-2 font-medium text-[#0B1F3A]">Cash</td>
                          <td className="px-4 py-2 text-[#6B84A0]">Net pay disbursed — {run.period_label}</td>
                          <td className="px-4 py-2 text-right font-mono">—</td>
                          <td className="px-4 py-2 text-right font-mono">{centavosToDisplay(run.total_net)}</td>
                        </tr>,
                        (employeeDeductions + employerContribs) > 0 && (
                          <tr key={`${run.id}-liab`} className="border-b border-[#EEF2F8]">
                            <td className="px-4 py-2 font-medium text-[#0B1F3A]">Gov't Contributions & Tax Payable</td>
                            <td className="px-4 py-2 text-[#6B84A0]">EE+ER deductions withheld</td>
                            <td className="px-4 py-2 text-right font-mono">—</td>
                            <td className="px-4 py-2 text-right font-mono">{centavosToDisplay(employeeDeductions + employerContribs)}</td>
                          </tr>
                        ),
                      ].filter(Boolean)
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Receipt entries */}
          {(invoicePayments ?? []).length > 0 && (
            <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#D8E2EE] bg-[#F4F7FB]">
                <p className="text-sm font-bold text-[#0B1F3A]">Cash Receipts</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#D8E2EE]">
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Date</th>
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Account</th>
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Description</th>
                      <th className="text-right px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Debit</th>
                      <th className="text-right px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoicePayments ?? []).map(pmt => {
                      const inv = pmt.invoices as unknown as { invoice_number: string; clients: { name: string } | null } | null
                      return [
                        <tr key={`${pmt.id}-dr`} className="border-b border-[#EEF2F8]">
                          <td className="px-4 py-2 text-[#3D5166]">{pmt.payment_date}</td>
                          <td className="px-4 py-2 font-medium text-[#0B1F3A]">Cash</td>
                          <td className="px-4 py-2 text-[#6B84A0]">Receipt from {inv?.clients?.name ?? 'Client'} — {inv?.invoice_number}</td>
                          <td className="px-4 py-2 text-right font-mono">{centavosToDisplay(pmt.amount)}</td>
                          <td className="px-4 py-2 text-right font-mono">—</td>
                        </tr>,
                        <tr key={`${pmt.id}-cr`} className="border-b border-[#EEF2F8]">
                          <td className="px-4 py-2 text-[#3D5166]"></td>
                          <td className="px-4 py-2 pl-8 text-[#3D5166]">Accounts Receivable</td>
                          <td className="px-4 py-2 text-[#6B84A0]">Payment on {inv?.invoice_number}</td>
                          <td className="px-4 py-2 text-right font-mono">—</td>
                          <td className="px-4 py-2 text-right font-mono">{centavosToDisplay(pmt.amount)}</td>
                        </tr>,
                      ]
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment entries */}
          {(expensePayments ?? []).length > 0 && (
            <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#D8E2EE] bg-[#F4F7FB]">
                <p className="text-sm font-bold text-[#0B1F3A]">Cash Disbursements</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#D8E2EE]">
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Date</th>
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Account</th>
                      <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Description</th>
                      <th className="text-right px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Debit</th>
                      <th className="text-right px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(expensePayments ?? []).map(pmt => {
                      const bill = pmt.expenses as unknown as { bill_number: string | null; vendors: { name: string } | null } | null
                      return [
                        <tr key={`${pmt.id}-dr`} className="border-b border-[#EEF2F8]">
                          <td className="px-4 py-2 text-[#3D5166]">{pmt.payment_date}</td>
                          <td className="px-4 py-2 font-medium text-[#0B1F3A]">Accounts Payable</td>
                          <td className="px-4 py-2 text-[#6B84A0]">Payment to {bill?.vendors?.name ?? 'Vendor'}</td>
                          <td className="px-4 py-2 text-right font-mono">{centavosToDisplay(pmt.amount)}</td>
                          <td className="px-4 py-2 text-right font-mono">—</td>
                        </tr>,
                        <tr key={`${pmt.id}-cr`} className="border-b border-[#EEF2F8]">
                          <td className="px-4 py-2 text-[#3D5166]"></td>
                          <td className="px-4 py-2 pl-8 text-[#3D5166]">Cash</td>
                          <td className="px-4 py-2 text-[#6B84A0]">Bill {bill?.bill_number ?? ''} paid</td>
                          <td className="px-4 py-2 text-right font-mono">—</td>
                          <td className="px-4 py-2 text-right font-mono">{centavosToDisplay(pmt.amount)}</td>
                        </tr>,
                      ]
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(payrollRuns ?? []).length === 0 && (invoicePayments ?? []).length === 0 && (expensePayments ?? []).length === 0 && (
            <div className="bg-white border border-[#D8E2EE] rounded-xl p-12 text-center">
              <p className="text-[#6B84A0]">No general journal entries for {MONTHS[month - 1]} {year}.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

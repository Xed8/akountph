import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { ChevronLeft } from 'lucide-react'

interface SearchParams { year?: string; quarter?: string }

function getQuarterRange(year: number, quarter: number) {
  const ranges = [
    { start: `${year}-01-01`, end: `${year}-03-31`, label: `Q1 ${year}` },
    { start: `${year}-04-01`, end: `${year}-06-30`, label: `Q2 ${year}` },
    { start: `${year}-07-01`, end: `${year}-09-30`, label: `Q3 ${year}` },
    { start: `${year}-10-01`, end: `${year}-12-31`, label: `Q4 ${year}` },
  ]
  return ranges[quarter - 1]
}

export default async function EWTReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const now = new Date()
  const year    = parseInt(sp.year    ?? String(now.getFullYear()))
  const quarter = parseInt(sp.quarter ?? String(Math.ceil((now.getMonth() + 1) / 3)))

  const { supabase, orgId } = await requireOrg()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, tin, address')
    .eq('id', orgId)
    .single()

  const range = getQuarterRange(year, quarter)

  // Invoices with EWT (client withholds from us — they issue 2307 to us)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_number, invoice_date, total_amount, ewt_rate, ewt_amount, atc_code, clients(name, tin)')
    .eq('organization_id', orgId)
    .gte('invoice_date', range.start)
    .lte('invoice_date', range.end)
    .gt('ewt_amount', 0)
    .neq('status', 'void')
    .order('invoice_date')

  // Expenses with EWT (we withhold from vendor — we issue 2307 to them)
  const { data: expenses } = await supabase
    .from('expenses')
    .select('bill_number, expense_date, amount, ewt_rate, ewt_amount, atc_code, vendors(name, tin)')
    .eq('organization_id', orgId)
    .gte('expense_date', range.start)
    .lte('expense_date', range.end)
    .gt('ewt_amount', 0)
    .neq('status', 'cancelled')
    .order('expense_date')

  const allInvoices = invoices ?? []
  const allExpenses = expenses ?? []

  const totalEwtReceivable = allInvoices.reduce((s, i) => s + (i.ewt_amount ?? 0), 0)
  const totalEwtPayable    = allExpenses.reduce((s, e) => s + (e.ewt_amount ?? 0), 0)

  const currentYear = now.getFullYear()
  const years = [currentYear - 1, currentYear]

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" /> Reports
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EWT Summary — BIR Form 2307</h1>
          <p className="text-gray-500 mt-1">Creditable Withholding Tax — {range.label}</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <select name="year" defaultValue={year} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select name="quarter" defaultValue={quarter} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
          </select>
          <button type="submit" className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700">View</button>
        </form>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-xl bg-white px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">EWT Receivable (clients withheld from us)</p>
          <p className="text-xl font-bold font-mono text-green-700">{centavosToDisplay(totalEwtReceivable)}</p>
          <p className="text-xs text-gray-400 mt-1">Use as tax credit on quarterly ITR</p>
        </div>
        <div className="border rounded-xl bg-white px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">EWT Payable (we withheld from vendors)</p>
          <p className="text-xl font-bold font-mono text-red-700">{centavosToDisplay(totalEwtPayable)}</p>
          <p className="text-xs text-gray-400 mt-1">Remit via BIR Form 1601-EQ</p>
        </div>
      </div>

      {/* EWT Receivable — from clients */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="px-5 py-3 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700 text-sm">EWT Certificates to Receive from Clients</h2>
          <span className="text-xs text-gray-400">BIR Form 2307 — issued by client to you</span>
        </div>
        {!allInvoices.length ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">No invoices with EWT this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b text-xs bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Invoice #</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Client</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Client TIN</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">ATC</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Income</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">EWT Rate</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">EWT Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allInvoices.map(inv => {
                const client = (inv.clients as unknown) as { name: string; tin: string | null } | null
                return (
                  <tr key={inv.invoice_number} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{inv.invoice_number}</td>
                    <td className="px-4 py-2.5">{client?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{client?.tin ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-amber-700">{(inv as { atc_code?: string | null }).atc_code ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{inv.invoice_date}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{centavosToDisplay(inv.total_amount)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{inv.ewt_rate}%</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{centavosToDisplay(inv.ewt_amount ?? 0)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t-2 bg-gray-50">
              <tr>
                <td colSpan={7} className="px-4 py-2.5 font-semibold text-right text-gray-700">Total EWT Receivable</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-green-700">{centavosToDisplay(totalEwtReceivable)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* EWT Payable — to vendors */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="px-5 py-3 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700 text-sm">EWT Certificates to Issue to Vendors</h2>
          <span className="text-xs text-gray-400">BIR Form 2307 — you issue to vendor</span>
        </div>
        {!allExpenses.length ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">No bills with EWT this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b text-xs bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Bill #</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Vendor</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Vendor TIN</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">ATC</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Gross</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">EWT Rate</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">EWT Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allExpenses.map((exp, i) => {
                const vendor = (exp.vendors as unknown) as { name: string; tin: string | null } | null
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{exp.bill_number ?? '—'}</td>
                    <td className="px-4 py-2.5">{vendor?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{vendor?.tin ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-amber-700">{(exp as { atc_code?: string | null }).atc_code ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500">{exp.expense_date}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{centavosToDisplay(exp.amount)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{exp.ewt_rate}%</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-700">{centavosToDisplay(exp.ewt_amount ?? 0)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t-2 bg-gray-50">
              <tr>
                <td colSpan={7} className="px-4 py-2.5 font-semibold text-right text-gray-700">Total EWT to Remit (1601-EQ)</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-red-700">{centavosToDisplay(totalEwtPayable)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        EWT receivable certificates (2307) should be collected from clients and attached to your quarterly ITR.
        EWT withheld from vendors must be remitted to BIR via Form 1601-EQ within 10 days after end of the quarter.
      </p>
    </div>
  )
}

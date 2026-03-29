import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { ChevronLeft } from 'lucide-react'

interface SearchParams {
  year?: string
  quarter?: string
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// BIR Graduated Tax Table (TRAIN Law, 2023 onwards)
// Taxable income in centavos, tax rates
const TAX_BRACKETS = [
  { min: 0,          max: 25000000,   base: 0,       rate: 0.00  },  // 0 – 250,000: exempt
  { min: 25000000,   max: 40000000,   base: 0,       rate: 0.15  },  // 250,001 – 400,000: 15%
  { min: 40000000,   max: 80000000,   base: 2250000, rate: 0.20  },  // 400,001 – 800,000: 22,500 + 20%
  { min: 80000000,   max: 200000000,  base: 10250000,rate: 0.25  },  // 800,001 – 2,000,000: 102,500 + 25%
  { min: 200000000,  max: 800000000,  base: 40250000,rate: 0.30  },  // 2,000,001 – 8,000,000: 402,500 + 30%
  { min: 800000000,  max: Infinity,   base: 220250000,rate: 0.35 },  // Over 8,000,000: 2,202,500 + 35%
]

function computeGraduatedTax(taxableIncomeCentavos: number): number {
  if (taxableIncomeCentavos <= 0) return 0
  const bracket = TAX_BRACKETS.findLast(b => taxableIncomeCentavos > b.min)
  if (!bracket) return 0
  return bracket.base + Math.round((taxableIncomeCentavos - bracket.min) * bracket.rate)
}

// Quarter → months mapping
const QUARTER_MONTHS: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [1, 2, 3, 4, 5, 6],       // cumulative Q2 = Q1+Q2
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9],  // cumulative Q3
  4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  // annual
}

const QUARTER_LABELS: Record<number, string> = {
  1: '1st Quarter (Jan–Mar)',
  2: '2nd Quarter Cumulative (Jan–Jun)',
  3: '3rd Quarter Cumulative (Jan–Sep)',
  4: 'Annual (Jan–Dec)',
}

export default async function IncomeTaxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const now = new Date()
  const year    = parseInt(sp.year    ?? String(now.getFullYear()))
  const quarter = parseInt(sp.quarter ?? String(Math.ceil((now.getMonth() + 1) / 3)))

  const pad = (n: number) => String(n).padStart(2, '0')
  const months = QUARTER_MONTHS[quarter] ?? QUARTER_MONTHS[1]
  const startMonth = months[0]
  const endMonth   = months[months.length - 1]
  const lastDay    = new Date(year, endMonth, 0).getDate()
  const start = `${year}-${pad(startMonth)}-01`
  const end   = `${year}-${pad(endMonth)}-${lastDay}`

  const { supabase, orgId } = await requireOrg()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, tin, address, taxpayer_type')
    .eq('id', orgId)
    .single()

  const [invoicesRes, expensesRes, payrollRes, ewtRes] = await Promise.all([
    // Revenue: all non-void invoices in period
    supabase
      .from('invoices')
      .select('subtotal, vat_amount, ewt_amount')
      .eq('organization_id', orgId)
      .gte('invoice_date', start)
      .lte('invoice_date', end)
      .neq('status', 'void'),

    // Expenses: allowable deductions (non-cancelled)
    supabase
      .from('expenses')
      .select('amount, vat_amount, category_id, expense_categories(name)')
      .eq('organization_id', orgId)
      .gte('expense_date', start)
      .lte('expense_date', end)
      .neq('status', 'cancelled'),

    // Payroll: gross salaries as deduction
    supabase
      .from('payroll_runs')
      .select('total_gross, total_sss_er, total_ph_er, total_pi_er')
      .eq('organization_id', orgId)
      .in('period_month', months)
      .eq('period_year', year)
      .in('status', ['finalized', 'paid']),

    // EWT credits: EWT withheld by clients (creditable against tax due)
    supabase
      .from('invoices')
      .select('ewt_amount')
      .eq('organization_id', orgId)
      .gte('invoice_date', start)
      .lte('invoice_date', end)
      .not('ewt_amount', 'is', null)
      .neq('status', 'void'),
  ])

  const allInvoices = invoicesRes.data ?? []
  const allExpenses = expensesRes.data ?? []
  const allPayroll  = payrollRes.data  ?? []
  const ewtData     = ewtRes.data      ?? []

  // ── INCOME ──────────────────────────────────────────────
  const grossSales   = allInvoices.reduce((s, i) => s + i.subtotal, 0)
  const salesReturns = 0  // no returns tracking yet
  const netSales     = grossSales - salesReturns

  // ── ALLOWABLE DEDUCTIONS (Itemized) ─────────────────────
  type ExpRow = { amount: number; vat_amount: number | null; category_id: string | null; expense_categories: { name: string } | null }
  const expRows = allExpenses as unknown as ExpRow[]

  const categoryMap = new Map<string, { name: string; total: number }>()
  for (const exp of expRows) {
    const catName = exp.expense_categories?.name ?? 'Other Expenses'
    const catKey  = exp.category_id ?? 'other'
    const existing = categoryMap.get(catKey)
    if (existing) {
      existing.total += exp.amount
    } else {
      categoryMap.set(catKey, { name: catName, total: exp.amount })
    }
  }

  const payrollGross = allPayroll.reduce((s, r) => s + r.total_gross, 0)
  const payrollEr    = allPayroll.reduce((s, r) =>
    s + (r.total_sss_er ?? 0) + (r.total_ph_er ?? 0) + (r.total_pi_er ?? 0), 0)
  const totalPayrollDeduction = payrollGross + payrollEr

  const totalExpenseDeductions = [...categoryMap.values()].reduce((s, c) => s + c.total, 0)
  const totalAllowableDeductions = totalExpenseDeductions + totalPayrollDeduction

  // ── TAXABLE INCOME ──────────────────────────────────────
  const taxableIncome = Math.max(0, netSales - totalAllowableDeductions)

  // ── TAX DUE ─────────────────────────────────────────────
  // Annualize for quarterly: 1701Q uses cumulative year-to-date approach
  const taxDueOnIncome = computeGraduatedTax(taxableIncome)

  // EWT credits (taxes withheld at source by clients)
  const ewtCredits = ewtData.reduce((s, i) => s + (i.ewt_amount ?? 0), 0)

  // Tax still due (net of EWT credits)
  const taxStillDue = Math.max(0, taxDueOnIncome - ewtCredits)

  const years   = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)
  const quarters = [1, 2, 3, 4]

  // Which BIR form applies
  const formNumber = quarter === 4 ? '1701' : '1701Q'
  const formName   = quarter === 4
    ? 'Annual Income Tax Return (Individual)'
    : 'Quarterly Income Tax Return (Individual)'

  const Row = ({ label, amount, indent = false, bold = false, border = false, negative = false, green = false }: {
    label: string; amount: number; indent?: boolean; bold?: boolean; border?: boolean; negative?: boolean; green?: boolean
  }) => (
    <div className={`flex justify-between py-1.5 text-sm ${border ? 'border-t border-[#D8E2EE] mt-1 pt-2' : ''}`}>
      <span className={`${indent ? 'pl-6' : ''} ${bold ? 'font-semibold text-[#0B1F3A]' : 'text-[#3D5166]'}`}>{label}</span>
      <span className={`font-mono ${bold ? 'font-semibold' : ''} ${negative ? 'text-red-600' : green ? 'text-[#00C48C]' : 'text-[#0B1F3A]'}`}>
        {negative ? `(${centavosToDisplay(Math.abs(amount))})` : centavosToDisplay(Math.abs(amount))}
      </span>
    </div>
  )

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mt-6 mb-2">
      <p className="text-xs font-bold uppercase tracking-[1px] text-[#00C48C]">{title}</p>
    </div>
  )

  // Tax bracket display helpers
  function getTaxBracketLabel(income: number): string {
    const inc = income / 100 // to pesos
    if (inc <= 250000) return 'Exempt (≤ ₱250,000)'
    if (inc <= 400000) return '15% on excess over ₱250,000'
    if (inc <= 800000) return '₱22,500 + 20% on excess over ₱400,000'
    if (inc <= 2000000) return '₱102,500 + 25% on excess over ₱800,000'
    if (inc <= 8000000) return '₱402,500 + 30% on excess over ₱2,000,000'
    return '₱2,202,500 + 35% on excess over ₱8,000,000'
  }

  return (
    <div className="p-8 space-y-6 pb-24 max-w-3xl">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-sm text-[#6B84A0] hover:text-[#0B1F3A] transition-colors">
        <ChevronLeft className="w-4 h-4" /> Reports
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#0B1F3A]">BIR Form {formNumber}</h1>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            Reference Only
          </span>
        </div>
        <p className="text-[#6B84A0] text-sm mt-1">{formName}</p>
        <p className="text-[#6B84A0] text-sm">
          {org?.name ?? 'Your Organization'}{org?.tin ? ` · TIN: ${org.tin}` : ''}
        </p>
        <p className="text-[#6B84A0] text-sm">{QUARTER_LABELS[quarter]} {year}</p>
      </div>

      {/* Period selector */}
      <form method="GET" className="flex items-center gap-3 flex-wrap">
        <select name="quarter" defaultValue={quarter}
          className="border border-[#D8E2EE] rounded-lg px-3 py-2 text-sm text-[#1A2B3C] bg-white focus:outline-none focus:border-[#00C48C]">
          {quarters.map(q => (
            <option key={q} value={q}>{q === 4 ? 'Annual (1701)' : `Q${q} (1701Q)`}</option>
          ))}
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
        <strong>Note:</strong> This is a computational aid derived from your records. The figures are based on accrual-basis income and itemized deductions.
        Actual BIR filing must use the official eFPS/eBIRForms platform. Consult your accountant for OSD (Optional Standard Deduction) vs itemized choice.
      </div>

      {/* Income Tax Computation */}
      <div className="bg-white border border-[#D8E2EE] rounded-xl p-6 space-y-1">

        {/* Part I — Gross Income */}
        <p className="text-base font-bold text-[#0B1F3A] border-b border-[#D8E2EE] pb-2">
          Part I — Gross Income
        </p>
        <SectionHeader title="Sales / Revenues" />
        <Row label="Gross Sales / Receipts" amount={grossSales} indent />
        {salesReturns > 0 && <Row label="Less: Sales Returns & Allowances" amount={salesReturns} indent negative />}
        <Row label="Net Sales / Receipts" amount={netSales} bold border />

        {/* Part II — Deductions */}
        <p className="text-base font-bold text-[#0B1F3A] border-b border-[#D8E2EE] pb-2 mt-8">
          Part II — Allowable Deductions (Itemized)
        </p>
        <SectionHeader title="Business Expenses" />
        {[...categoryMap.values()].sort((a, b) => b.total - a.total).map(cat => (
          <Row key={cat.name} label={cat.name} amount={cat.total} indent />
        ))}
        {totalPayrollDeduction > 0 && (
          <Row label="Salaries, Wages & Employee Benefits" amount={totalPayrollDeduction} indent />
        )}
        {totalAllowableDeductions === 0 && (
          <p className="text-xs text-[#6B84A0] pl-6 py-1">No deductions recorded this period.</p>
        )}
        <Row label="Total Allowable Deductions" amount={totalAllowableDeductions} bold border />

        {/* Part III — Taxable Income */}
        <p className="text-base font-bold text-[#0B1F3A] border-b border-[#D8E2EE] pb-2 mt-8">
          Part III — Taxable Income
        </p>
        <Row label="Net Taxable Income" amount={taxableIncome} bold indent />
        <p className="text-xs text-[#6B84A0] pl-6 mt-1">
          Tax bracket: {getTaxBracketLabel(taxableIncome)}
        </p>

        {/* Part IV — Tax Due */}
        <p className="text-base font-bold text-[#0B1F3A] border-b border-[#D8E2EE] pb-2 mt-8">
          Part IV — Tax Computation
        </p>
        <SectionHeader title="Tax Due (TRAIN Graduated Rates)" />
        <Row label="Income Tax Due" amount={taxDueOnIncome} indent />
        {ewtCredits > 0 && (
          <Row label="Less: EWT Credits (Form 2307)" amount={ewtCredits} indent negative />
        )}
        <Row label="Tax Still Due / (Overpayment)" amount={taxStillDue} bold border green={taxStillDue === 0} />

        {taxStillDue === 0 && ewtCredits > 0 && (
          <p className="text-xs text-[#00C48C] mt-1">
            ✓ EWT credits cover full tax due — no additional payment needed this quarter.
          </p>
        )}
      </div>

      {/* TRAIN Law Rate Table */}
      <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-[#F4F7FB] border-b border-[#D8E2EE]">
          <p className="text-sm font-semibold text-[#0B1F3A]">TRAIN Law Graduated Tax Rates (2023 onwards)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#D8E2EE] bg-[#F4F7FB]">
                <th className="text-left px-4 py-2 text-[#6B84A0] font-semibold uppercase tracking-wide">Taxable Income</th>
                <th className="text-right px-4 py-2 text-[#6B84A0] font-semibold uppercase tracking-wide">Base Tax</th>
                <th className="text-right px-4 py-2 text-[#6B84A0] font-semibold uppercase tracking-wide">Rate on Excess</th>
              </tr>
            </thead>
            <tbody>
              {[
                { range: '₱0 – ₱250,000',            base: '₱0',          rate: '0%' },
                { range: '₱250,001 – ₱400,000',       base: '₱0',          rate: '15%' },
                { range: '₱400,001 – ₱800,000',       base: '₱22,500',     rate: '20%' },
                { range: '₱800,001 – ₱2,000,000',     base: '₱102,500',    rate: '25%' },
                { range: '₱2,000,001 – ₱8,000,000',   base: '₱402,500',    rate: '30%' },
                { range: 'Over ₱8,000,000',            base: '₱2,202,500',  rate: '35%' },
              ].map((row, i) => (
                <tr key={i} className={`border-b border-[#EEF2F8] ${i % 2 === 1 ? 'bg-[#F9FAFB]' : ''}`}>
                  <td className="px-4 py-2 text-[#3D5166]">{row.range}</td>
                  <td className="px-4 py-2 text-right font-mono text-[#3D5166]">{row.base}</td>
                  <td className="px-4 py-2 text-right font-mono text-[#0B1F3A] font-semibold">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-[#F4F7FB] border border-[#D8E2EE] rounded-xl p-4 text-xs text-[#6B84A0] space-y-1">
        <p className="font-semibold text-[#0B1F3A] mb-2">How figures are calculated</p>
        <p><strong>Gross Sales:</strong> Sum of all invoice subtotals (ex-VAT) for the period.</p>
        <p><strong>Deductions:</strong> Sum of all expense amounts by category + gross payroll and employer contributions.</p>
        <p><strong>Taxable Income:</strong> Net sales minus total deductions (itemized method).</p>
        <p><strong>Tax Due:</strong> Computed using TRAIN Law graduated rates on cumulative year-to-date income.</p>
        <p><strong>EWT Credits:</strong> Expanded Withholding Tax withheld by clients (from Form 2307) creditable against tax due.</p>
        <p><strong>OSD Option:</strong> Alternatively, you may claim Optional Standard Deduction (OSD) at 40% of gross sales instead of itemized deductions. Consult your accountant.</p>
      </div>
    </div>
  )
}

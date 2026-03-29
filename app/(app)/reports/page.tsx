import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, FolderOpen, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const currentYear = new Date().getFullYear()

const BIR_REPORTS = [
  {
    form: '1601-C',
    name: 'Monthly Remittance of Income Taxes Withheld on Compensation',
    frequency: 'Monthly',
    due: '10th of following month',
    category: 'Payroll',
    action: null,
  },
  {
    form: '2316',
    name: 'Certificate of Compensation Payment / Tax Withheld',
    frequency: 'Annual (per employee)',
    due: 'January 31',
    category: 'Payroll',
    action: null,
  },
  {
    form: '1604-C',
    name: 'Annual Information Return of Income Taxes Withheld on Compensation',
    frequency: 'Annual',
    due: 'January 31',
    category: 'Payroll',
    action: null,
  },
  {
    form: 'Alphalist',
    name: 'Alphabetical List of Employees (Annex to 1604-C)',
    frequency: 'Annual',
    due: 'January 31',
    category: 'Payroll',
    action: { label: `Download ${currentYear} CSV`, href: `/api/reports/alphalist?year=${currentYear}`, download: true },
  },
  {
    form: '2550M',
    name: 'Monthly VAT Declaration',
    frequency: 'Monthly (optional)',
    due: '20th of following month',
    category: 'VAT',
    action: null,
  },
  {
    form: '2550Q',
    name: 'Quarterly VAT Return',
    frequency: 'Quarterly',
    due: '25th day after quarter end',
    category: 'VAT',
    action: { label: 'View VAT Summary', href: '/reports/vat', download: false },
  },
  {
    form: 'P&L',
    name: 'Profit & Loss — Monthly Income Statement',
    frequency: 'Monthly',
    due: 'Anytime',
    category: 'Income Tax',
    action: { label: 'View P&L Report', href: '/reports/pl', download: false },
  },
  {
    form: 'Balance Sheet',
    name: 'Balance Sheet — Assets, Liabilities & Equity',
    frequency: 'Monthly',
    due: 'Anytime',
    category: 'Income Tax',
    action: { label: 'View Balance Sheet', href: '/reports/balance-sheet', download: false },
  },
  {
    form: 'General Ledger',
    name: 'General Ledger — Double-Entry Transaction Log',
    frequency: 'Monthly',
    due: 'Anytime',
    category: 'Income Tax',
    action: { label: 'View General Ledger', href: '/reports/ledger', download: false },
  },
  {
    form: 'CBA',
    name: 'Books of Accounts — General Journal, Sales & Purchase Journal (BIR ORUS)',
    frequency: 'Monthly',
    due: 'Anytime',
    category: 'Income Tax',
    action: { label: 'View Books of Accounts', href: '/reports/books', download: false },
  },
  {
    form: '1701Q / 1701',
    name: 'Quarterly & Annual Income Tax Return (Individual)',
    frequency: 'Quarterly / Annual',
    due: '60th day after quarter / Apr 15',
    category: 'Income Tax',
    action: { label: 'View Income Tax Report', href: '/reports/income-tax', download: false },
  },
  {
    form: 'Expenses',
    name: 'Expense Summary — Monthly Breakdown by Category',
    frequency: 'Monthly',
    due: 'Anytime',
    category: 'Income Tax',
    action: { label: 'View Expense Summary', href: '/reports/expenses', download: false },
  },
  {
    form: '2307',
    name: 'Certificate of Creditable Tax Withheld at Source (EWT)',
    frequency: 'Quarterly',
    due: '20th day after quarter end',
    category: 'EWT',
    action: { label: 'View EWT Summary', href: '/reports/ewt', download: false },
  },
  {
    form: '1601-EQ',
    name: 'Quarterly Remittance Return of Creditable Income Taxes Withheld',
    frequency: 'Quarterly',
    due: 'Last day of month after quarter',
    category: 'EWT',
    action: null,
  },
]

export default async function ReportsPage() {
  await requireOrg()

  const categories = [...new Set(BIR_REPORTS.map(r => r.category))]

  return (
    <div className="p-8 space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports Center</h1>
          <p className="text-gray-500">
            Generate, download, and track your essential BIR filing documents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-md shadow-sm flex items-center gap-2 text-white">
             <Calendar className="w-4 h-4 text-gray-400" />
             <span className="text-sm font-medium whitespace-nowrap">Tax Year {currentYear}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 pt-4">
        {categories.map(cat => (
          <section key={cat}>
            <div className="flex items-center gap-2 mb-6 text-gray-900">
              <FolderOpen className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold">{cat} Reports</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {BIR_REPORTS.filter(r => r.category === cat).map(report => (
                <Card key={report.form} className="flex flex-col gap-4 p-5 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-50 border border-gray-200 shadow-sm shrink-0">
                      <FileText className="h-5 w-5 text-gray-500 group-hover:text-amber-600 transition-colors" />
                    </div>
                    {report.action ? (
                      <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700">Available</span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-600">Coming Soon</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-900 text-sm">Form {report.form}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2" title={report.name}>
                       {report.name}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                     <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium tracking-wide uppercase">Frequency</span>
                        <span className="font-medium text-gray-900">{report.frequency}</span>
                     </div>
                     <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium tracking-wide uppercase">Deadline</span>
                        <span className="font-medium text-amber-700">{report.due}</span>
                     </div>
                  </div>

                  {report.action && (
                    <div className="pt-2">
                      {report.action.download ? (
                        <a
                          href={report.action.href}
                          download
                          className="flex items-center justify-center gap-2 w-full text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 rounded-md px-3 py-2 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {report.action.label}
                        </a>
                      ) : (
                        <Link
                          href={report.action.href}
                          className="flex items-center justify-center gap-2 w-full text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 rounded-md px-3 py-2 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {report.action.label}
                        </Link>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

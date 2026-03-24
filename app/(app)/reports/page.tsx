import { requireOrg } from '@/lib/auth/require-org'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

const BIR_REPORTS = [
  {
    form: '1601-C',
    name: 'Monthly Remittance of Income Taxes Withheld on Compensation',
    frequency: 'Monthly',
    due: '10th of following month',
    category: 'Payroll',
  },
  {
    form: '2316',
    name: 'Certificate of Compensation Payment / Tax Withheld',
    frequency: 'Annual (per employee)',
    due: 'January 31',
    category: 'Payroll',
  },
  {
    form: '1604-C',
    name: 'Annual Information Return of Income Taxes Withheld on Compensation',
    frequency: 'Annual',
    due: 'January 31',
    category: 'Payroll',
  },
  {
    form: 'Alphalist',
    name: 'Alphabetical List of Employees (Annex to 1604-C)',
    frequency: 'Annual',
    due: 'January 31',
    category: 'Payroll',
  },
  {
    form: '2550M',
    name: 'Monthly VAT Declaration',
    frequency: 'Monthly (optional)',
    due: '20th of following month',
    category: 'VAT',
  },
  {
    form: '2550Q',
    name: 'Quarterly VAT Return',
    frequency: 'Quarterly',
    due: '25th day after quarter end',
    category: 'VAT',
  },
  {
    form: '1701Q',
    name: 'Quarterly Income Tax Return (Individual)',
    frequency: 'Quarterly',
    due: '60th day after quarter',
    category: 'Income Tax',
  },
]

export default async function ReportsPage() {
  await requireOrg()

  const categories = [...new Set(BIR_REPORTS.map(r => r.category))]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">BIR Reports</h1>
        <p className="text-gray-500 mt-1">Filing calendar and report status</p>
      </div>

      <div className="space-y-8">
        {categories.map(cat => (
          <section key={cat}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{cat}</h2>
            <div className="grid gap-3">
              {BIR_REPORTS.filter(r => r.category === cat).map(report => (
                <Card key={report.form} className="flex items-start gap-4 p-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 shrink-0">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">BIR Form {report.form}</span>
                      <Badge variant="outline" className="text-xs">{report.frequency}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{report.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Due: {report.due}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">Coming soon</Badge>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

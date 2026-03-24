import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft } from 'lucide-react'
import { PayslipDownloadButton } from '@/components/payslip-pdf'

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ id: string; empId: string }>
}) {
  const { id, empId } = await params
  const { supabase, orgId } = await requireOrg()

  const [{ data: run }, { data: item }, { data: org }] = await Promise.all([
    supabase.from('payroll_runs').select('period_label, pay_date').eq('id', id).eq('organization_id', orgId).single(),
    supabase.from('payroll_items').select('*, employees(*)').eq('payroll_run_id', id).eq('employee_id', empId).single(),
    supabase.from('organizations').select('name, tin, address').eq('id', orgId).single(),
  ])

  if (!run || !item || !org) notFound()

  const emp = item.employees as Record<string, unknown>

  const payslipData = {
    org: { name: org.name, tin: org.tin as string | null, address: org.address as string | null },
    employee: {
      first_name: emp.first_name as string,
      last_name: emp.last_name as string,
      middle_name: emp.middle_name as string | null,
      position: emp.position as string | null,
      tin: emp.tin as string | null,
      sss_number: emp.sss_number as string | null,
      philhealth_number: emp.philhealth_number as string | null,
      pagibig_number: emp.pagibig_number as string | null,
      tax_status: emp.tax_status as string,
    },
    item: {
      basic_salary: item.basic_salary,
      allowances: item.allowances,
      gross_pay: item.gross_pay,
      sss_msc: item.sss_msc,
      sss_ee: item.sss_ee,
      sss_er: item.sss_er,
      sss_ec: item.sss_ec,
      ph_ee: item.ph_ee,
      ph_er: item.ph_er,
      pi_ee: item.pi_ee,
      pi_er: item.pi_er,
      withholding_tax: item.withholding_tax,
      total_deductions: item.total_deductions,
      net_pay: item.net_pay,
      taxable_income: item.taxable_income,
      is_mwe: item.is_mwe,
    },
    run: { period_label: run.period_label, pay_date: run.pay_date },
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href={`/payroll/${id}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />Back to {run.period_label} Payroll
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {emp.last_name as string}, {emp.first_name as string}
          </h1>
          <p className="text-gray-500 mt-0.5">{emp.position as string ?? ''} · {run.period_label}</p>
          {item.is_mwe && <Badge variant="outline" className="mt-1">Minimum Wage Earner</Badge>}
        </div>
        <PayslipDownloadButton data={payslipData} />
      </div>

      {/* Earnings */}
      <div className="bg-white border rounded-lg overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Earnings</h2>
        </div>
        <div className="divide-y">
          <PayslipRow label="Basic Salary" value={item.basic_salary} />
          {item.allowances > 0 && <PayslipRow label="Allowances" value={item.allowances} />}
          <PayslipRow label="Gross Pay" value={item.gross_pay} bold />
        </div>
      </div>

      {/* Deductions */}
      <div className="bg-white border rounded-lg overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Deductions</h2>
        </div>
        <div className="divide-y">
          <PayslipRow
            label="SSS Contribution"
            sublabel={`MSC: ${centavosToDisplay(item.sss_msc)}`}
            value={item.sss_ee}
          />
          <PayslipRow label="PhilHealth Premium" value={item.ph_ee} />
          <PayslipRow label="Pag-IBIG Contribution" value={item.pi_ee} />
          {item.is_mwe ? (
            <div className="px-4 py-3 bg-yellow-50">
              <p className="text-sm text-yellow-700">
                Withholding Tax: <span className="font-medium">Exempt</span> — Minimum Wage Earner (TRAIN Law)
              </p>
            </div>
          ) : (
            <PayslipRow label="Withholding Tax" value={item.withholding_tax} />
          )}
          <PayslipRow label="Total Deductions" value={item.total_deductions} bold />
        </div>
      </div>

      {/* Net Pay */}
      <div className="bg-gray-900 text-white rounded-lg px-4 py-4 flex justify-between items-center mb-6">
        <span className="font-bold text-lg">NET PAY</span>
        <span className="font-bold text-2xl font-mono">{centavosToDisplay(item.net_pay)}</span>
      </div>

      {/* Employer cost (collapsed section) */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Employer Contributions <span className="font-normal text-gray-400">(not deducted from employee)</span>
          </h2>
        </div>
        <div className="divide-y">
          <PayslipRow label="SSS Employer Share + EC" value={item.sss_er + item.sss_ec} />
          <PayslipRow label="PhilHealth Employer Share" value={item.ph_er} />
          <PayslipRow label="Pag-IBIG Employer Share" value={item.pi_er} />
          <PayslipRow
            label="Total Employer Cost"
            value={item.gross_pay + item.sss_er + item.sss_ec + item.ph_er + item.pi_er}
            bold
          />
        </div>
      </div>
    </div>
  )
}

function PayslipRow({
  label,
  sublabel,
  value,
  bold,
}: {
  label: string
  sublabel?: string
  value: number
  bold?: boolean
}) {
  return (
    <div className={`flex justify-between items-center px-4 py-3 ${bold ? 'bg-gray-50' : ''}`}>
      <div>
        <p className={`text-sm ${bold ? 'font-semibold' : 'text-gray-700'}`}>{label}</p>
        {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
      </div>
      <span className={`font-mono text-sm ${bold ? 'font-semibold' : ''}`}>
        {centavosToDisplay(value)}
      </span>
    </div>
  )
}

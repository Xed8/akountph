import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { ChevronLeft, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function EmployeePayslipsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const [{ data: employee }, { data: items }] = await Promise.all([
    supabase
      .from('employees')
      .select('first_name, last_name, position')
      .eq('id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('payroll_items')
      .select('payroll_run_id, gross_pay, net_pay, payroll_runs(period_label, pay_date, status)')
      .eq('employee_id', id)
      .eq('organization_id', orgId)
      .order('payroll_run_id', { ascending: false }),
  ])

  if (!employee) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href={`/employees/${id}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />Back to {employee.first_name} {employee.last_name}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {employee.last_name}, {employee.first_name}
      </h1>
      <p className="text-gray-500 mb-6">{employee.position ?? 'Employee'} · Payslip History</p>

      {!items?.length ? (
        <div className="border rounded-lg bg-white px-4 py-10 text-center text-gray-400">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No payslips yet. Run payroll to generate payslips.</p>
          <Link href="/payroll/new" className="text-xs text-blue-600 hover:underline mt-2 block">
            Run payroll →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const run = (item.payroll_runs as unknown) as { period_label: string; pay_date: string | null; status: string }
            return (
              <div
                key={item.payroll_run_id}
                className="border rounded-lg bg-white px-4 py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-medium">{run.period_label}</p>
                  {run.pay_date && (
                    <p className="text-xs text-gray-400 mt-0.5">Pay date: {run.pay_date}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Net Pay</p>
                    <p className="font-mono text-sm font-semibold">{centavosToDisplay(item.net_pay)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Gross</p>
                    <p className="font-mono text-sm text-gray-600">{centavosToDisplay(item.gross_pay)}</p>
                  </div>
                  <Badge variant={run.status === 'finalized' ? 'default' : 'secondary'} className="text-xs">
                    {run.status}
                  </Badge>
                  <Link
                    href={`/payroll/${item.payroll_run_id}/payslip/${id}`}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    View →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

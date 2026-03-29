import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { finalizePayrollRun } from '@/app/actions/payroll'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { SubmitOnceButton } from '@/components/submit-once-button'

export default async function PayrollRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const { data: run } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (!run) notFound()

  const { data: items } = await supabase
    .from('payroll_items')
    .select('*, employees(first_name, last_name, position)')
    .eq('payroll_run_id', id)
    .order('employees(last_name)')

  return (
    <div className="p-8">
      <Link href="/payroll" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Payroll
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{run.period_label} Payroll</h1>
          <Badge variant={run.status === 'finalized' ? 'default' : 'outline'} className="mt-1">
            {run.status}
          </Badge>
        </div>
        {run.status === 'draft' && (
          <form action={finalizePayrollRun.bind(null, id)}>
            <SubmitOnceButton className="inline-flex items-center justify-center rounded-md bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Finalize Payroll
            </SubmitOnceButton>
          </form>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Gross Pay', value: run.total_gross },
          { label: 'Total Withholding Tax', value: run.total_wt },
          { label: 'Total Net Pay', value: run.total_net },
          { label: 'SSS (ER)', value: run.total_sss_er },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-gray-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold font-mono">{centavosToDisplay(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payslip table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
              <TableHead className="text-right">SSS (EE)</TableHead>
              <TableHead className="text-right">PhilHealth (EE)</TableHead>
              <TableHead className="text-right">Pag-IBIG (EE)</TableHead>
              <TableHead className="text-right">Withholding Tax</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map(item => {
              const emp = item.employees as { first_name: string; last_name: string; position: string | null } | null
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{emp?.last_name}, {emp?.first_name}</p>
                    {emp?.position && <p className="text-xs text-gray-400">{emp.position}</p>}
                    {item.is_mwe && <Badge variant="outline" className="text-xs mt-0.5">MWE</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-mono">{centavosToDisplay(item.gross_pay)}</TableCell>
                  <TableCell className="text-right font-mono">{centavosToDisplay(item.sss_ee)}</TableCell>
                  <TableCell className="text-right font-mono">{centavosToDisplay(item.ph_ee)}</TableCell>
                  <TableCell className="text-right font-mono">{centavosToDisplay(item.pi_ee)}</TableCell>
                  <TableCell className="text-right font-mono">{centavosToDisplay(item.withholding_tax)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{centavosToDisplay(item.net_pay)}</TableCell>
                  <TableCell>
                    <Link href={`/payroll/${id}/payslip/${item.employee_id}`} className="text-sm text-blue-600 hover:underline">
                      Payslip
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

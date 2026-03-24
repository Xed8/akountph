import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  finalized: 'default',
  paid: 'secondary',
}

export default async function PayrollPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: runs } = await supabase
    .from('payroll_runs')
    .select('id, period_label, period_month, period_year, status, total_gross, total_net, total_wt, pay_date, created_at')
    .eq('organization_id', orgId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-500 mt-1">{runs?.length ?? 0} payroll runs</p>
        </div>
        <Link href="/payroll/new">
          <Button><Plus className="h-4 w-4 mr-2" />Run Payroll</Button>
        </Link>
      </div>

      {!runs?.length ? (
        <div className="border border-dashed rounded-lg flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium text-gray-700">No payroll runs yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Run payroll to compute payslips for all active employees.</p>
          <Link href="/payroll/new"><Button>Run Payroll</Button></Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Withholding Tax</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{run.period_label}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[run.status] ?? 'outline'}>{run.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{centavosToDisplay(run.total_gross)}</TableCell>
                  <TableCell className="text-right font-mono">{centavosToDisplay(run.total_wt)}</TableCell>
                  <TableCell className="text-right font-mono">{centavosToDisplay(run.total_net)}</TableCell>
                  <TableCell>
                    <Link href={`/payroll/${run.id}`} className="text-sm text-blue-600 hover:underline">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

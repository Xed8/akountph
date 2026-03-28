import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Calculator, ArrowRight, Search, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600 border-none text-[11px] px-2 py-0.5 rounded font-medium',
  finalized: 'bg-blue-50 text-blue-700 border-none text-[11px] px-2 py-0.5 rounded font-medium',
  paid: 'bg-emerald-50 text-emerald-700 border-none text-[11px] px-2 py-0.5 rounded font-medium',
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
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Payroll History</h1>
          <p className="text-sm text-zinc-500">
            Manage your payroll runs, view historical data, and generate payslips.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/payroll/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2 gap-2">
            <Plus className="h-4 w-4" /> Run Payroll
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
         <div className="px-3 py-1.5 bg-white border border-zinc-200 rounded-md shadow-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <input type="text" placeholder="Search period..." className="bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400 w-64" disabled />
         </div>
         <div className="px-3 py-1.5 bg-zinc-50 text-zinc-600 rounded-md text-sm font-medium border border-zinc-200">
            {runs?.length ?? 0} {runs?.length === 1 ? 'Run' : 'Runs'}
         </div>
      </div>

      {!runs?.length ? (
        <div className="border border-zinc-200 rounded-lg bg-zinc-50 border-dashed p-12 text-center h-[300px] flex flex-col items-center justify-center">
          <Calculator className="h-8 w-8 text-zinc-400 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">No payroll runs yet</h3>
          <p className="text-xs text-zinc-500 mb-6 max-w-sm mx-auto">Run your first payroll to compute payslips and generate accurate tax form data.</p>
          <Link href="/payroll/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2">
            Start First Run
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-zinc-50 border-b border-zinc-200">
              <TableRow className="hover:bg-zinc-50 border-none">
                <TableHead className="font-medium text-zinc-500 text-xs h-10">Payroll Period</TableHead>
                <TableHead className="font-medium text-zinc-500 text-xs">Status</TableHead>
                <TableHead className="text-right font-medium text-zinc-500 text-xs">Gross Pay</TableHead>
                <TableHead className="text-right font-medium text-zinc-500 text-xs">Withholding Tax</TableHead>
                <TableHead className="text-right font-medium text-zinc-500 text-xs">Net Pay</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {runs.map(run => (
                <TableRow key={run.id} className="hover:bg-zinc-50 transition-colors border-none">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
                          <FileText className="w-4 h-4" />
                       </div>
                       <div>
                         <p className="font-medium text-zinc-900 text-sm">
                           {run.period_label}
                         </p>
                         <p className="text-xs text-zinc-500">ID: {run.id.split('-')[0].toUpperCase()}</p>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("capitalize", STATUS_STYLE[run.status] || STATUS_STYLE.draft)}>
                      {run.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                     <p className="font-medium text-zinc-900 text-sm">{centavosToDisplay(run.total_gross)}</p>
                  </TableCell>
                  <TableCell className="text-right">
                     <p className="font-medium text-red-600 text-sm">{centavosToDisplay(run.total_wt)}</p>
                  </TableCell>
                  <TableCell className="text-right">
                     <p className="font-medium text-blue-600 text-sm">{centavosToDisplay(run.total_net)}</p>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Link href={`/payroll/${run.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded text-zinc-400 hover:bg-zinc-100 hover:text-blue-600 transition-colors">
                      <ArrowRight className="h-4 w-4" />
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

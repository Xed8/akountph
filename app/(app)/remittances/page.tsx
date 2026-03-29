import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { formatDate, isOverdue, isDueSoon } from '@/lib/formatting/dates'
import { markRemittancePaid } from '@/app/actions/remittances'
import { Button } from '@/components/ui/button'
import { SubmitOnceButton } from '@/components/submit-once-button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { FileText, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

const AGENCY_COLORS: Record<string, string> = {
  SSS: 'bg-gray-100 text-gray-900 border-gray-200',
  PhilHealth: 'bg-gray-100 text-gray-900 border-gray-200',
  PagIBIG: 'bg-gray-100 text-gray-900 border-gray-200',
  BIR: 'bg-gray-100 text-gray-900 border-gray-200',
}

interface Remittance {
  id: string
  agency: string
  form_number: string
  period_label: string
  due_date: string
  employee_total: number
  employer_total: number
  total_amount: number
  status: string
  paid_date: string | null
  reference_number: string | null
}

export default async function RemittancesPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: remittances } = await supabase
    .from('remittances')
    .select('*')
    .eq('organization_id', orgId)
    .order('due_date', { ascending: true })

  const pending = (remittances ?? []).filter(r => r.status === 'pending') as Remittance[]
  const paid = (remittances ?? []).filter(r => r.status === 'paid') as Remittance[]

  return (
    <div className="p-8 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Remittances & Taxes</h1>
          <p className="text-sm text-gray-500">
            Track and manage your statutory contributions and BIR filings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm flex items-center gap-4">
             <div className="flex items-center gap-2">
               <span className="text-lg font-bold text-amber-600 leading-none">{pending.length}</span>
               <span className="text-[11px] font-medium text-gray-500">Pending</span>
             </div>
             <div className="w-[1px] h-4 bg-gray-200"></div>
             <div className="flex items-center gap-2">
               <span className="text-lg font-bold text-gray-900 leading-none">{paid.length}</span>
               <span className="text-[11px] font-medium text-gray-500">Paid</span>
             </div>
          </div>
        </div>
      </div>

      {!remittances?.length ? (
        <div className="border border-gray-200 rounded-lg bg-gray-50 border-dashed p-12 text-center h-[300px] flex flex-col items-center justify-center">
          <FileText className="h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No remittances yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">Monthly forms are generated automatically when you finalize a payroll.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div>
             <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Pending Action
             </h2>
             <div className="space-y-3">
               {pending.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                     <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                     <p className="text-sm text-gray-500">All caught up! No pending forms.</p>
                  </div>
                ) : (
                  pending.map(r => <RemittanceCard key={r.id} r={r} />)
                )}
             </div>
          </div>

          <div>
             <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> History (Paid)
             </h2>
             <div className="space-y-3">
               {paid.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                     <p className="text-sm text-gray-500">No paid remittances yet.</p>
                  </div>
                ) : (
                  paid.map(r => <RemittanceCard key={r.id} r={r} />)
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RemittanceCard({ r }: { r: Remittance }) {
  const overdue = r.status === 'pending' && isOverdue(r.due_date)
  const soon = r.status === 'pending' && !overdue && isDueSoon(r.due_date)
  const markPaid = markRemittancePaid.bind(null, r.id)

  return (
    <div className={cn(
      'border rounded-lg bg-white p-4 shadow-sm',
      overdue ? 'border-red-300' : soon ? 'border-amber-300' : 'border-gray-200'
    )}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
             {overdue ? (
                <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-600">
                    <AlertCircle className="w-4 h-4" />
                </div>
             ) : r.status === 'paid' ? (
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-600">
                    <CheckCircle2 className="w-4 h-4" />
                </div>
             ) : (
                <div className="w-8 h-8 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                    <FileText className="w-4 h-4" />
                </div>
             )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium border', AGENCY_COLORS[r.agency] || 'bg-gray-50 text-gray-600 border-gray-200')}>
                 {r.agency} {r.form_number && <span className="opacity-80 ml-1">({r.form_number})</span>}
               </span>
               <span className="text-sm font-semibold text-gray-900">{r.period_label}</span>
            </div>

            <p className={cn('text-[11px] font-medium mb-3', overdue ? 'text-red-600' : soon ? 'text-amber-600' : r.status === 'paid' ? 'text-gray-600' : 'text-gray-500')}>
              {r.status === 'paid' ? (
                 <>Paid on {r.paid_date ? formatDate(r.paid_date) : 'unknown date'}</>
              ) : (
                 <>Due {formatDate(r.due_date)}{overdue ? ' (Overdue)' : soon ? ' (Due soon)' : ''}</>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex flex-col">
                 <span className="text-gray-500">Employee Share</span>
                 <span className="font-medium text-gray-900">{centavosToDisplay(r.employee_total)}</span>
              </div>
              {r.employer_total > 0 && (
                <div className="flex flex-col">
                   <span className="text-gray-500">Employer Share</span>
                   <span className="font-medium text-gray-900">{centavosToDisplay(r.employer_total)}</span>
                </div>
              )}
              <div className="flex flex-col pl-4 border-l border-gray-200">
                 <span className="text-gray-500 uppercase tracking-wider text-[10px]">Total Remittance</span>
                 <span className="font-semibold text-sm text-gray-900">{centavosToDisplay(r.total_amount)}</span>
              </div>
            </div>

            {r.status === 'paid' && r.reference_number && (
              <p className="text-[11px] text-gray-500 mt-3 font-mono bg-gray-50 p-1.5 rounded inline-block border border-gray-200">Ref: {r.reference_number}</p>
            )}
          </div>
        </div>

        {r.status === 'pending' && (
          <div className="shrink-0 bg-gray-50 p-3 rounded-md border border-gray-200 w-full sm:w-auto">
            <form action={markPaid} className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold text-gray-500 uppercase">Mark as Paid</label>
              <Input
                name="paid_date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="text-xs h-8 w-full sm:w-44 bg-white"
              />
              <Input
                name="reference_number"
                placeholder="Reference / OR No."
                className="text-xs h-8 w-full sm:w-44 bg-white"
              />
              <SubmitOnceButton className="h-8 w-full rounded-md bg-gray-900 border text-white text-xs font-medium hover:bg-gray-800 transition-colors px-3">
                Submit Payment
              </SubmitOnceButton>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

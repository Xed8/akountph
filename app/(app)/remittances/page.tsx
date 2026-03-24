import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { formatDate, isOverdue, isDueSoon } from '@/lib/formatting/dates'
import { markRemittancePaid } from '@/app/actions/remittances'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const AGENCY_COLORS: Record<string, string> = {
  SSS: 'bg-blue-50 text-blue-700 border-blue-200',
  PhilHealth: 'bg-green-50 text-green-700 border-green-200',
  PagIBIG: 'bg-purple-50 text-purple-700 border-purple-200',
  BIR: 'bg-orange-50 text-orange-700 border-orange-200',
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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Remittances</h1>
        <p className="text-gray-500 mt-1">{pending.length} pending · {paid.length} paid</p>
      </div>

      {!remittances?.length ? (
        <div className="border border-dashed rounded-lg flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium text-gray-700">No remittances yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Remittances are created automatically when you finalize a payroll run.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pending</h2>
              <div className="space-y-3">
                {pending.map(r => <RemittanceCard key={r.id} r={r} />)}
              </div>
            </section>
          )}
          {paid.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Paid</h2>
              <div className="space-y-3">
                {paid.map(r => <RemittanceCard key={r.id} r={r} />)}
              </div>
            </section>
          )}
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
      'border rounded-lg bg-white p-4',
      overdue ? 'border-red-300' : soon ? 'border-amber-300' : 'border-gray-200'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className={cn('px-2 py-0.5 rounded text-xs font-semibold border', AGENCY_COLORS[r.agency] ?? '')}>
            {r.agency}
          </span>
          <div>
            <p className="font-medium text-sm">
              Form {r.form_number} · {r.period_label}
            </p>
            <p className={cn('text-xs mt-0.5', overdue ? 'text-red-600 font-medium' : soon ? 'text-amber-600' : 'text-gray-400')}>
              Due {formatDate(r.due_date)}{overdue ? ' — Overdue' : soon ? ' — Due soon' : ''}
            </p>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>Employee: {centavosToDisplay(r.employee_total)}</span>
              {r.employer_total > 0 && <span>Employer: {centavosToDisplay(r.employer_total)}</span>}
              <span className="font-semibold text-gray-700">Total: {centavosToDisplay(r.total_amount)}</span>
            </div>
            {r.status === 'paid' && r.reference_number && (
              <p className="text-xs text-gray-400 mt-1">Ref: {r.reference_number}</p>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {r.status === 'paid' ? (
            <Badge variant="default">Paid {r.paid_date ? formatDate(r.paid_date) : ''}</Badge>
          ) : (
            <form action={markPaid} className="flex items-end gap-2">
              <div className="space-y-1">
                <Input
                  name="reference_number"
                  placeholder="Reference no. (optional)"
                  className="text-xs h-8 w-44"
                />
                <Input
                  name="paid_date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="text-xs h-8 w-44"
                />
              </div>
              <Button type="submit" size="sm" variant="outline" className="h-8">
                Mark Paid
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

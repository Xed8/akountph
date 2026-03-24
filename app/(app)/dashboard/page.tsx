import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { formatDate, isOverdue, isDueSoon } from '@/lib/formatting/dates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Calculator, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!membership) redirect('/onboarding')
  const orgId = membership.organization_id

  const [employeesRes, latestRunRes, remittancesRes] = await Promise.all([
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .is('deleted_at', null),
    supabase
      .from('payroll_runs')
      .select('total_gross, total_net, period_label, status')
      .eq('organization_id', orgId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('remittances')
      .select('id, agency, form_number, period_label, due_date, total_amount, status')
      .eq('organization_id', orgId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true }),
  ])

  const activeEmployees = employeesRes.count ?? 0
  const latestRun = latestRunRes.data
  const pendingRemittances = remittancesRes.data ?? []

  const overdueCount = pendingRemittances.filter(r => isOverdue(r.due_date)).length
  const dueSoonCount = pendingRemittances.filter(r => !isOverdue(r.due_date) && isDueSoon(r.due_date)).length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Here's what needs your attention.</p>
      </div>

      {/* === REMITTANCE CHECKLIST — primary view === */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">
            What to pay this month
          </h2>
          <Link href="/remittances" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>

        {pendingRemittances.length === 0 ? (
          <div className="border rounded-lg bg-white px-4 py-6 flex items-center gap-3 text-gray-500">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm">All remittances are paid. Nothing due right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingRemittances.map(r => {
              const overdue = isOverdue(r.due_date)
              const soon = !overdue && isDueSoon(r.due_date)
              return (
                <div
                  key={r.id}
                  className={cn(
                    'border rounded-lg bg-white px-4 py-3 flex items-center justify-between gap-4',
                    overdue ? 'border-red-300 bg-red-50' : soon ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {overdue
                      ? <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      : soon
                      ? <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      : <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                    }
                    <div>
                      <p className="text-sm font-medium">
                        {r.agency} Form {r.form_number}
                        <span className="text-gray-400 font-normal ml-1">· {r.period_label}</span>
                      </p>
                      <p className={cn('text-xs mt-0.5', overdue ? 'text-red-600' : soon ? 'text-amber-600' : 'text-gray-400')}>
                        {overdue ? '⚠ Overdue — ' : 'Due '}
                        {formatDate(r.due_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold">{centavosToDisplay(r.total_amount)}</p>
                    <Link href="/remittances" className="text-xs text-blue-600 hover:underline">Mark paid →</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* === KPI CARDS === */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activeEmployees}</p>
              {activeEmployees === 0 && (
                <Link href="/employees/new" className="text-xs text-blue-600 hover:underline mt-1 block">Add first employee →</Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Last Payroll</CardTitle>
              <Calculator className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {latestRun ? (
                <>
                  <p className="text-2xl font-bold">{centavosToDisplay(latestRun.total_gross)}</p>
                  <p className="text-xs text-gray-400 mt-1">{latestRun.period_label} · {latestRun.status}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-400">No runs yet</p>
                  <Link href="/payroll/new" className="text-xs text-blue-600 hover:underline mt-1 block">Run payroll →</Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Net Pay (Last Run)</CardTitle>
              <Calculator className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {latestRun ? centavosToDisplay(latestRun.total_net) : '—'}
              </p>
            </CardContent>
          </Card>

          <Card className={overdueCount > 0 ? 'border-red-300' : dueSoonCount > 0 ? 'border-amber-300' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Remittances</CardTitle>
              {overdueCount > 0
                ? <AlertCircle className="h-4 w-4 text-red-500" />
                : <CheckCircle2 className="h-4 w-4 text-gray-400" />
              }
            </CardHeader>
            <CardContent>
              <p className={cn('text-2xl font-bold', overdueCount > 0 ? 'text-red-600' : dueSoonCount > 0 ? 'text-amber-600' : '')}>
                {pendingRemittances.length}
              </p>
              {overdueCount > 0 && <p className="text-xs text-red-500 mt-1">{overdueCount} overdue</p>}
              {overdueCount === 0 && dueSoonCount > 0 && <p className="text-xs text-amber-500 mt-1">{dueSoonCount} due soon</p>}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Bell, AlertTriangle, Clock } from 'lucide-react'
import { ReminderCard } from './reminder-card'

export default async function RemindersPage() {
  const { supabase, orgId } = await requireOrg()

  const today = new Date().toISOString().split('T')[0]
  const soon  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [{ data: overdueInvoices }, { data: dueSoonInvoices }, { data: org }, { data: recentReminders }] = await Promise.all([
    // Overdue: has due_date in the past, still unpaid/partial
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, due_date, total_amount, paid_amount, clients(id, name, email, phone)')
      .eq('organization_id', orgId)
      .in('status', ['unpaid', 'partial'])
      .lt('due_date', today)
      .not('due_date', 'is', null)
      .neq('status', 'void')
      .order('due_date', { ascending: true }),

    // Due soon: due within 7 days, not yet overdue
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, due_date, total_amount, paid_amount, clients(id, name, email, phone)')
      .eq('organization_id', orgId)
      .in('status', ['unpaid', 'partial'])
      .gte('due_date', today)
      .lte('due_date', soon)
      .neq('status', 'void')
      .order('due_date', { ascending: true }),

    supabase
      .from('organizations')
      .select('name, tin, address')
      .eq('id', orgId)
      .single(),

    // Last reminder per invoice (to show "last sent" date)
    supabase
      .from('payment_reminders')
      .select('invoice_id, sent_at, days_overdue')
      .eq('organization_id', orgId)
      .order('sent_at', { ascending: false }),
  ])

  const overdue  = overdueInvoices ?? []
  const dueSoon  = dueSoonInvoices ?? []
  const reminders = recentReminders ?? []

  // Map: invoice_id → latest reminder
  const lastReminderMap = new Map<string, string>()
  for (const r of reminders) {
    if (!lastReminderMap.has(r.invoice_id)) {
      lastReminderMap.set(r.invoice_id, r.sent_at)
    }
  }

  const totalOverdueAmount = overdue.reduce((s, i) => s + i.total_amount - (i.paid_amount ?? 0), 0)

  function daysOverdue(dueDate: string): number {
    const due = new Date(dueDate)
    const now = new Date()
    return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  }

  function daysUntilDue(dueDate: string): number {
    const due = new Date(dueDate)
    const now = new Date()
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="p-8 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Payment Reminders</h1>
        <p className="text-sm text-[#6B84A0] mt-1">Overdue and upcoming invoice follow-ups</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`border rounded-xl px-5 py-4 ${overdue.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#D8E2EE]'}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-3.5 h-3.5 ${overdue.length > 0 ? 'text-red-500' : 'text-[#6B84A0]'}`} />
            <p className="text-xs uppercase tracking-widest font-semibold text-[#6B84A0]">Overdue</p>
          </div>
          <p className={`text-2xl font-bold ${overdue.length > 0 ? 'text-red-600' : 'text-[#0B1F3A]'}`}>{overdue.length}</p>
          {overdue.length > 0 && (
            <p className="text-xs text-red-500 mt-1 font-mono">{centavosToDisplay(totalOverdueAmount)} outstanding</p>
          )}
        </div>

        <div className={`border rounded-xl px-5 py-4 ${dueSoon.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#D8E2EE]'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className={`w-3.5 h-3.5 ${dueSoon.length > 0 ? 'text-amber-500' : 'text-[#6B84A0]'}`} />
            <p className="text-xs uppercase tracking-widest font-semibold text-[#6B84A0]">Due This Week</p>
          </div>
          <p className={`text-2xl font-bold ${dueSoon.length > 0 ? 'text-amber-700' : 'text-[#0B1F3A]'}`}>{dueSoon.length}</p>
        </div>

        <div className="bg-white border border-[#D8E2EE] rounded-xl px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-3.5 h-3.5 text-[#6B84A0]" />
            <p className="text-xs uppercase tracking-widest font-semibold text-[#6B84A0]">Reminders Sent</p>
          </div>
          <p className="text-2xl font-bold text-[#0B1F3A]">{reminders.length}</p>
          <p className="text-xs text-[#6B84A0] mt-1">All time</p>
        </div>
      </div>

      {/* Overdue invoices */}
      {overdue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[#0B1F3A] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Overdue Invoices
          </h2>
          {overdue.map(inv => {
            const client = inv.clients as unknown as { id: string; name: string; email: string | null; phone: string | null } | null
            const balance = inv.total_amount - (inv.paid_amount ?? 0)
            const days = daysOverdue(inv.due_date!)
            const lastSent = lastReminderMap.get(inv.id)
            return (
              <ReminderCard
                key={inv.id}
                invoiceId={inv.id}
                invoiceNumber={inv.invoice_number}
                clientName={client?.name ?? 'Unknown Client'}
                clientEmail={client?.email ?? null}
                clientPhone={client?.phone ?? null}
                dueDate={inv.due_date!}
                balance={balance}
                daysInfo={`${days} day${days === 1 ? '' : 's'} overdue`}
                urgency="overdue"
                lastReminderSent={lastSent ?? null}
                orgName={org?.name ?? ''}
                daysOverdue={days}
              />
            )
          })}
        </div>
      )}

      {/* Due soon invoices */}
      {dueSoon.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[#0B1F3A] flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Due This Week
          </h2>
          {dueSoon.map(inv => {
            const client = inv.clients as unknown as { id: string; name: string; email: string | null; phone: string | null } | null
            const balance = inv.total_amount - (inv.paid_amount ?? 0)
            const days = daysUntilDue(inv.due_date!)
            const lastSent = lastReminderMap.get(inv.id)
            return (
              <ReminderCard
                key={inv.id}
                invoiceId={inv.id}
                invoiceNumber={inv.invoice_number}
                clientName={client?.name ?? 'Unknown Client'}
                clientEmail={client?.email ?? null}
                clientPhone={client?.phone ?? null}
                dueDate={inv.due_date!}
                balance={balance}
                daysInfo={days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`}
                urgency="upcoming"
                lastReminderSent={lastSent ?? null}
                orgName={org?.name ?? ''}
                daysOverdue={-days}
              />
            )
          })}
        </div>
      )}

      {overdue.length === 0 && dueSoon.length === 0 && (
        <div className="bg-white border border-[#D8E2EE] rounded-xl p-12 text-center">
          <Bell className="w-8 h-8 mx-auto mb-3 text-[#D8E2EE]" />
          <p className="font-medium text-[#0B1F3A] mb-1">All caught up!</p>
          <p className="text-sm text-[#6B84A0]">No overdue or upcoming invoices requiring follow-up.</p>
        </div>
      )}
    </div>
  )
}

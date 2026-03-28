// AR Aging — buckets unpaid invoices by how overdue they are
// 4-bucket standard per PH accounting / Akaunting: Current (0-30), 31-60, 61-90, Over 90

export interface AgingBuckets {
  current: number       // 0–30 days (not yet due or up to 30 days overdue)
  days31to60: number    // 31–60 days overdue
  days61to90: number    // 61–90 days overdue
  over90: number        // 90+ days overdue
  total: number         // sum of all buckets
}

interface UnpaidInvoice {
  due_date: string | null
  total_amount: number
  paid_amount: number
  status: string
}

export function computeAgingBuckets(invoices: UnpaidInvoice[]): AgingBuckets {
  const buckets: AgingBuckets = {
    current: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0,
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const inv of invoices) {
    if (inv.status === 'paid' || inv.status === 'void') continue

    const outstanding = inv.total_amount - inv.paid_amount
    if (outstanding <= 0) continue

    buckets.total += outstanding

    if (!inv.due_date) {
      buckets.current += outstanding
      continue
    }

    const due = new Date(inv.due_date)
    due.setHours(0, 0, 0, 0)
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))

    if (daysOverdue <= 30) {
      buckets.current += outstanding
    } else if (daysOverdue <= 60) {
      buckets.days31to60 += outstanding
    } else if (daysOverdue <= 90) {
      buckets.days61to90 += outstanding
    } else {
      buckets.over90 += outstanding
    }
  }

  return buckets
}

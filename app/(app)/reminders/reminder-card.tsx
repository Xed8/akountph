'use client'

import { useState, useTransition } from 'react'
import { logReminderSent } from '@/app/actions/reminders'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Copy, Check, Bell } from 'lucide-react'

interface Props {
  invoiceId: string
  invoiceNumber: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  dueDate: string
  balance: number
  daysInfo: string
  urgency: 'overdue' | 'upcoming'
  lastReminderSent: string | null
  orgName: string
  daysOverdue: number
}

export function ReminderCard({
  invoiceId, invoiceNumber, clientName, clientEmail, clientPhone,
  dueDate, balance, daysInfo, urgency, lastReminderSent, orgName, daysOverdue,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [logged, setLogged] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  const message = urgency === 'overdue'
    ? `Dear ${clientName},\n\nThis is a friendly reminder that Invoice ${invoiceNumber} from ${orgName} is now overdue.\n\nBalance due: ${centavosToDisplay(balance)}\nOriginal due date: ${dueDate}\n\nKindly process your payment at your earliest convenience. If you have already sent payment, please disregard this message.\n\nThank you,\n${orgName}`
    : `Dear ${clientName},\n\nThis is a reminder that Invoice ${invoiceNumber} from ${orgName} is due on ${dueDate}.\n\nBalance due: ${centavosToDisplay(balance)}\n\nPlease ensure payment is processed on or before the due date.\n\nThank you,\n${orgName}`

  function handleCopy() {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleLogSent() {
    startTransition(async () => {
      await logReminderSent(invoiceId, message, daysOverdue)
      setLogged(true)
    })
  }

  const borderColor = urgency === 'overdue' ? 'border-red-200' : 'border-amber-200'
  const bgColor     = urgency === 'overdue' ? 'bg-red-50'    : 'bg-amber-50'
  const badgeColor  = urgency === 'overdue'
    ? 'bg-red-100 text-red-700'
    : 'bg-amber-100 text-amber-700'

  return (
    <div className={`border rounded-xl overflow-hidden ${borderColor}`}>
      <div className={`px-5 py-4 flex items-start justify-between gap-4 ${bgColor}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[#0B1F3A]">{clientName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{daysInfo}</span>
            {lastReminderSent && (
              <span className="text-xs text-[#6B84A0]">
                Last reminded: {new Date(lastReminderSent).toLocaleDateString('en-PH')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm">
            <span className="font-mono font-semibold text-[#0B1F3A]">{centavosToDisplay(balance)}</span>
            <span className="text-[#6B84A0]">Invoice {invoiceNumber}</span>
            <span className="text-[#6B84A0]">Due {dueDate}</span>
          </div>
          {(clientEmail || clientPhone) && (
            <div className="flex items-center gap-3 mt-1 text-xs text-[#6B84A0]">
              {clientEmail && <span>{clientEmail}</span>}
              {clientPhone && <span>{clientPhone}</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setExpanded(e => !e)}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#D8E2EE] bg-white text-[#3D5166] hover:bg-[#F4F7FB] transition-colors">
            {expanded ? 'Hide' : 'Preview'}
          </button>
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#D8E2EE] bg-white text-[#3D5166] hover:bg-[#F4F7FB] transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleLogSent} disabled={isPending || logged}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              logged
                ? 'bg-[#E6FAF4] text-[#009E72] border border-[#B3EDD9]'
                : 'bg-[#00C48C] text-white hover:bg-[#009E72]'
            }`}>
            <Bell className="w-3.5 h-3.5" />
            {logged ? 'Logged' : isPending ? '…' : 'Mark Sent'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4 bg-white border-t border-[#D8E2EE]">
          <p className="text-xs font-semibold text-[#6B84A0] uppercase tracking-widest mb-2">Reminder Message</p>
          <pre className="text-sm text-[#3D5166] whitespace-pre-wrap font-sans leading-relaxed">{message}</pre>
        </div>
      )}
    </div>
  )
}

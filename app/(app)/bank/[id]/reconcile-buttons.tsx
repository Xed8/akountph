'use client'

import { useTransition } from 'react'
import { reconcileTransaction, unreconcileTransaction, deleteBankTransaction } from '@/app/actions/bank'
import { CheckCheck, RotateCcw, Trash2 } from 'lucide-react'

interface Props {
  txId: string
  bankAccountId: string
  isReconciled: boolean
  amount: number
}

export function ReconcileButtons({ txId, bankAccountId, isReconciled, amount }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleReconcile() {
    startTransition(() => reconcileTransaction(txId, bankAccountId))
  }

  function handleUnreconcile() {
    startTransition(() => unreconcileTransaction(txId, bankAccountId))
  }

  function handleDelete() {
    if (!confirm('Delete this bank transaction entry?')) return
    startTransition(() => deleteBankTransaction(txId, bankAccountId, amount))
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {!isReconciled ? (
        <button onClick={handleReconcile} disabled={isPending} title="Mark as reconciled"
          className="p-1.5 rounded hover:bg-[#E6FAF4] text-[#6B84A0] hover:text-[#00C48C] transition-colors disabled:opacity-40">
          <CheckCheck className="w-4 h-4" />
        </button>
      ) : (
        <button onClick={handleUnreconcile} disabled={isPending} title="Undo reconciliation"
          className="p-1.5 rounded hover:bg-amber-50 text-[#6B84A0] hover:text-amber-600 transition-colors disabled:opacity-40">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
      <button onClick={handleDelete} disabled={isPending} title="Delete entry"
        className="p-1.5 rounded hover:bg-red-50 text-[#6B84A0] hover:text-red-500 transition-colors disabled:opacity-40">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

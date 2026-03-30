'use client'

import { useActionState } from 'react'
import { addStockMovement } from '@/app/actions/inventory'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type State = { error: string } | null

export function StockMovementForm({ itemId }: { itemId: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(addStockMovement, null)

  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {state?.error && (
        <p className="md:col-span-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
      )}
      <input type="hidden" name="item_id" value={itemId} />

      <div className="space-y-1.5">
        <Label htmlFor="movement_date">Date *</Label>
        <Input id="movement_date" name="movement_date" type="date" required
          defaultValue={new Date().toISOString().split('T')[0]} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Movement Type *</Label>
        <select id="type" name="type" required
          className="w-full border border-[#D8E2EE] rounded-lg px-3 py-2 text-sm text-[#1A2B3C] bg-white focus:outline-none focus:border-[#00C48C]">
          <option value="in">Received (Stock In)</option>
          <option value="out">Issued (Stock Out)</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="quantity">Quantity *</Label>
        <Input id="quantity" name="quantity" type="number" step="0.0001" min="0.0001" required placeholder="0" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="unit_cost">Unit Cost (₱) — for Stock In</Label>
        <Input id="unit_cost" name="unit_cost" type="number" step="0.01" min="0" placeholder="0.00" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reference">Reference</Label>
        <Input id="reference" name="reference" placeholder="e.g. PO-001 or INV-123" maxLength={100} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional notes" maxLength={255} />
      </div>

      <div className="md:col-span-3">
        <Button type="submit" disabled={pending} className="bg-[#00C48C] hover:bg-[#009E72] text-white">
          {pending ? 'Saving…' : 'Record Movement'}
        </Button>
      </div>
    </form>
  )
}

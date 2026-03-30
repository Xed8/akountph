'use client'

import { useActionState } from 'react'
import { updateItemInventorySettings } from '@/app/actions/inventory'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type State = { error: string } | null

interface Props {
  item: {
    id: string
    track_stock: boolean
    cost_price: number
    reorder_point: number
  }
}

export function InventorySettingsForm({ item }: Props) {
  const [state, formAction, pending] = useActionState<State, FormData>(updateItemInventorySettings, null)

  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {state?.error && (
        <p className="md:col-span-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
      )}
      <input type="hidden" name="item_id" value={item.id} />

      <div className="space-y-1.5">
        <Label htmlFor="track_stock">Track Stock</Label>
        <select id="track_stock" name="track_stock" defaultValue={String(item.track_stock)}
          className="w-full border border-[#D8E2EE] rounded-lg px-3 py-2 text-sm text-[#1A2B3C] bg-white focus:outline-none focus:border-[#00C48C]">
          <option value="false">Not tracked (service item)</option>
          <option value="true">Track stock quantity</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cost_price">Cost Price (₱)</Label>
        <Input id="cost_price" name="cost_price" type="number" step="0.01" min="0"
          defaultValue={item.cost_price > 0 ? (item.cost_price / 100).toFixed(2) : ''} placeholder="0.00" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reorder_point">Reorder Point (qty)</Label>
        <Input id="reorder_point" name="reorder_point" type="number" step="1" min="0"
          defaultValue={item.reorder_point > 0 ? item.reorder_point : ''} placeholder="e.g. 10" />
      </div>

      <div className="md:col-span-3">
        <Button type="submit" disabled={pending} className="bg-[#00C48C] hover:bg-[#009E72] text-white">
          {pending ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}

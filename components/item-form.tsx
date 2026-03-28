'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface Item {
  name: string
  description: string | null
  unit: string
  sale_price: number
  is_vat_exempt: boolean
  category: string | null
}

type ActionState = { error: string } | null | void

interface ItemFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  item?: Item
  submitLabel?: string
}

const UNITS = ['pc', 'hr', 'kg', 'set', 'lot', 'mo', 'day', 'box', 'L', 'm']

export function ItemForm({ action, item, submitLabel = 'Save' }: ItemFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

  const displayPrice = item ? (item.sale_price / 100).toFixed(2) : ''

  return (
    <form action={formAction}>
      <Card className="max-w-md">
        <CardContent className="space-y-4 pt-4">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name" name="name" required
              minLength={2} maxLength={200}
              defaultValue={item?.name}
              placeholder="e.g. Web Design Service"
              title="Enter a valid item name (at least 2 characters)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={item?.description ?? ''} maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sale_price">Unit Price (₱) *</Label>
              <Input
                id="sale_price" name="sale_price"
                type="number" min="0.01" max="9999999.99" step="0.01"
                required
                defaultValue={displayPrice}
                placeholder="0.00"
                title="Enter a valid price (e.g. 1500.00)"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Select name="unit" defaultValue={item?.unit ?? 'pc'}>
                <SelectTrigger id="unit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" defaultValue={item?.category ?? ''} placeholder="e.g. Service Revenue" maxLength={100} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_vat_exempt"
              name="is_vat_exempt"
              value="true"
              defaultChecked={item?.is_vat_exempt}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_vat_exempt" className="font-normal cursor-pointer">
              VAT-exempt item (no 12% VAT on invoice)
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Saving…' : submitLabel}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

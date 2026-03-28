'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ActionState = { error: string } | null | void

interface CategoryFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

const COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6B7280',
]

export function CategoryForm({ action }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Name *</Label>
          <Input id="cat-name" name="name" required minLength={2} maxLength={100} placeholder="e.g. Office Supplies" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-type">Type</Label>
          <select
            id="cat-type"
            name="type"
            defaultValue="expense"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cat-gl">GL Account Code</Label>
          <Input
            id="cat-gl" name="gl_account_code"
            placeholder="e.g. 5300"
            pattern="[A-Za-z0-9\\-]{1,20}"
            title="Alphanumeric code, up to 20 characters (e.g. 5300, OPEX-01)"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COLORS.map((c, i) => (
              <label key={c} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c}
                  defaultChecked={i === 9}
                  className="sr-only"
                />
                <span
                  className="block w-5 h-5 rounded-full ring-2 ring-offset-1 ring-transparent has-[:checked]:ring-gray-500"
                  style={{ backgroundColor: c }}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Adding…' : 'Add Category'}
      </Button>
    </form>
  )
}

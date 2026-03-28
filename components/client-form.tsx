'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { TinInput, PhoneInput } from '@/components/formatted-inputs'

interface Client {
  name: string
  tin: string | null
  address: string | null
  email: string | null
  phone: string | null
  contact_person: string | null
  is_vat_registered: boolean
  notes: string | null
}

type ActionState = { error: string } | null | void

interface ClientFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  client?: Client
  submitLabel?: string
}

export function ClientForm({ action, client, submitLabel = 'Save' }: ClientFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="space-y-4 pt-4">
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">Business / Client Name *</Label>
            <Input
              id="name" name="name" required
              minLength={2} maxLength={200}
              defaultValue={client?.name}
              placeholder="e.g. Juan's Bakery"
              title="Enter a valid business or client name (at least 2 characters)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tin">TIN</Label>
            <TinInput name="tin" defaultValue={client?.tin} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input
              id="contact_person" name="contact_person"
              defaultValue={client?.contact_person ?? ''}
              placeholder="e.g. Maria Santos"
              pattern="[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .\\-']{1,}"
              title="Enter a valid name (letters, spaces, hyphens, periods — at least 2 characters)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={client?.email ?? ''} placeholder="e.g. juan@example.com" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <PhoneInput name="phone" defaultValue={client?.phone} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={client?.address ?? ''}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_vat_registered"
              name="is_vat_registered"
              value="true"
              defaultChecked={client?.is_vat_registered}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_vat_registered" className="font-normal cursor-pointer">
              Client is VAT-registered
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={client?.notes ?? ''}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Saving…' : submitLabel}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import { updateOrganization } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const INDUSTRIES = [
  { value: 'food', label: 'Food & Beverage' },
  { value: 'retail', label: 'Retail' },
  { value: 'services', label: 'Services' },
  { value: 'construction', label: 'Construction' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'transport', label: 'Transport & Logistics' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
]

export function OrgSettingsForm({ org }: { org: Record<string, unknown> }) {
  const [state, formAction, pending] = useActionState(updateOrganization, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">Settings saved.</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" required defaultValue={org.name as string} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tin">BIR TIN</Label>
          <Input id="tin" name="tin" placeholder="000-000-000-000" defaultValue={(org.tin as string) ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rdo_code">RDO Code</Label>
          <Input id="rdo_code" name="rdo_code" defaultValue={(org.rdo_code as string) ?? ''} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={(org.address as string) ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="industry">Industry</Label>
        <Select name="industry" defaultValue={(org.industry as string) ?? ''}>
          <SelectTrigger id="industry"><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vat_registered">VAT registration</Label>
        <Select name="vat_registered" defaultValue={String(org.vat_registered ?? false)}>
          <SelectTrigger id="vat_registered"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Not VAT-registered</SelectItem>
            <SelectItem value="true">VAT-registered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save Changes'}</Button>
    </form>
  )
}

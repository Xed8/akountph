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

      {/* BIR Official Receipt / E-Invoicing */}
      <div className="pt-4 border-t border-zinc-200">
        <p className="text-sm font-semibold text-zinc-700 mb-3">BIR Official Receipt &amp; E-Invoicing</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="or_number_prefix">OR Number Prefix</Label>
              <Input id="or_number_prefix" name="or_number_prefix" placeholder="e.g. OR-2025-" defaultValue={(org.or_number_prefix as string) ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bir_atp_number">Authority to Print (ATP) No.</Label>
              <Input id="bir_atp_number" name="bir_atp_number" placeholder="e.g. 3AU000123456" defaultValue={(org.bir_atp_number as string) ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="or_series_from">OR Series — From</Label>
              <Input id="or_series_from" name="or_series_from" placeholder="e.g. 0000001" defaultValue={(org.or_series_from as string) ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="or_series_to">OR Series — To</Label>
              <Input id="or_series_to" name="or_series_to" placeholder="e.g. 0100000" defaultValue={(org.or_series_to as string) ?? ''} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bir_accreditation_no">BIR CAS Accreditation No.</Label>
            <Input id="bir_accreditation_no" name="bir_accreditation_no" placeholder="e.g. 08-000123-456-2025" defaultValue={(org.bir_accreditation_no as string) ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bir_cas_accredited">CAS Accreditation Status</Label>
            <Select name="bir_cas_accredited" defaultValue={String(org.bir_cas_accredited ?? false)}>
              <SelectTrigger id="bir_cas_accredited"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Not CAS-accredited</SelectItem>
                <SelectItem value="true">BIR CAS-accredited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save Changes'}</Button>
    </form>
  )
}

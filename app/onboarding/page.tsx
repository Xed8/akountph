'use client'

import { useActionState } from 'react'
import { createOrganization } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

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

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(createOrganization, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AkountPH</h1>
          <p className="text-sm text-gray-500 mt-1">Let&apos;s set up your business</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your business details</CardTitle>
            <CardDescription>
              This information is used on payslips and BIR reports. You can update it later in Settings.
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-4">
              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {state.error}
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name">Business name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Juan's Bakeshop"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tin">BIR TIN</Label>
                  <Input
                    id="tin"
                    name="tin"
                    placeholder="000-000-000-000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rdo_code">RDO Code</Label>
                  <Input
                    id="rdo_code"
                    name="rdo_code"
                    placeholder="e.g. 040"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Business address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Rizal Ave, Quezon City"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Select name="industry">
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(i => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vat_registered">VAT registration</Label>
                <Select name="vat_registered" defaultValue="false">
                  <SelectTrigger id="vat_registered">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Not VAT-registered (gross sales ≤ ₱3M)</SelectItem>
                    <SelectItem value="true">VAT-registered (gross sales &gt; ₱3M)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Setting up…' : 'Continue to Dashboard →'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

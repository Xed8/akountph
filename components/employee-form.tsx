'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { centavosToInputValue } from '@/lib/formatting/currency'
import { TinInput, SssInput, PhilhealthInput, PagibigInput } from '@/components/formatted-inputs'

interface Employee {
  id: string
  first_name: string
  last_name: string
  middle_name: string | null
  position: string | null
  employment_type: string
  tax_status: string
  monthly_basic_salary: number
  allowances: number
  tin: string | null
  sss_number: string | null
  philhealth_number: string | null
  pagibig_number: string | null
  date_hired: string | null
  bank_name: string | null
  bank_account: string | null
}

interface EmployeeFormProps {
  action: (prevState: { error: string } | null | void, formData: FormData) => Promise<{ error: string } | void>
  employee?: Employee
  submitLabel: string
}

// Philippine name: letters, spaces, hyphens, periods, apostrophes — at least 2 chars
const NAME_PATTERN = "[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .\\-']{1,}"
const NAME_TITLE = 'Enter a valid name (letters, spaces, hyphens, periods, apostrophes — at least 2 characters)'

export function EmployeeForm({ action, employee, submitLabel }: EmployeeFormProps) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First name <span className="text-red-500">*</span></Label>
            <Input
              id="first_name" name="first_name" required
              pattern={NAME_PATTERN} title={NAME_TITLE}
              defaultValue={employee?.first_name}
              placeholder="e.g. Juan"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last name <span className="text-red-500">*</span></Label>
            <Input
              id="last_name" name="last_name" required
              pattern={NAME_PATTERN} title={NAME_TITLE}
              defaultValue={employee?.last_name}
              placeholder="e.g. Dela Cruz"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="middle_name">Middle name</Label>
            <Input
              id="middle_name" name="middle_name"
              pattern={NAME_PATTERN} title={NAME_TITLE}
              defaultValue={employee?.middle_name ?? ''}
              placeholder="e.g. Santos (optional)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="position">Position / Job title</Label>
            <Input id="position" name="position" defaultValue={employee?.position ?? ''} placeholder="e.g. Accountant" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employment_type">Employment type</Label>
            <Select name="employment_type" defaultValue={employee?.employment_type ?? 'regular'}>
              <SelectTrigger id="employment_type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="probationary">Probationary</SelectItem>
                <SelectItem value="contractual">Contractual</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date_hired">Date hired</Label>
            <Input id="date_hired" name="date_hired" type="date" defaultValue={employee?.date_hired ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tax_status">Tax status</Label>
            <Select name="tax_status" defaultValue={employee?.tax_status ?? 'S'}>
              <SelectTrigger id="tax_status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="S">S — Single</SelectItem>
                <SelectItem value="M">M — Married</SelectItem>
                <SelectItem value="ME">ME — Married Exempt</SelectItem>
                <SelectItem value="MWE">MWE — Minimum Wage Earner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Compensation</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="monthly_basic_salary">Monthly basic salary (₱) <span className="text-red-500">*</span></Label>
            <Input
              id="monthly_basic_salary"
              name="monthly_basic_salary"
              type="number"
              min="0.01"
              max="9999999.99"
              step="0.01"
              required
              defaultValue={employee ? centavosToInputValue(employee.monthly_basic_salary) : ''}
              placeholder="e.g. 18000.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allowances">Monthly allowances (₱)</Label>
            <Input
              id="allowances"
              name="allowances"
              type="number"
              min="0"
              max="9999999.99"
              step="0.01"
              defaultValue={employee ? centavosToInputValue(employee.allowances) : '0.00'}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Government IDs</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="tin">TIN</Label>
            <TinInput name="tin" defaultValue={employee?.tin} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sss_number">SSS Number</Label>
            <SssInput name="sss_number" defaultValue={employee?.sss_number} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="philhealth_number">PhilHealth Number</Label>
            <PhilhealthInput name="philhealth_number" defaultValue={employee?.philhealth_number} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pagibig_number">Pag-IBIG Number</Label>
            <PagibigInput name="pagibig_number" defaultValue={employee?.pagibig_number} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Bank Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bank_name">Bank name</Label>
            <Input id="bank_name" name="bank_name" placeholder="e.g. BDO, BPI, UnionBank" defaultValue={employee?.bank_name ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank_account">Account number</Label>
            <Input
              id="bank_account" name="bank_account"
              placeholder="e.g. 1234567890"
              pattern="[\\d\\s\\-]{6,20}"
              title="Enter a valid bank account number (6–20 digits)"
              defaultValue={employee?.bank_account ?? ''}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

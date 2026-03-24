'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createPayrollRun } from '@/app/actions/payroll'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export default function NewPayrollPage() {
  const [state, formAction, pending] = useActionState(createPayrollRun, null)

  return (
    <div className="p-8">
      <Link href="/payroll" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Payroll
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Run Payroll</h1>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Select payroll period</CardTitle>
          <CardDescription>
            Payroll will be computed for all active employees using their current salary and tax setup.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {state.error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="period_month">Month</Label>
                <Select name="period_month" defaultValue={String(currentMonth)}>
                  <SelectTrigger id="period_month"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="period_year">Year</Label>
                <Select name="period_year" defaultValue={String(currentYear)}>
                  <SelectTrigger id="period_year"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay_date">Pay date (optional)</Label>
              <Input id="pay_date" name="pay_date" type="date" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Computing payroll…' : 'Compute Payroll →'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// BIR Alphalist CSV — Annex to Form 1604-C
// Format: TIN, Last Name, First Name, Middle Name, Tax Status, Gross Compensation, Non-Taxable, Taxable, Tax Withheld
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!membership) return NextResponse.json({ error: 'No organization' }, { status: 403 })
  const orgId = membership.organization_id

  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  // Get all finalized payroll items for the year, grouped by employee
  const { data: items } = await supabase
    .from('payroll_items')
    .select(`
      employee_id,
      gross_pay,
      taxable_income,
      withholding_tax,
      is_mwe,
      employees(first_name, last_name, middle_name, tin, tax_status),
      payroll_runs(period_year, status)
    `)
    .eq('organization_id', orgId)
    .eq('payroll_runs.period_year', year)
    .eq('payroll_runs.status', 'finalized')

  if (!items?.length) {
    return NextResponse.json({ error: `No finalized payroll runs found for ${year}` }, { status: 404 })
  }

  // Aggregate per employee
  const byEmployee = new Map<string, {
    tin: string | null
    lastName: string
    firstName: string
    middleName: string | null
    taxStatus: string
    grossComp: number
    taxableComp: number
    taxWithheld: number
    isMWE: boolean
  }>()

  for (const item of items) {
    const run = (item.payroll_runs as unknown) as { period_year: number; status: string } | null
    if (!run || run.status !== 'finalized' || run.period_year !== year) continue

    const emp = (item.employees as unknown) as {
      first_name: string; last_name: string; middle_name: string | null
      tin: string | null; tax_status: string
    }

    const existing = byEmployee.get(item.employee_id)
    if (existing) {
      existing.grossComp += item.gross_pay
      existing.taxableComp += item.taxable_income
      existing.taxWithheld += item.withholding_tax
    } else {
      byEmployee.set(item.employee_id, {
        tin: emp.tin,
        lastName: emp.last_name,
        firstName: emp.first_name,
        middleName: emp.middle_name,
        taxStatus: emp.tax_status,
        grossComp: item.gross_pay,
        taxableComp: item.taxable_income,
        taxWithheld: item.withholding_tax,
        isMWE: item.is_mwe,
      })
    }
  }

  // Build CSV
  const rows: string[] = [
    'TIN,Last Name,First Name,Middle Name,Tax Status,Gross Compensation,Non-Taxable,Taxable Compensation,Tax Withheld',
  ]

  for (const emp of byEmployee.values()) {
    const gross = (emp.grossComp / 100).toFixed(2)
    const nonTaxable = ((emp.grossComp - emp.taxableComp) / 100).toFixed(2)
    const taxable = (emp.taxableComp / 100).toFixed(2)
    const tax = (emp.taxWithheld / 100).toFixed(2)
    const middleInitial = emp.middleName ? `${emp.middleName[0]}.` : ''

    rows.push([
      emp.tin ?? '',
      `"${emp.lastName}"`,
      `"${emp.firstName}"`,
      `"${middleInitial}"`,
      emp.taxStatus,
      gross,
      nonTaxable,
      taxable,
      tax,
    ].join(','))
  }

  const csv = rows.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="alphalist-${year}.csv"`,
    },
  })
}

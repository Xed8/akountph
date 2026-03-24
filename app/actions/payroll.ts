'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'
import { computePayroll } from '@/lib/payroll/compute-payroll'
import { getRemittanceDeadlines } from '@/lib/remittances/deadlines'

export async function createPayrollRun(prevState: { error: string } | null, formData: FormData) {
  const { supabase, orgId } = await requireOrg()

  const month = parseInt(formData.get('period_month') as string)
  const year = parseInt(formData.get('period_year') as string)
  const payDate = (formData.get('pay_date') as string) || null

  // Check for duplicate
  const { data: existing } = await supabase
    .from('payroll_runs')
    .select('id')
    .eq('organization_id', orgId)
    .eq('period_month', month)
    .eq('period_year', year)
    .single()

  if (existing) {
    return { error: `A payroll run for ${month}/${year} already exists.` }
  }

  // Get active employees
  const { data: employees } = await supabase
    .from('employees')
    .select('id, monthly_basic_salary, allowances, tax_status')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .is('deleted_at', null)

  if (!employees?.length) {
    return { error: 'No active employees found. Add employees first.' }
  }

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const periodLabel = `${monthNames[month - 1]} ${year}`

  // Compute payslips
  const items = employees.map(emp => {
    const result = computePayroll({
      monthlyBasicSalaryCentavos: emp.monthly_basic_salary,
      allowancesCentavos: emp.allowances ?? 0,
      taxStatus: emp.tax_status as 'S' | 'M' | 'ME' | 'MWE',
    })
    return { emp, result }
  })

  // Aggregate totals
  const totals = items.reduce((acc, { result }) => ({
    total_gross: acc.total_gross + result.grossPay,
    total_net: acc.total_net + result.netPay,
    total_sss_ee: acc.total_sss_ee + result.sss.ee,
    total_sss_er: acc.total_sss_er + result.sss.er,
    total_ph_ee: acc.total_ph_ee + result.philHealth.ee,
    total_ph_er: acc.total_ph_er + result.philHealth.er,
    total_pi_ee: acc.total_pi_ee + result.pagIBIG.ee,
    total_pi_er: acc.total_pi_er + result.pagIBIG.er,
    total_wt: acc.total_wt + result.withholdingTax.monthlyTax,
  }), {
    total_gross: 0, total_net: 0,
    total_sss_ee: 0, total_sss_er: 0,
    total_ph_ee: 0, total_ph_er: 0,
    total_pi_ee: 0, total_pi_er: 0,
    total_wt: 0,
  })

  // Insert payroll run
  const { data: run, error: runError } = await supabase
    .from('payroll_runs')
    .insert({
      organization_id: orgId,
      period_month: month,
      period_year: year,
      period_label: periodLabel,
      pay_date: payDate,
      status: 'draft',
      ...totals,
    })
    .select('id')
    .single()

  if (runError || !run) return { error: runError?.message ?? 'Failed to create payroll run.' }

  // Insert payroll items
  const payrollItems = items.map(({ emp, result }) => ({
    payroll_run_id: run.id,
    organization_id: orgId,
    employee_id: emp.id,
    basic_salary: result.basicSalary,
    allowances: result.allowances,
    other_taxable: result.otherTaxable,
    gross_pay: result.grossPay,
    sss_msc: result.sss.msc,
    sss_ee: result.sss.ee,
    sss_er: result.sss.er,
    sss_ec: result.sss.ec,
    ph_mbs: result.philHealth.mbs,
    ph_ee: result.philHealth.ee,
    ph_er: result.philHealth.er,
    pi_ee: result.pagIBIG.ee,
    pi_er: result.pagIBIG.er,
    taxable_income: result.withholdingTax.taxableMonthly,
    annual_taxable: result.withholdingTax.taxableAnnual,
    annual_tax: result.withholdingTax.annualTax,
    withholding_tax: result.withholdingTax.monthlyTax,
    total_deductions: result.totalDeductions,
    net_pay: result.netPay,
    tax_status_snapshot: emp.tax_status,
    is_mwe: result.isMWE,
  }))

  await supabase.from('payroll_items').insert(payrollItems)

  revalidatePath('/payroll')
  redirect(`/payroll/${run.id}`)
}

export async function finalizePayrollRun(id: string) {
  const { supabase, orgId } = await requireOrg()

  // Get the run details first
  const { data: run } = await supabase
    .from('payroll_runs')
    .select('period_month, period_year, period_label, total_sss_ee, total_sss_er, total_ph_ee, total_ph_er, total_pi_ee, total_pi_er, total_wt, status')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (!run || run.status !== 'draft') return

  // Finalize the run
  await supabase
    .from('payroll_runs')
    .update({ status: 'finalized', finalized_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)

  // Auto-create remittance records
  const deadlines = getRemittanceDeadlines(run.period_month, run.period_year)

  const remittances = deadlines.map(d => {
    let employeeTotal = 0
    let employerTotal = 0

    if (d.agency === 'SSS') {
      employeeTotal = run.total_sss_ee
      employerTotal = run.total_sss_er
    } else if (d.agency === 'PhilHealth') {
      employeeTotal = run.total_ph_ee
      employerTotal = run.total_ph_er
    } else if (d.agency === 'PagIBIG') {
      employeeTotal = run.total_pi_ee
      employerTotal = run.total_pi_er
    } else if (d.agency === 'BIR') {
      employeeTotal = run.total_wt
      employerTotal = 0
    }

    return {
      organization_id: orgId,
      payroll_run_id: id,
      agency: d.agency,
      form_number: d.formNumber,
      period_label: run.period_label,
      due_date: d.dueDate.toISOString().split('T')[0],
      employee_total: employeeTotal,
      employer_total: employerTotal,
      total_amount: employeeTotal + employerTotal,
      status: 'pending',
    }
  })

  await supabase.from('remittances').insert(remittances)

  revalidatePath(`/payroll/${id}`)
  revalidatePath('/payroll')
  revalidatePath('/remittances')
  revalidatePath('/dashboard')
}

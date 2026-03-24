// Payroll orchestrator — combines SSS, PhilHealth, Pag-IBIG, Withholding Tax
// All monetary values in CENTAVOS.

import { computeSSS, type SSSResult } from './sss'
import { computePhilHealth, type PhilHealthResult } from './philhealth'
import { computePagIBIG, type PagIBIGResult } from './pagibig'
import { computeWithholdingTax, type WithholdingTaxResult } from './withholding-tax'

export interface PayslipInput {
  monthlyBasicSalaryCentavos: number
  allowancesCentavos?: number
  otherTaxableCentavos?: number
  taxStatus: 'S' | 'M' | 'ME' | 'MWE'
}

export interface PayslipResult {
  // Earnings
  basicSalary: number
  allowances: number
  otherTaxable: number
  grossPay: number

  // SSS
  sss: SSSResult

  // PhilHealth
  philHealth: PhilHealthResult

  // Pag-IBIG
  pagIBIG: PagIBIGResult

  // Withholding Tax
  withholdingTax: WithholdingTaxResult

  // Summary
  totalDeductions: number
  netPay: number

  // Employer cost
  totalEmployerCost: number

  // Flags
  isMWE: boolean
}

/**
 * Compute a full payslip for one employee for one month.
 * All inputs and outputs are in centavos.
 */
export function computePayroll(input: PayslipInput): PayslipResult {
  const {
    monthlyBasicSalaryCentavos,
    allowancesCentavos = 0,
    otherTaxableCentavos = 0,
    taxStatus,
  } = input

  const isMWE = taxStatus === 'MWE'
  const grossPay = monthlyBasicSalaryCentavos + allowancesCentavos + otherTaxableCentavos

  const sss = computeSSS(monthlyBasicSalaryCentavos)
  const philHealth = computePhilHealth(monthlyBasicSalaryCentavos)
  const pagIBIG = computePagIBIG(monthlyBasicSalaryCentavos)

  const withholdingTax = computeWithholdingTax(
    grossPay,
    sss.ee,
    philHealth.ee,
    pagIBIG.ee,
    isMWE
  )

  const totalDeductions = sss.ee + philHealth.ee + pagIBIG.ee + withholdingTax.monthlyTax
  const netPay = grossPay - totalDeductions

  const totalEmployerCost =
    grossPay + sss.er + sss.ec + philHealth.er + pagIBIG.er

  return {
    basicSalary: monthlyBasicSalaryCentavos,
    allowances: allowancesCentavos,
    otherTaxable: otherTaxableCentavos,
    grossPay,
    sss,
    philHealth,
    pagIBIG,
    withholdingTax,
    totalDeductions,
    netPay,
    totalEmployerCost,
    isMWE,
  }
}

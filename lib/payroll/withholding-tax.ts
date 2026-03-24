// BIR Withholding Tax on Compensation — TRAIN Law (RA 10963), 2023 schedule
// All monetary values in CENTAVOS.

export interface WithholdingTaxResult {
  taxableMonthly: number // monthly taxable income after deductions (centavos)
  taxableAnnual: number  // annualized taxable income (centavos)
  annualTax: number      // annual income tax due (centavos)
  monthlyTax: number     // monthlyTax = annualTax / 12, rounded (centavos)
}

// Annual tax brackets in centavos
const BRACKETS = [
  { min:         0, max:  25000000, base:        0, rate: 0.00, over:        0 },
  { min:  25000001, max:  40000000, base:        0, rate: 0.15, over:  25000000 },
  { min:  40000001, max:  80000000, base:  2250000, rate: 0.20, over:  40000000 },
  { min:  80000001, max: 200000000, base: 10250000, rate: 0.25, over:  80000000 },
  { min: 200000001, max: 800000000, base: 40250000, rate: 0.30, over: 200000000 },
  { min: 800000001, max: Infinity,  base: 220250000, rate: 0.35, over: 800000000 },
]

/**
 * Compute monthly withholding tax.
 * @param grossSalaryCentavos - gross monthly salary in centavos
 * @param sssEE - SSS employee share in centavos
 * @param phEE - PhilHealth employee share in centavos
 * @param piEE - Pag-IBIG employee share in centavos
 * @param isMWE - true if minimum wage earner (fully exempt)
 */
export function computeWithholdingTax(
  grossSalaryCentavos: number,
  sssEE: number,
  phEE: number,
  piEE: number,
  isMWE: boolean
): WithholdingTaxResult {
  if (isMWE) {
    return {
      taxableMonthly: 0,
      taxableAnnual: 0,
      annualTax: 0,
      monthlyTax: 0,
    }
  }

  const taxableMonthly = grossSalaryCentavos - sssEE - phEE - piEE
  const taxableAnnual = taxableMonthly * 12

  const bracket = BRACKETS.find(
    b => taxableAnnual >= b.min && taxableAnnual <= b.max
  )

  let annualTax = 0
  if (bracket && bracket.rate > 0) {
    annualTax = Math.round(
      bracket.base + (taxableAnnual - bracket.over) * bracket.rate
    )
  }

  const monthlyTax = Math.round(annualTax / 12)

  return { taxableMonthly, taxableAnnual, annualTax, monthlyTax }
}

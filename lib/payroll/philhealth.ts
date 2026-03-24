// PhilHealth Contributions — PhilHealth Circular PA2025-0002
// Rate: 5% of MBS, floor ₱10,000, ceiling ₱100,000, split 50/50
// All monetary values in CENTAVOS.

export interface PhilHealthResult {
  mbs: number   // Applicable Monthly Basic Salary used (centavos)
  ee: number    // Employee share (centavos)
  er: number    // Employer share (centavos)
  total: number // ee + er
}

const FLOOR = 1000000  // ₱10,000 in centavos
const CEILING = 10000000 // ₱100,000 in centavos
const RATE = 0.05

/**
 * Compute PhilHealth contributions.
 * @param monthlySalaryCentavos - gross monthly salary in centavos
 */
export function computePhilHealth(monthlySalaryCentavos: number): PhilHealthResult {
  const mbs = Math.max(FLOOR, Math.min(monthlySalaryCentavos, CEILING))
  const total = Math.round(mbs * RATE)
  const ee = Math.round(total / 2)
  const er = total - ee // ensures ee + er === total exactly

  return { mbs, ee, er, total }
}

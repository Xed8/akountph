// Pag-IBIG (HDMF) Contributions — HDMF Circular No. 460 (Feb 2024)
// MFS cap: ₱10,000. EE: 2% (1% if salary ≤ ₱1,500). ER: always 2%.
// All monetary values in CENTAVOS.

export interface PagIBIGResult {
  mfs: number   // Maximum Fund Salary used (centavos)
  ee: number    // Employee share (centavos)
  er: number    // Employer share (centavos)
  total: number // ee + er
}

const MFS_CAP = 1000000 // ₱10,000 in centavos
const LOW_SALARY_THRESHOLD = 150000 // ₱1,500 in centavos

/**
 * Compute Pag-IBIG contributions.
 * @param monthlySalaryCentavos - gross monthly salary in centavos
 */
export function computePagIBIG(monthlySalaryCentavos: number): PagIBIGResult {
  const mfs = Math.min(monthlySalaryCentavos, MFS_CAP)
  const eeRate = mfs <= LOW_SALARY_THRESHOLD ? 0.01 : 0.02
  const ee = Math.round(mfs * eeRate)
  const er = Math.round(mfs * 0.02)

  return { mfs, ee, er, total: ee + er }
}

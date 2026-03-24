// SSS Contributions — SSS Circular 2024-006 (Effective January 2025)
// All monetary values in CENTAVOS. ₱1 = 100 centavos.

interface SSSBracket {
  max: number // max monthly salary in centavos to qualify for this MSC
  msc: number // Monthly Salary Credit in centavos
}

// Full bracket table — ₱500 increments from ₱5,000 to ₱35,000 MSC
const SSS_BRACKETS: SSSBracket[] = [
  { max:  524999, msc:  500000 }, // < ₱5,250 → MSC ₱5,000
  { max:  574999, msc:  550000 },
  { max:  624999, msc:  600000 },
  { max:  674999, msc:  650000 },
  { max:  724999, msc:  700000 },
  { max:  774999, msc:  750000 },
  { max:  824999, msc:  800000 },
  { max:  874999, msc:  850000 },
  { max:  924999, msc:  900000 },
  { max:  974999, msc:  950000 },
  { max: 1024999, msc: 1000000 },
  { max: 1074999, msc: 1050000 },
  { max: 1124999, msc: 1100000 },
  { max: 1174999, msc: 1150000 },
  { max: 1224999, msc: 1200000 },
  { max: 1274999, msc: 1250000 },
  { max: 1324999, msc: 1300000 },
  { max: 1374999, msc: 1350000 },
  { max: 1424999, msc: 1400000 },
  { max: 1474999, msc: 1450000 },
  { max: 1524999, msc: 1500000 },
  { max: 1574999, msc: 1550000 },
  { max: 1624999, msc: 1600000 },
  { max: 1674999, msc: 1650000 },
  { max: 1724999, msc: 1700000 },
  { max: 1774999, msc: 1750000 },
  { max: 1824999, msc: 1800000 },
  { max: 1874999, msc: 1850000 },
  { max: 1924999, msc: 1900000 },
  { max: 1974999, msc: 1950000 },
  { max: 2024999, msc: 2000000 },
  { max: 2074999, msc: 2050000 },
  { max: 2124999, msc: 2100000 },
  { max: 2174999, msc: 2150000 },
  { max: 2224999, msc: 2200000 },
  { max: 2274999, msc: 2250000 },
  { max: 2324999, msc: 2300000 },
  { max: 2374999, msc: 2350000 },
  { max: 2424999, msc: 2400000 },
  { max: 2474999, msc: 2450000 },
  { max: 2524999, msc: 2500000 },
  { max: 2574999, msc: 2550000 },
  { max: 2624999, msc: 2600000 },
  { max: 2674999, msc: 2650000 },
  { max: 2724999, msc: 2700000 },
  { max: 2774999, msc: 2750000 },
  { max: 2824999, msc: 2800000 },
  { max: 2874999, msc: 2850000 },
  { max: 2924999, msc: 2900000 },
  { max: 2974999, msc: 2950000 },
  { max: 3024999, msc: 3000000 },
  { max: 3074999, msc: 3050000 },
  { max: 3124999, msc: 3100000 },
  { max: 3174999, msc: 3150000 },
  { max: 3224999, msc: 3200000 },
  { max: 3274999, msc: 3250000 },
  { max: 3324999, msc: 3300000 },
  { max: 3374999, msc: 3350000 },
  { max: 3424999, msc: 3400000 },
  { max: 3474999, msc: 3450000 },
  { max: Infinity, msc: 3500000 }, // ≥ ₱34,750 → MSC ₱35,000 (max)
]

export interface SSSResult {
  msc: number       // Monthly Salary Credit (centavos)
  ee: number        // Employee share (centavos)
  er: number        // Employer share (centavos)
  ec: number        // Employer EC (centavos)
  totalRemittance: number // ee + er + ec
}

/**
 * Compute SSS contributions.
 * @param monthlySalaryCentavos - gross monthly salary in centavos
 */
export function computeSSS(monthlySalaryCentavos: number): SSSResult {
  const bracket = SSS_BRACKETS.find(b => monthlySalaryCentavos <= b.max)
  const msc = bracket?.msc ?? 3500000

  const ee = Math.round(msc * 0.05)   // 5%
  const er = Math.round(msc * 0.10)   // 10%
  const ec = msc >= 1500000 ? 3000 : 1000 // ₱30 or ₱10

  return { msc, ee, er, ec, totalRemittance: ee + er + ec }
}

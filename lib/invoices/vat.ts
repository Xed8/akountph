// Philippine VAT: 12% of VAT-exclusive amount
// All values in centavos

const VAT_RATE = 0.12

export interface VATResult {
  subtotal: number    // VAT-exclusive amount (centavos)
  vatAmount: number   // 12% VAT (centavos)
  total: number       // subtotal + vatAmount (centavos)
}

export function computeVAT(subtotalCentavos: number, isVatRegistered: boolean): VATResult {
  if (!isVatRegistered) {
    return { subtotal: subtotalCentavos, vatAmount: 0, total: subtotalCentavos }
  }
  const vatAmount = Math.round(subtotalCentavos * VAT_RATE)
  return {
    subtotal: subtotalCentavos,
    vatAmount,
    total: subtotalCentavos + vatAmount,
  }
}

// Given a VAT-inclusive total, extract the VAT portion (divide by 1.12)
export function extractVAT(totalCentavos: number): VATResult {
  const subtotal = Math.round(totalCentavos / 1.12)
  const vatAmount = totalCentavos - subtotal
  return { subtotal, vatAmount, total: totalCentavos }
}

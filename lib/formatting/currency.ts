// Currency formatting utilities
// Internal storage: INTEGER centavos. Display: ₱ with 2 decimal places.

const PHP_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Convert centavos to display string. e.g. 250000 → "₱2,500.00"
 */
export function centavosToDisplay(centavos: number): string {
  return PHP_FORMATTER.format(centavos / 100)
}

/**
 * Convert centavos to a plain number for display. e.g. 250000 → 2500.00
 */
export function centavosToFloat(centavos: number): number {
  return centavos / 100
}

/**
 * Convert a peso float/string input to centavos integer. e.g. 2500.5 → 250050
 * Rounds to nearest centavo.
 */
export function pesosToCentavos(pesos: number | string): number {
  const value = typeof pesos === 'string' ? parseFloat(pesos.replace(/,/g, '')) : pesos
  return Math.round(value * 100)
}

/**
 * Format a centavo value as a plain number string with 2 decimals (no currency symbol).
 * Useful for form inputs.
 */
export function centavosToInputValue(centavos: number): string {
  return (centavos / 100).toFixed(2)
}

import { addMonths, setDate, endOfMonth, addDays } from 'date-fns'

export interface RemittanceDeadline {
  agency: 'SSS' | 'PhilHealth' | 'PagIBIG' | 'BIR'
  formNumber: string
  description: string
  dueDate: Date
  periodLabel: string
}

/**
 * Returns all remittance deadlines for a given payroll period.
 * @param month - 1-indexed month of the payroll period
 * @param year - year of the payroll period
 */
export function getRemittanceDeadlines(
  month: number,
  year: number
): RemittanceDeadline[] {
  // Remittances are due the FOLLOWING month after payroll period
  const followingMonth = addMonths(new Date(year, month - 1, 1), 1)
  const followingYear = followingMonth.getFullYear()
  const followingMonthNum = followingMonth.getMonth() + 1

  const periodLabel = `${getPeriodName(month)} ${year}`

  // SSS — 10th of following month (or last day if 10th falls on weekend/holiday)
  const sssDue = setDate(new Date(followingYear, followingMonthNum - 1, 1), 10)

  // Pag-IBIG — 10th of following month
  const pagibigDue = setDate(new Date(followingYear, followingMonthNum - 1, 1), 10)

  // BIR 1601-C — 10th of following month
  const birDue = setDate(new Date(followingYear, followingMonthNum - 1, 1), 10)

  // PhilHealth — 15th of following month
  const philHealthDue = setDate(new Date(followingYear, followingMonthNum - 1, 1), 15)

  return [
    {
      agency: 'SSS',
      formNumber: 'R-5',
      description: 'SSS Employer Remittance',
      dueDate: sssDue,
      periodLabel,
    },
    {
      agency: 'PagIBIG',
      formNumber: 'MCRF',
      description: 'Pag-IBIG Monthly Contribution Remittance',
      dueDate: pagibigDue,
      periodLabel,
    },
    {
      agency: 'BIR',
      formNumber: '1601-C',
      description: 'Withholding Tax on Compensation',
      dueDate: birDue,
      periodLabel,
    },
    {
      agency: 'PhilHealth',
      formNumber: 'RF-1',
      description: 'PhilHealth Premium Remittance',
      dueDate: philHealthDue,
      periodLabel,
    },
  ]
}

function getPeriodName(month: number): string {
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return names[month - 1] ?? ''
}

// Re-export date-fns utilities used elsewhere to keep imports clean
export { addDays, endOfMonth }

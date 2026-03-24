import { format, parseISO } from 'date-fns'

/**
 * Format a Date or ISO string for display. e.g. "March 2025"
 */
export function formatPeriodLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  return format(date, 'MMMM yyyy')
}

/**
 * Format a date for display. e.g. "Mar 15, 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

/**
 * Format a due date with urgency context. Returns the formatted date.
 */
export function formatDueDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

/**
 * Returns true if the date is past today.
 */
export function isOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return d < new Date()
}

/**
 * Returns true if the date is within the next N days.
 */
export function isDueSoon(date: Date | string, withinDays = 7): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const cutoff = new Date(now.getTime() + withinDays * 86400000)
  return d >= now && d <= cutoff
}

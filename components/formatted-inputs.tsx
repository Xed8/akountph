'use client'

/**
 * Formatted input components that auto-insert separators and enforce
 * max length as the user types. Each renders a standard <input> so
 * it works inside both action-based and controlled forms.
 */

import { useRef, type ChangeEvent } from 'react'
import { cn } from '@/lib/utils'

const BASE_CLS =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

/* ── helpers ─────────────────────────────────────────────────── */

function digits(v: string) {
  return v.replace(/\D/g, '')
}

/* ── Phone PH  09XX-XXX-XXXX  or  +639XX-XXX-XXXX ───────────── */
export function PhoneInput({
  name,
  defaultValue,
  className,
}: {
  name: string
  defaultValue?: string | null
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  function format(raw: string): string {
    // Allow + at start
    const hasPlus = raw.startsWith('+')
    const d = digits(raw)

    if (hasPlus) {
      // +63 9XX XXX XXXX → +639XX-XXX-XXXX
      const body = d.startsWith('63') ? d.slice(2) : d
      const p1 = body.slice(0, 3)
      const p2 = body.slice(3, 6)
      const p3 = body.slice(6, 10)
      let out = '+63' + p1
      if (p2) out += '-' + p2
      if (p3) out += '-' + p3
      return out
    } else {
      // 09XX-XXX-XXXX
      const p1 = d.slice(0, 4)
      const p2 = d.slice(4, 7)
      const p3 = d.slice(7, 11)
      let out = p1
      if (p2) out += '-' + p2
      if (p3) out += '-' + p3
      return out
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const formatted = format(raw)
    e.target.value = formatted
  }

  return (
    <input
      ref={ref}
      name={name}
      type="tel"
      defaultValue={defaultValue ?? ''}
      placeholder="09XX-XXX-XXXX"
      maxLength={16}
      onChange={handleChange}
      className={cn(BASE_CLS, className)}
      title="Valid PH mobile: 09XX-XXX-XXXX or +639XX-XXX-XXXX"
    />
  )
}

/* ── TIN  000-000-000 / 000-000-000-000 / 000-000-000-00000 ──── */
export function TinInput({
  name,
  defaultValue,
  className,
}: {
  name: string
  defaultValue?: string | null
  className?: string
}) {
  function format(raw: string): string {
    const d = digits(raw).slice(0, 12) // max 12 digits → 000-000-000-000
    const p1 = d.slice(0, 3)
    const p2 = d.slice(3, 6)
    const p3 = d.slice(6, 9)
    const p4 = d.slice(9, 12)
    let out = p1
    if (p2) out += '-' + p2
    if (p3) out += '-' + p3
    if (p4) out += '-' + p4
    return out
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const pos = e.target.selectionStart ?? 0
    const old = e.target.value
    const formatted = format(e.target.value)
    e.target.value = formatted
    // keep cursor roughly in place
    const diff = formatted.length - old.length
    e.target.setSelectionRange(pos + diff, pos + diff)
  }

  return (
    <input
      name={name}
      type="text"
      inputMode="numeric"
      defaultValue={defaultValue ?? ''}
      placeholder="000-000-000-000"
      maxLength={15} // 12 digits + 3 dashes
      onChange={handleChange}
      className={cn(BASE_CLS, className)}
      title="Format: 000-000-000 or 000-000-000-000"
    />
  )
}

/* ── SSS  00-0000000-0 ───────────────────────────────────────── */
export function SssInput({
  name,
  defaultValue,
  className,
}: {
  name: string
  defaultValue?: string | null
  className?: string
}) {
  function format(raw: string): string {
    const d = digits(raw).slice(0, 10)
    const p1 = d.slice(0, 2)
    const p2 = d.slice(2, 9)
    const p3 = d.slice(9, 10)
    let out = p1
    if (p2) out += '-' + p2
    if (p3) out += '-' + p3
    return out
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    e.target.value = format(e.target.value)
  }

  return (
    <input
      name={name}
      type="text"
      inputMode="numeric"
      defaultValue={defaultValue ?? ''}
      placeholder="00-0000000-0"
      maxLength={12} // 10 digits + 2 dashes
      onChange={handleChange}
      className={cn(BASE_CLS, className)}
      title="Format: 00-0000000-0"
    />
  )
}

/* ── PhilHealth  00-000000000-0 ──────────────────────────────── */
export function PhilhealthInput({
  name,
  defaultValue,
  className,
}: {
  name: string
  defaultValue?: string | null
  className?: string
}) {
  function format(raw: string): string {
    const d = digits(raw).slice(0, 12)
    const p1 = d.slice(0, 2)
    const p2 = d.slice(2, 11)
    const p3 = d.slice(11, 12)
    let out = p1
    if (p2) out += '-' + p2
    if (p3) out += '-' + p3
    return out
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    e.target.value = format(e.target.value)
  }

  return (
    <input
      name={name}
      type="text"
      inputMode="numeric"
      defaultValue={defaultValue ?? ''}
      placeholder="00-000000000-0"
      maxLength={14} // 12 digits + 2 dashes
      onChange={handleChange}
      className={cn(BASE_CLS, className)}
      title="Format: 00-000000000-0"
    />
  )
}

/* ── Pag-IBIG  0000-0000-0000 ────────────────────────────────── */
export function PagibigInput({
  name,
  defaultValue,
  className,
}: {
  name: string
  defaultValue?: string | null
  className?: string
}) {
  function format(raw: string): string {
    const d = digits(raw).slice(0, 12)
    const p1 = d.slice(0, 4)
    const p2 = d.slice(4, 8)
    const p3 = d.slice(8, 12)
    let out = p1
    if (p2) out += '-' + p2
    if (p3) out += '-' + p3
    return out
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    e.target.value = format(e.target.value)
  }

  return (
    <input
      name={name}
      type="text"
      inputMode="numeric"
      defaultValue={defaultValue ?? ''}
      placeholder="0000-0000-0000"
      maxLength={14} // 12 digits + 2 dashes
      onChange={handleChange}
      className={cn(BASE_CLS, className)}
      title="Format: 0000-0000-0000"
    />
  )
}

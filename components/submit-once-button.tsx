'use client'

import { useState } from 'react'

interface SubmitOnceButtonProps {
  className?: string
  children: React.ReactNode
}

/** A plain <button type="submit"> that disables itself on first click to prevent double-submission. */
export function SubmitOnceButton({ className, children }: SubmitOnceButtonProps) {
  const [submitted, setSubmitted] = useState(false)

  return (
    <button
      type="submit"
      disabled={submitted}
      className={`${className ?? ''} disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={() => setSubmitted(true)}
    >
      {children}
    </button>
  )
}

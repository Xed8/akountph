'use client'

import { useState } from 'react'

interface ConfirmButtonProps {
  message: string
  className?: string
  children: React.ReactNode
}

export function ConfirmButton({ message, className, children }: ConfirmButtonProps) {
  const [submitted, setSubmitted] = useState(false)

  return (
    <button
      type="submit"
      disabled={submitted}
      className={`${className ?? ''} disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={e => {
        if (!confirm(message)) {
          e.preventDefault()
          return
        }
        setSubmitted(true)
      }}
    >
      {children}
    </button>
  )
}

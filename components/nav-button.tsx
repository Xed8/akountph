'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NavButtonProps {
  href: string
  className?: string
  children: React.ReactNode
}

/** A <Link> that disables itself on first click to prevent rapid multi-navigation. */
export function NavButton({ href, className, children }: NavButtonProps) {
  const [clicked, setClicked] = useState(false)

  return (
    <Link
      href={href}
      onClick={() => setClicked(true)}
      aria-disabled={clicked}
      className={cn(className, clicked && 'pointer-events-none opacity-60')}
    >
      {children}
    </Link>
  )
}

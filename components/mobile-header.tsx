'use client'

import { useState } from 'react'
import { Menu, X, Building2 } from 'lucide-react'
import { Sidebar } from './sidebar'

interface MobileHeaderProps {
  orgName: string
}

export function MobileHeader({ orgName }: MobileHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="flex md:hidden h-14 items-center px-4 border-b border-zinc-200 bg-zinc-50 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-md text-zinc-600 hover:bg-zinc-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-900 text-white">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold text-zinc-900 truncate">{orgName}</span>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 flex flex-col">
            <div className="relative">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 z-10"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <Sidebar orgName={orgName} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

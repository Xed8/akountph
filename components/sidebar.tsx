'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calculator,
  Receipt,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/payroll', label: 'Payroll', icon: Calculator },
  { href: '/remittances', label: 'Remittances', icon: Receipt },
  { href: '/reports', label: 'Reports', icon: FileText },
]

interface SidebarProps {
  orgName: string
}

export function Sidebar({ orgName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-gray-900 text-white shrink-0">
      {/* Logo / org name */}
      <div className="px-4 py-5 border-b border-gray-700">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">AkountPH</p>
        <p className="text-sm font-semibold text-white truncate">{orgName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-gray-700 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  )
}

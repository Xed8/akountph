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
  Building2,
  UserCircle,
  Package,
  BarChart2,
  Truck,
  RefreshCw,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

type NavItem =
  | { href: string; label: string; icon: React.ElementType; divider?: never }
  | { label: string; divider: true; href?: never; icon?: never }

import React from 'react'

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { label: 'PAYROLL', divider: true },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/payroll', label: 'Payroll', icon: Calculator },
  { href: '/remittances', label: 'Remittances', icon: Receipt },
  { label: 'SALES', divider: true },
  { href: '/clients', label: 'Clients', icon: UserCircle },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/items', label: 'Products & Services', icon: Package },
  { label: 'PURCHASES', divider: true },
  { href: '/vendors', label: 'Vendors', icon: Truck },
  { href: '/bills', label: 'Bills', icon: Receipt },
  { href: '/recurring', label: 'Recurring', icon: RefreshCw },
  { label: 'OTHER', divider: true },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
]

interface SidebarProps {
  orgName: string
}

export function Sidebar({ orgName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-[250px] min-h-screen bg-zinc-50 text-zinc-900 shrink-0 border-r border-zinc-200 transition-none">
      {/* Header/Logo area */}
      <div className="flex h-14 items-center px-5 gap-3 border-b border-zinc-200">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-zinc-900 text-white">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate tracking-tight">{orgName}</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          if ('divider' in item) {
            return (
              <p key={item.label} className="px-3 pt-4 pb-1 text-[10px] font-semibold text-zinc-400 tracking-widest uppercase">
                {item.label}
              </p>
            )
          }
          const { href, label, icon: Icon } = item
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-zinc-200/50 text-zinc-900'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700")} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-zinc-200 bg-zinc-50 space-y-1">
        <Link
          href="/settings/categories"
          className={cn(
            'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
            pathname.startsWith('/settings/categories')
              ? 'bg-zinc-200/50 text-zinc-900'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          )}
        >
          <Package className={cn("h-4 w-4 shrink-0", pathname.startsWith('/settings/categories') ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700")} />
          Categories
        </Link>
        <Link
          href="/settings"
          className={cn(
            'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
            pathname === '/settings'
              ? 'bg-zinc-200/50 text-zinc-900'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          )}
        >
          <Settings className={cn("h-4 w-4 shrink-0", pathname === '/settings' ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700")} />
          Settings
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-150 cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-red-500" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}

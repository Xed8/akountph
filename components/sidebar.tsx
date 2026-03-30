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
  Landmark,
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
  { href: '/inventory', label: 'Inventory', icon: Package },
  { label: 'OTHER', divider: true },
  { href: '/bank', label: 'Bank Recon', icon: Landmark },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
]

interface SidebarProps {
  orgName: string
}

export function Sidebar({ orgName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 flex flex-col w-[240px] h-screen bg-[#0B1F3A] text-white shrink-0 transition-none">
      {/* Header/Logo area */}
      <div className="flex h-14 items-center px-5 gap-3 border-b border-[#1e3a58]">
        <div className="flex items-center justify-center w-[34px] h-[34px] rounded-lg bg-[#00C48C] text-white font-extrabold text-[15px] shrink-0">
          ₱
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">AkountPH</p>
          <p className="text-[10px] text-[#5a8ab0] font-mono truncate">{orgName}</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-0 flex flex-col gap-0">
        {NAV_ITEMS.map((item) => {
          if ('divider' in item) {
            return (
              <p key={item.label} className="px-5 pt-3.5 pb-1 text-[10px] font-bold text-[#3a6080] tracking-[1.2px] uppercase">
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
                'group flex items-center gap-2.5 px-5 py-[9px] text-[13.5px] font-medium transition-all duration-150 border-l-[3px]',
                isActive
                  ? 'bg-[#1a3554] text-white border-[#00C48C]'
                  : 'text-[#7a9bbf] hover:text-white hover:bg-[#1a3554] border-transparent'
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-[#7a9bbf] group-hover:text-white")} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[#1e3a58] space-y-0.5">
        <Link
          href="/settings/categories"
          className={cn(
            'group flex items-center gap-2.5 px-3 py-[9px] rounded-md text-[13.5px] font-medium transition-all duration-150',
            pathname.startsWith('/settings/categories')
              ? 'bg-[#1a3554] text-white'
              : 'text-[#7a9bbf] hover:text-white hover:bg-[#1a3554]'
          )}
        >
          <Package className="h-4 w-4 shrink-0" />
          Categories
        </Link>
        <Link
          href="/settings"
          className={cn(
            'group flex items-center gap-2.5 px-3 py-[9px] rounded-md text-[13.5px] font-medium transition-all duration-150',
            pathname === '/settings'
              ? 'bg-[#1a3554] text-white'
              : 'text-[#7a9bbf] hover:text-white hover:bg-[#1a3554]'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full group flex items-center gap-2.5 px-3 py-[9px] rounded-md text-[13.5px] font-medium text-[#7a9bbf] hover:text-red-400 hover:bg-red-900/20 transition-all duration-150 cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}

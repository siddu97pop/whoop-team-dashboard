'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Activity,
  Moon,
  Dumbbell,
  Heart,
  Users,
  Settings,
  Zap,
  X,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',  href: '/dashboard',           icon: Zap },
  { label: 'Team',      href: '/dashboard/team',       icon: Users },
  { label: 'Sleep',     href: '/dashboard/sleep',      icon: Moon },
  { label: 'Workouts',  href: '/dashboard/workouts',   icon: Dumbbell },
  { label: 'HRV',       href: '/dashboard/hrv',        icon: Heart },
  { label: 'Admin',     href: '/dashboard/admin',      icon: Settings },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Activity className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            WHOOP Team
          </span>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden -mr-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          // Exact match for overview, prefix match for sub-pages
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer border-l-2',
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 border-primary pl-[10px] pr-3'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent px-3'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden="true"
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex-shrink-0">
        <p className="text-xs text-muted-foreground">
          Powered by WHOOP API
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 border-r border-border bg-background z-30">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-background border-r border-border lg:hidden shadow-xl">
            {content}
          </aside>
        </>
      )}
    </>
  )
}

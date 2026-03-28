'use client'

import { useState, useEffect } from 'react'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopBarProps {
  onMenuClick: () => void
  userName?: string
  userInitials?: string
}

export function TopBar({ onMenuClick, userName, userInitials }: TopBarProps) {
  const [isDark, setIsDark] = useState(false)

  // Sync with <html> class on mount
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleTheme() {
    const html = document.documentElement
    if (html.classList.contains('dark')) {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden -ml-1 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right-side controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-md transition-colors cursor-pointer',
            'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="h-4.5 w-4.5" aria-hidden="true" />
          ) : (
            <Moon className="h-4.5 w-4.5" aria-hidden="true" />
          )}
        </button>

        {/* Notification bell (placeholder) */}
        <button
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        </button>

        {/* User avatar */}
        {(userName || userInitials) && (
          <div className="flex items-center gap-2.5 ml-1">
            <div
              className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-border"
              aria-hidden="true"
            >
              <span className="text-xs font-semibold text-primary">
                {userInitials ?? userName?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-foreground truncate max-w-[120px]">
              {userName}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}

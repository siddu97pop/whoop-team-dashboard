'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-dvh">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          userName="Siddharth"
          userInitials="SD"
        />

        <main
          id="main-content"
          className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-[1400px] w-full mx-auto"
        >
          {children}
        </main>
      </div>
    </div>
  )
}

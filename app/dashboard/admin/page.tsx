import { getCurrentUser } from '@/lib/session'
import { getAllActiveUsers } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'
import { AdminTable } from './AdminTable'
import Link from 'next/link'

export const revalidate = 0 // always fresh for admin

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/api/whoop/connect')

  const users = await getAllActiveUsers().catch(() => [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage WHOOP connections for all team members
          </p>
        </div>
        <Link
          href="/api/whoop/connect"
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          style={{ backgroundColor: '#0F6E56' }}
        >
          + Connect WHOOP
        </Link>
      </div>

      <AdminTable users={users} currentUserId={user.whoop_user_id} />
    </div>
  )
}

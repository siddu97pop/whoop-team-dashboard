import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { getSleepsForUser } from '@/lib/supabase/queries'
import { SleepCharts } from './SleepCharts'

export const revalidate = 300

export default async function SleepPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/api/whoop/connect')

  const sleeps = await getSleepsForUser(user.whoop_user_id, 30).catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sleep Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Last 30 days</p>
      </div>
      <SleepCharts sleeps={sleeps} />
    </div>
  )
}

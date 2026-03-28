import { getCurrentUser } from '@/lib/session'
import { getAllActiveUsers, getLatestRecovery, getLatestSleep } from '@/lib/supabase/queries'
import { TeamGrid } from '@/components/dashboard/TeamGrid'
import { redirect } from 'next/navigation'

export const revalidate = 300

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/api/whoop/connect')

  const allUsers = await getAllActiveUsers().catch(() => [])

  // Fetch latest recovery + sleep for each member in parallel
  const enriched = await Promise.all(
    allUsers.map(async (u) => {
      const [recovery, sleep] = await Promise.all([
        getLatestRecovery(u.whoop_user_id).catch(() => null),
        getLatestSleep(u.whoop_user_id).catch(() => null),
      ])
      return {
        whoop_user_id: u.whoop_user_id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        is_active: u.is_active,
        recovery_score: recovery?.recovery_score ?? null,
        hrv: recovery?.hrv_rmssd_milli ?? null,
        sleep_ms: sleep?.total_in_bed_milli ?? null,
        recovery_score_state:
          (recovery?.score_state as 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE') ?? 'PENDING_SCORE',
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {enriched.length} member{enriched.length !== 1 ? 's' : ''} · sorted by recovery (lowest first)
        </p>
      </div>
      <TeamGrid members={enriched} />
    </div>
  )
}

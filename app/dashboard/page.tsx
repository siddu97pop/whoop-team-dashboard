import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import {
  getLatestRecovery,
  getLatestSleep,
  getWorkoutsForUser,
  getRecoveriesForUser,
} from '@/lib/supabase/queries'
import { RecoveryCard } from '@/components/dashboard/RecoveryCard'
import { SleepBreakdown } from '@/components/dashboard/SleepBreakdown'
import { HRVChart } from '@/components/dashboard/HRVChart'
import { WorkoutList } from '@/components/dashboard/WorkoutList'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Users, Moon, Dumbbell, Activity } from 'lucide-react'

export const revalidate = 300 // revalidate every 5 min

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/api/whoop/connect')

  const [recovery, sleep, workouts, recoveries30d] = await Promise.all([
    getLatestRecovery(user.whoop_user_id).catch(() => null),
    getLatestSleep(user.whoop_user_id).catch(() => null),
    getWorkoutsForUser(user.whoop_user_id, 14).catch(() => []),
    getRecoveriesForUser(user.whoop_user_id, 30).catch(() => []),
  ])

  // Build HRV chart data from 30-day recoveries
  const hrvData = recoveries30d.map((r) => ({
    date: r.recorded_at,
    hrv: r.hrv_rmssd_milli,
    recovery: r.recovery_score,
  }))

  // Compute personal HRV baseline (30-day average)
  const validHRVs = recoveries30d.filter((r) => r.hrv_rmssd_milli != null)
  const baseline =
    validHRVs.length > 0
      ? Math.round(validHRVs.reduce((s, r) => s + (r.hrv_rmssd_milli ?? 0), 0) / validHRVs.length)
      : undefined

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good {getGreeting()}, {user.first_name ?? 'there'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </div>

      {/* Top row — Recovery + Sleep */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecoveryCard
          recoveryScore={recovery?.recovery_score ?? null}
          hrv={recovery?.hrv_rmssd_milli ?? null}
          restingHR={recovery?.resting_heart_rate ?? null}
          spo2={recovery?.spo2_percentage ?? null}
          skinTemp={recovery?.skin_temp_celsius ?? null}
          scoreState={(recovery?.score_state as 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE') ?? 'PENDING_SCORE'}
        />
        <SleepBreakdown
          totalInBedMs={sleep?.total_in_bed_milli ?? null}
          deepMs={sleep?.total_deep_milli ?? null}
          remMs={sleep?.total_rem_milli ?? null}
          lightMs={sleep?.total_light_milli ?? null}
          awakeMs={sleep?.total_awake_milli ?? null}
          efficiency={sleep?.sleep_efficiency_pct ?? null}
          performance={sleep?.sleep_performance_pct ?? null}
          consistency={sleep?.sleep_consistency_pct ?? null}
          scoreState={(sleep?.score_state as 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE') ?? 'PENDING_SCORE'}
        />
      </div>

      {/* HRV trend */}
      <HRVChart
        data={hrvData}
        baseline={baseline}
        days={30}
        title="30-Day HRV Trend"
      />

      {/* Recent workouts */}
      <WorkoutList workouts={workouts as Parameters<typeof WorkoutList>[0]['workouts']} limit={5} />

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Team Overview',   href: '/dashboard/team',     Icon: Users,    color: '#6366f1' },
          { label: 'Sleep Analytics', href: '/dashboard/sleep',    Icon: Moon,     color: '#38bdf8' },
          { label: 'Workout Log',     href: '/dashboard/workouts', Icon: Dumbbell, color: '#0F6E56' },
          { label: 'HRV Deep Dive',   href: '/dashboard/hrv',      Icon: Activity, color: '#f59e0b' },
        ].map(({ label, href, Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border/80 transition-colors"
          >
            <Icon
              className="h-3.5 w-3.5 flex-shrink-0 transition-colors"
              style={{ color }}
              aria-hidden="true"
            />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

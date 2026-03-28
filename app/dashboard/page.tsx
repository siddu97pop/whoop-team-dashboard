import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import {
  getLatestRecovery,
  getLatestSleep,
  getWorkoutsForUser,
  getRecoveriesForUser,
} from '@/lib/supabase/queries'
import { DailyRingsCard } from '@/components/dashboard/DailyRingsCard'
import { SleepBreakdown } from '@/components/dashboard/SleepBreakdown'
import { HRVChart } from '@/components/dashboard/HRVChart'
import { WorkoutList } from '@/components/dashboard/WorkoutList'

export const revalidate = 300

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/api/whoop/connect')

  const [recovery, sleep, workouts, recoveries30d] = await Promise.all([
    getLatestRecovery(user.whoop_user_id).catch(() => null),
    getLatestSleep(user.whoop_user_id).catch(() => null),
    getWorkoutsForUser(user.whoop_user_id, 14).catch(() => []),
    getRecoveriesForUser(user.whoop_user_id, 30).catch(() => []),
  ])

  // Today's strain — sum of today's scored workout strains
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStrain = workouts
    .filter((w) => w.score_state === 'SCORED' && new Date(w.start_time) >= todayStart)
    .reduce((sum, w) => sum + (w.strain ?? 0), 0)

  // HRV chart data + 30-day baseline
  const hrvData = recoveries30d.map((r) => ({
    date: r.recorded_at,
    hrv: r.hrv_rmssd_milli,
    recovery: r.recovery_score,
  }))
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
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good {getGreeting()}, {user.first_name ?? 'there'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </div>

      {/* 3-ring overview */}
      <DailyRingsCard
        recoveryScore={recovery?.recovery_score ?? null}
        recoveryState={(recovery?.score_state as 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE') ?? 'PENDING_SCORE'}
        sleepPerformance={sleep?.sleep_performance_pct ?? null}
        sleepState={(sleep?.score_state as 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE') ?? 'PENDING_SCORE'}
        todayStrain={todayStrain > 0 ? todayStrain : null}
        hrv={recovery?.hrv_rmssd_milli ?? null}
        restingHR={recovery?.resting_heart_rate ?? null}
        spo2={recovery?.spo2_percentage ?? null}
        skinTemp={recovery?.skin_temp_celsius ?? null}
      />

      {/* Sleep breakdown */}
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
        respiratoryRate={sleep?.respiratory_rate ?? null}
        disturbanceCount={sleep?.disturbance_count ?? null}
        sleepCycleCount={sleep?.sleep_cycle_count ?? null}
        baselineMs={sleep?.baseline_milli ?? null}
        needFromSleepDebtMs={sleep?.need_from_sleep_debt_milli ?? null}
        needFromRecentStrainMs={sleep?.need_from_recent_strain_milli ?? null}
      />

      {/* HRV trend */}
      <HRVChart
        data={hrvData}
        baseline={baseline}
        days={30}
        title="30-Day HRV Trend"
      />

      {/* Recent workouts */}
      <WorkoutList workouts={workouts as Parameters<typeof WorkoutList>[0]['workouts']} limit={5} />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

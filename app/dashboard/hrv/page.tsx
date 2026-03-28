import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { getRecoveriesForUser } from '@/lib/supabase/queries'
import { HRVChart } from '@/components/dashboard/HRVChart'
import { HRVStats } from './HRVStats'

export const revalidate = 300

export default async function HRVPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/api/whoop/connect')

  const recoveries = await getRecoveriesForUser(user.whoop_user_id, 90).catch(() => [])

  const hrvData = recoveries.map((r) => ({
    date: r.recorded_at,
    hrv: r.hrv_rmssd_milli,
    recovery: r.recovery_score,
  }))

  const valid = recoveries.filter((r) => r.hrv_rmssd_milli != null)
  const baseline = valid.length
    ? Math.round(valid.reduce((s, r) => s + (r.hrv_rmssd_milli ?? 0), 0) / valid.length)
    : undefined

  const latest7 = valid.slice(-7)
  const avg7d = latest7.length
    ? Math.round(latest7.reduce((s, r) => s + (r.hrv_rmssd_milli ?? 0), 0) / latest7.length)
    : null

  const latestHRV = valid[valid.length - 1]?.hrv_rmssd_milli ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HRV Trends</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          90-day heart rate variability analysis
        </p>
      </div>

      <HRVStats
        latest={latestHRV}
        avg7d={avg7d}
        baseline={baseline ?? null}
        dataPoints={valid.length}
      />

      <HRVChart
        data={hrvData}
        baseline={baseline}
        days={90}
        title="90-Day HRV Trend"
      />
    </div>
  )
}
